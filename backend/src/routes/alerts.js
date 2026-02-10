// backend/src/routes/alerts.js
import { Router } from 'express';
import Alert from '../models/Alert.js';
import User from '../models/User.js';

const router = Router();

/**
 * GET /alerts
 * - admin: ve todas
 * - cuidador: ve alertas de sus pacientes
 * - paciente: ve solo sus alertas
 * Opcionalmente acepta ?resolved=true|false y ?type=...
 */
router.get('/', async (req, res) => {
  try {
    const { resolved, type } = req.query;

    let filter = {};
    if (typeof resolved !== 'undefined' && resolved !== '') {
      filter.resolved = resolved === 'true';
    }
    if (type) filter.type = type;

    if (req.user?.role === 'paciente') {
      // solo las suyas
      filter.user_id = req.user.sub;
    } else if (req.user?.role === 'cuidador') {
      // alertas de sus pacientes
      const pats = await User.find(
        { caregiver_id: req.user.sub, role: 'paciente' },
        { _id: 1 }
      ).lean();
      const ids = pats.map((p) => p._id);
      // si no tiene pacientes, no hay alertas
      filter.user_id = { $in: ids.length ? ids : ['000000000000000000000000'] };
    } else if (req.user?.role === 'admin') {
      // sin filtro extra
    } else {
      return res.sendStatus(403);
    }

    const data = await Alert.find(filter)
      .sort({ timestamp: -1, createdAt: -1 })
      .populate({
        path: 'device_id',
        select: 'appliance plugmodel room household_id',
      })
      .populate({ path: 'user_id', select: 'name email' })
      .populate({ path: 'routine_id', select: 'name' })
      .lean();

    // Fallback de título por si algunos docs no lo tienen
    const hydrated = data.map((a) => {
      if (a.title && a.title.trim()) return a;
      const patient = a.patient_name_snapshot || a.user_id?.name || '';
      const routine = a.routine_name_snapshot || a.routine_id?.name || '';
      const parts = [];
      if (patient) parts.push(`Paciente: ${patient}`);
      if (routine) parts.push(`Rutina: ${routine}`);
      if (a.type) parts.push(a.type);
      return { ...a, title: parts.length ? parts.join(' · ') : 'Alerta' };
    });

    res.json(hydrated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudieron listar alertas' });
  }
});

/**
 * GET /alerts/debug/count  (temporal para diagnóstico)
 * Cuenta alertas reales en BD sin filtrar por rol.
 */
router.get('/debug/count', async (_req, res) => {
  const total = await Alert.countDocuments({});
  res.json({ total });
});

/**
 * PUT /alerts/:id
 * PATCH básico para marcar seen/resolved, etc.
 */
router.put('/:id', async (req, res) => {
  try {
    const a = await Alert.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!a) return res.sendStatus(404);
    res.json(a);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * DELETE /alerts/:id
 */
router.delete('/:id', async (req, res) => {
  await Alert.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

export default router;
