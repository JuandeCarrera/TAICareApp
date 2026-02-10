import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Household from '../models/Household.js';
import Device from '../models/Device.js';

const { isValidObjectId } = mongoose;
const router = Router();

async function getCaregiverPatientIds(caregiverId) {
  const ids = await User.find(
    { caregiver_id: caregiverId, role: 'paciente' },
    { _id: 1 }
  ).lean();
  return ids.map((x) => x._id);
}
async function validateAndResolveOwner(req, ownerFromBody) {
  if (req.user?.role === 'admin') {
    if (!ownerFromBody || !isValidObjectId(ownerFromBody))
      throw new Error('owner inválido');
    const u = await User.findOne({ _id: ownerFromBody, role: 'paciente' });
    if (!u) throw new Error('owner no es un paciente válido');
    return u._id;
  }
  if (req.user?.role === 'cuidador') {
    if (!ownerFromBody || !isValidObjectId(ownerFromBody))
      throw new Error('Debes indicar el owner');

    // Permitir que el cuidador sea el owner temporalmente (ej: creando hogar antes que el paciente)
    if (ownerFromBody === req.user.sub) {
      return ownerFromBody;
    }

    const u = await User.findOne({
      _id: ownerFromBody,
      role: 'paciente',
      caregiver_id: req.user.sub,
    });
    if (!u) throw new Error('El owner no es un paciente tuyo');
    return u._id;
  }
  throw new Error('Rol no permitido');
}
async function canAccessHousehold(req, householdDocOrId) {
  let h = householdDocOrId;
  if (!h || !h.owner) {
    h = await Household.findById(householdDocOrId).lean();
    if (!h) return false;
  }
  const ownerId = String(h.owner);
  if (req.user?.role === 'admin') return true;
  if (req.user?.role === 'cuidador') {
    // El owner puede ser uno de sus pacientes O él mismo
    if (ownerId === req.user.sub) return true;
    const ids = await getCaregiverPatientIds(req.user.sub);
    return ids.map(String).includes(ownerId);
  }
  return false;
}

// Crear
router.post('/', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name)
      return res
        .status(400)
        .json({ error: 'El nombre del hogar es obligatorio' });

    const owner = await validateAndResolveOwner(req, req.body?.owner);

    // user_ids opcionales (además del owner)
    const rawUserIds = Array.isArray(req.body?.user_ids)
      ? req.body.user_ids
      : [];
    // Validaciones de pertenencia si el rol es cuidador
    if (req.user?.role === 'cuidador' && rawUserIds.length) {
      const ids = await getCaregiverPatientIds(req.user.sub);
      const allowed = new Set(ids.map(String));
      for (const u of rawUserIds) {
        if (!allowed.has(String(u))) {
          return res
            .status(400)
            .json({ error: 'Incluyes pacientes que no son tuyos' });
        }
      }
    }

    const uniqueUsers = [
      ...new Set([String(owner), ...rawUserIds.map(String)]),
    ];

    const h = await Household.create({
      name,
      address: (req.body?.address || '').trim(),
      rooms: [],
      users: uniqueUsers,
      owner,
    });

    // Sincroniza household_id en usuarios
    await User.updateMany(
      { _id: { $in: uniqueUsers } },
      { $set: { household_id: h._id } }
    );

    const populated = await Household.findById(h._id)
      .populate('users', 'name email role')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    if (e?.code === 11000)
      return res
        .status(400)
        .json({ error: 'Ya existe un hogar con ese nombre' });
    res.status(400).json({ error: e.message || 'No se pudo crear el hogar' });
  }
});

// Listar
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.user?.role === 'admin') {
      // sin filtro
    } else if (req.user?.role === 'paciente') {
      filter.owner = req.user.sub;
    } else if (req.user?.role === 'cuidador') {
      const ids = await getCaregiverPatientIds(req.user.sub);
      // Mostrar hogares de sus pacientes Y los propios (temporales)
      filter.owner = { $in: [...ids, req.user.sub] };
    } else {
      return res.sendStatus(403);
    }

    const list = await Household.find(filter)
      .populate({
        path: 'users',
        select: 'name email role',
        strictPopulate: false,
      })
      .lean();

    res.json(list);
  } catch (e) {
    console.error('GET /households failed:', e); // << log
    res
      .status(500)
      .json({ error: e.message || 'No se pudieron listar hogares' });
  }
});

