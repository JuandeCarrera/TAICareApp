import { Router } from 'express';
import Routine from '../models/Routine.js';
import Device from '../models/Device.js';
import User from '../models/User.js';
import { getRoutinesStatusForDate } from '../services/routineChecker.js';

const router = Router();
const routinePopulate = [
  { path: 'user_id', select: 'name email role' },
  { path: 'caregiver_id', select: 'name email role' },
  { path: 'household_id', select: 'name' },
  { path: 'device_id', select: 'appliance plugmodel room household_id' },
];

// Crear
router.post('/', async (req, res) => {
  try {
    const { device_id, household_id } = req.body;
    const caregiver_id = req.user.sub;

    let hhId = household_id;
    if (!hhId && device_id) {
      const dev = await Device.findById(device_id).lean();
      hhId = dev?.household_id;
    }

    const r = await Routine.create({
      ...req.body,
      caregiver_id,
      household_id: hhId,
    });
    await r.populate(routinePopulate);
    res.status(201).json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Listar
router.get('/', async (_req, res) => {
  const data = await Routine.find().populate(routinePopulate);
  res.json(data);
});

// Obtener una
router.get('/:id', async (req, res) => {
  const r = await Routine.findById(req.params.id).populate(routinePopulate);
  if (!r) return res.sendStatus(404);
  res.json(r);
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const r = await Routine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(routinePopulate);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Borrar
router.delete('/:id', async (req, res) => {
  try {
    await Routine.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Estado por paciente y día
router.get('/status/by-patient', async (req, res) => {
  try {
    const { user_id, date } = req.query;
    if (!user_id || !date)
      return res.status(400).json({ error: 'Faltan user_id o date' });

    if (req.user?.role === 'cuidador') {
      const patient = await User.findOne({
        _id: user_id,
        caregiver_id: req.user.sub,
      });
      if (!patient)
        return res.status(403).json({ error: 'Paciente no autorizado' });
    }

    const data = await getRoutinesStatusForDate(user_id, date);
    res.json(data);
  } catch (e) {
    res
      .status(500)
      .json({ error: 'No se pudo obtener el estado de las rutinas' });
  }
});

export default router;
