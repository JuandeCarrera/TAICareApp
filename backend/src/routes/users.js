import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const {
  isValidObjectId,
  Types: { ObjectId },
} = mongoose;
const router = Router();

// GET /users
router.get('/', async (req, res) => {
  try {
    const { role, caregiver_id } = req.query;
    const filter = {};

    if (req.user?.role === 'cuidador') {
      filter.role = 'paciente';
      filter.caregiver_id = req.user.sub;
    } else if (req.user?.role === 'admin') {
      if (role) filter.role = role;
      if (caregiver_id && isValidObjectId(caregiver_id)) {
        filter.caregiver_id = new ObjectId(caregiver_id);
      }
    } else {
      filter._id = req.user.sub;
    }

    const users = await User.find(filter).lean();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron listar usuarios' });
  }
});

// POST /users
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    if (req.user?.role === 'cuidador') {
      body.role = 'paciente';
      body.caregiver_id = req.user.sub;
      if (!body.password) {
        body.password =
          Math.random().toString(36).slice(2) +
          Math.random().toString(36).slice(2);
      }
    }
    const u = await User.create(body);
    res.status(201).json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: 'id inválido' });

  const baseFilter = { _id: id };
  if (req.user?.role === 'cuidador') baseFilter.caregiver_id = req.user.sub;
  else if (req.user?.role !== 'admin' && req.user?.sub !== id)
    return res.sendStatus(403);

  const u = await User.findOne(baseFilter);
  if (!u) return res.sendStatus(404);
  res.json(u);
});

// PUT /users/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: 'id inválido' });

    const allowedForAdmin = [
      'name',
      'email',
      'role',
      'history',
      'household_id',
    ];
    const allowedForCaregiver = ['name', 'email', 'history', 'household_id'];
    const allowedForSelf = ['name', 'email', 'history', 'household_id'];

    let allowed = allowedForAdmin;
    if (req.user?.role === 'cuidador') allowed = allowedForCaregiver;
    else if (req.user?.role !== 'admin' && req.user?.sub === id)
      allowed = allowedForSelf;

    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    if (!Object.keys(update).length)
      return res.status(400).json({ error: 'Sin cambios permitidos' });

    const filter =
      req.user?.role === 'cuidador'
        ? { _id: id, caregiver_id: req.user.sub }
        : { _id: id };

    const u = await User.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
    });
    if (!u) return res.sendStatus(404);
    res.json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return res.status(400).json({ error: 'id inválido' });

  let filter = { _id: id };
  if (req.user?.role === 'cuidador') filter.caregiver_id = req.user.sub;
  else if (req.user?.role !== 'admin' && req.user?.sub !== id)
    return res.sendStatus(403);

  const deleted = await User.findOneAndDelete(filter);
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(204);
});

export default router;