// Obtener uno
router.get('/:id', async (req, res) => {
  try {
    const h = await Household.findById(req.params.id).populate(
      'users',
      'name email role'
    );
    if (!h) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, h))) return res.sendStatus(403);
    res.json(h);
  } catch {
    res.sendStatus(404);
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const prev = await Household.findById(req.params.id).lean();
    if (!prev) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, prev))) return res.sendStatus(403);

    let nextUsers = Array.isArray(req.body.users)
      ? req.body.users.map(String)
      : null;

    if (req.body.owner) {
      const newOwner = await validateAndResolveOwner(req, req.body.owner);
      req.body.owner = newOwner;
      if (nextUsers) nextUsers = [...new Set([String(newOwner), ...nextUsers])];
    }

    if (!nextUsers) {
      const stableOwner = String(req.body.owner || prev.owner);
      nextUsers = [
        ...new Set([stableOwner, ...(prev.users || []).map(String)]),
      ];
      req.body.users = nextUsers;
    }

    // Validación cuidador -> solo sus pacientes
    if (req.user?.role === 'cuidador') {
      const ids = await getCaregiverPatientIds(req.user.sub);
      const allowed = new Set(ids.map(String));
      for (const u of nextUsers) {
        if (
          !allowed.has(String(u)) &&
          String(u) !== String(prev.owner) &&
          String(u) !== String(req.body.owner || prev.owner)
        ) {
          return res
            .status(400)
            .json({ error: 'Incluyes pacientes que no son tuyos' });
        }
      }
    }

    const h = await Household.findByIdAndUpdate(
      req.params.id,
      { ...req.body, users: nextUsers },
      { new: true, runValidators: true }
    ).populate('users', 'name email role');

    if (!h) return res.sendStatus(404);

    const prevSet = new Set((prev.users || []).map(String));
    const nextSet = new Set((h.users || []).map((u) => String(u._id || u)));

    const toRemove = [...prevSet].filter((u) => !nextSet.has(u));
    const toAdd = [...nextSet].filter((u) => !prevSet.has(u));

    if (toRemove.length) {
      await User.updateMany(
        { _id: { $in: toRemove }, household_id: h._id },
        { $unset: { household_id: '' } }
      );
    }
    if (toAdd.length) {
      await User.updateMany(
        { _id: { $in: toAdd } },
        { $set: { household_id: h._id } }
      );
    }

    if (Array.isArray(req.body.rooms)) {
      const oldRooms = Array.isArray(prev.rooms) ? prev.rooms : [];
      const newRooms = req.body.rooms;
      const len = Math.min(oldRooms.length, newRooms.length);
      for (let i = 0; i < len; i++) {
        const oldName = oldRooms[i],
          newName = newRooms[i];
        if (oldName && newName && oldName !== newName) {
          await Device.updateMany(
            { household_id: h._id, room: oldName },
            { $set: { room: newName } }
          );
        }
      }
    }

    res.json(h);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Borrar
router.delete('/:id', async (req, res) => {
  try {
    const h = await Household.findById(req.params.id);
    if (!h) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, h))) return res.sendStatus(403);
    await Household.deleteOne({ _id: h._id });
    res.sendStatus(204);
  } catch {
    res.sendStatus(400);
  }
});

// Añadir habitación
router.put('/:id/rooms', async (req, res) => {
  try {
    const hPrev = await Household.findById(req.params.id);
    if (!hPrev) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, hPrev))) return res.sendStatus(403);

    const h = await Household.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { rooms: req.body.room } },
      { new: true }
    ).populate('users', 'name email role');

    if (!h) return res.sendStatus(404);
    res.json(h);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
