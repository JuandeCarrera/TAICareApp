// src/routes/systemSettings.js
import { Router } from 'express';
import SystemSetting from '../models/SystemSetting.js';

const router = Router();

// GET compacto para la UI (devuelve objeto agrupado)
router.get('/', async (_req, res) => {
  try {
    const rows = await SystemSetting.find({}).lean();
    // aplanamos: { alerts_enabled, quiet_hours, ... }
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron cargar ajustes' });
  }
});

// PUT compacto desde UI
router.put('/', async (req, res) => {
  try {
    const { alerts_enabled, quiet_hours } = req.body || {};

    const ops = [];
    if (typeof alerts_enabled !== 'undefined') {
      ops.push(
        SystemSetting.updateOne(
          { key: 'alerts_enabled' },
          { $set: { key: 'alerts_enabled', value: !!alerts_enabled } },
          { upsert: true }
        )
      );
    }
    if (quiet_hours && typeof quiet_hours === 'object') {
      ops.push(
        SystemSetting.updateOne(
          { key: 'quiet_hours' },
          { $set: { key: 'quiet_hours', value: quiet_hours } },
          { upsert: true }
        )
      );
    }

    if (!ops.length) return res.status(400).json({ error: 'Sin cambios' });

    await Promise.all(ops);
    const rows = await SystemSetting.find({}).lean();
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Opcional: endpoint raw para crear cualquier clave {key,value}
router.post('/', async (req, res) => {
  try {
    const { key, value, note } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key requerida' });
    const s = await SystemSetting.findOneAndUpdate(
      { key },
      { $set: { key, value, note } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(s);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
