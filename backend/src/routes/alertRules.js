// src/routes/alertRules.js
import { Router } from 'express';
import AlertRule from '../models/AlertRule.js';

const router = Router();

// LISTAR reglas (puedes filtrar por enabled/type si quieres)
router.get('/', async (req, res) => {
  try {
    const { enabled, type } = req.query;
    const filter = {};
    if (enabled === 'true') filter.enabled = true;
    if (enabled === 'false') filter.enabled = false;
    if (type) filter['condition.kind'] = type; // opcional, según tu schema

    const rules = await AlertRule.find(filter).sort({ createdAt: -1 }).lean();
    res.json(rules);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron listar reglas' });
  }
});

// CREAR regla
router.post('/', async (req, res) => {
  try {
    // Espera cuerpo con { name, enabled, kind, type, severity, ... }
    const {
      name,
      enabled = true,
      kind = 'RoutineMissed', // UI lo llama "kind"
      type = 'routine_missed', // tipo técnico
      severity = 'MEDIUM',
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    // Adaptamos a tu schema de AlertRule (condition.*)
    const doc = await AlertRule.create({
      name: name.trim(),
      scope: 'global', // o el que uses
      condition: {
        kind: 'custom', // usamos 'custom' para no chocar con enum si lo tienes estricto
        params: { kindUI: kind, type }, // guardo lo que viene de la UI
        severity: (severity || 'MEDIUM').toLowerCase(), // si tu schema usa lower
        enabled: true,
      },
      dedupe_strategy: 'per_day',
    });

    // Pero también puedes mapear 1:1 si tu schema es el que te pasé antes:
    // const doc = await AlertRule.create({
    //   name: name.trim(),
    //   scope: 'global',
    //   condition: {
    //     kind: 'routine_missed',
    //     params: {},
    //     active_days: [],
    //     time_start: null,
    //     time_end: null,
    //     severity: (severity || 'MEDIUM').toLowerCase(),
    //     enabled: !!enabled
    //   },
    //   dedupe_strategy: 'per_day'
    // });

    // Para no romper tu UI, devolvemos `enabled` arriba
    const out = { ...doc.toObject(), enabled: !!enabled };
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ACTUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Permitimos actualizar enabled y algunos campos simples
    const patch = {};
    if ('enabled' in req.body) {
      // guardo en condition.enabled para ser consistente
      patch['condition.enabled'] = !!req.body.enabled;
    }
    if ('name' in req.body) {
      patch.name = String(req.body.name || '').trim();
    }
    if ('severity' in req.body) {
      patch['condition.severity'] = String(
        req.body.severity || ''
      ).toLowerCase();
    }

    const upd = await AlertRule.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean();

    if (!upd) return res.sendStatus(404);
    res.json(upd);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// BORRAR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const del = await AlertRule.findByIdAndDelete(id);
    if (!del) return res.sendStatus(404);
    res.sendStatus(204);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
