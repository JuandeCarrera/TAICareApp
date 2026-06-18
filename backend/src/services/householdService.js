import Household from '../models/Household.js';
import User from '../models/User.js';
import Device from '../models/Device.js';
import { isValidObjectId } from 'mongoose';

// Helpers internos
async function getCaregiverPatientIds(caregiverId) {
  const ids = await User.find(
    { caregiver_id: caregiverId, role: 'paciente' },
    { _id: 1 }
  ).lean();
  return ids.map((x) => x._id.toString());
}

async function validateAndResolveOwner(currentUser, ownerFromBody) {
  if (currentUser.role === 'admin') {
    if (!ownerFromBody || !isValidObjectId(ownerFromBody))
      throw new Error('Owner inválido');
    const u = await User.findOne({ _id: ownerFromBody, role: 'paciente' });
    if (!u) throw new Error('Owner no es un paciente válido');
    return u._id;
  }
  if (currentUser.role === 'cuidador') {
    if (!ownerFromBody || !isValidObjectId(ownerFromBody))
      throw new Error('Debes indicar el owner');

    // Permitir que el cuidador sea el owner temporalmente
    if (ownerFromBody === currentUser.sub) {
      return ownerFromBody;
    }

    const u = await User.findOne({
      _id: ownerFromBody,
      role: 'paciente',
      caregiver_id: currentUser.sub,
    });
    if (!u) throw new Error('El owner no es un paciente tuyo');
    return u._id;
  }
  throw new Error('Rol no permitido para asignar owner');
}

async function canAccessHousehold(currentUser, householdDocOrId) {
  let h = householdDocOrId;
  if (!h || !h.owner) {
    h = await Household.findById(householdDocOrId).lean();
    if (!h) return false;
  }
  const ownerId = String(h.owner);
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'cuidador') {
    if (ownerId === currentUser.sub) return true;
    const ids = await getCaregiverPatientIds(currentUser.sub);
    return ids.includes(ownerId);
  }
  // Paciente: solo si es el owner
  if (currentUser.role === 'paciente') {
    return ownerId === currentUser.sub;
  }
  return false;
}

// --- Servicios Públicos ---

export const createHousehold = async (data, currentUser) => {
  const name = (data.name || '').trim();
  if (!name) throw new Error('El nombre del hogar es obligatorio');

  const owner = await validateAndResolveOwner(currentUser, data.owner);

  const rawUserIds = Array.isArray(data.user_ids) ? data.user_ids : [];

  if (currentUser.role === 'cuidador' && rawUserIds.length) {
    const ids = await getCaregiverPatientIds(currentUser.sub);
    const allowed = new Set(ids);
    for (const u of rawUserIds) {
      if (!allowed.has(String(u))) {
        throw new Error('Incluyes pacientes que no son tuyos');
      }
    }
  }

  const uniqueUsers = [...new Set([String(owner), ...rawUserIds.map(String)])];

  const h = await Household.create({
    name,
    address: (data.address || '').trim(),
    rooms: [],
    users: uniqueUsers,
    owner,
  });

  await User.updateMany(
    { _id: { $in: uniqueUsers } },
    { $set: { household_id: h._id } }
  );

  return Household.findById(h._id).populate('users', 'name email role').lean();
};

export const listHouseholds = async (currentUser) => {
  let filter = {};
  if (currentUser.role === 'admin') {
    // sin filtro
  } else if (currentUser.role === 'paciente') {
    filter.owner = currentUser.sub;
  } else if (currentUser.role === 'cuidador') {
    const ids = await getCaregiverPatientIds(currentUser.sub);
    filter.owner = { $in: [...ids, currentUser.sub] };
  } else {
    throw new Error('No autorizado');
  }

  return Household.find(filter)
    .populate({
      path: 'users',
      select: 'name email role',
      strictPopulate: false,
    })
    .lean();
};

export const getHouseholdById = async (id, currentUser) => {
  const h = await Household.findById(id).populate('users', 'name email role');
  if (!h) throw { statusCode: 404, message: 'Hogar no encontrado' };
  if (!(await canAccessHousehold(currentUser, h)))
    throw { statusCode: 403, message: 'No autorizado' };
  return h;
};

export const updateHousehold = async (id, data, currentUser) => {
  const prev = await Household.findById(id).lean();
  if (!prev) throw { statusCode: 404, message: 'Hogar no encontrado' };
  if (!(await canAccessHousehold(currentUser, prev)))
    throw { statusCode: 403, message: 'No autorizado' };

  let nextUsers = Array.isArray(data.users) ? data.users.map(String) : null;

  if (data.owner) {
    const newOwner = await validateAndResolveOwner(currentUser, data.owner);
    data.owner = newOwner;
    if (nextUsers) nextUsers = [...new Set([String(newOwner), ...nextUsers])];
  }

  if (!nextUsers) {
    const stableOwner = String(data.owner || prev.owner);
    nextUsers = [...new Set([stableOwner, ...(prev.users || []).map(String)])];
    data.users = nextUsers;
  }

  if (currentUser.role === 'cuidador') {
    const ids = await getCaregiverPatientIds(currentUser.sub);
    const allowed = new Set(ids);
    for (const u of nextUsers) {
      if (
        !allowed.has(String(u)) &&
        String(u) !== String(prev.owner) &&
        String(u) !== String(data.owner || prev.owner) &&
        String(u) !== currentUser.sub // Allow self
      ) {
        throw new Error('Incluyes pacientes que no son tuyos');
      }
    }
  }

  const h = await Household.findByIdAndUpdate(
    id,
    { ...data, users: nextUsers },
    { new: true, runValidators: true }
  ).populate('users', 'name email role');

  if (!h) throw { statusCode: 404, message: 'Hogar no encontrado' };

  // Sync users
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

  // Rename rooms if needed
  if (Array.isArray(data.rooms)) {
    const oldRooms = Array.isArray(prev.rooms) ? prev.rooms : [];
    const newRooms = data.rooms;
    const len = Math.min(oldRooms.length, newRooms.length);
    for (let i = 0; i < len; i++) {
      const oldName = oldRooms[i];
      const newName = newRooms[i];
      if (oldName && newName && oldName !== newName) {
        await Device.updateMany(
          { household_id: h._id, room: oldName },
          { $set: { room: newName } }
        );
      }
    }
  }

  return h;
};

export const deleteHousehold = async (id, currentUser) => {
  const h = await Household.findById(id);
  if (!h) throw { statusCode: 404, message: 'Hogar no encontrado' };
  if (!(await canAccessHousehold(currentUser, h)))
    throw { statusCode: 403, message: 'No autorizado' };

  await Household.deleteOne({ _id: h._id });
};

export const addRoom = async (id, roomName, currentUser) => {
  const hPrev = await Household.findById(id);
  if (!hPrev) throw { statusCode: 404, message: 'Hogar no encontrado' };
  if (!(await canAccessHousehold(currentUser, hPrev)))
    throw { statusCode: 403, message: 'No autorizado' };

  const h = await Household.findOneAndUpdate(
    { _id: id },
    { $push: { rooms: roomName } },
    { new: true }
  ).populate('users', 'name email role');

  if (!h) throw { statusCode: 404, message: 'Hogar no encontrado' };
  return h;
};
