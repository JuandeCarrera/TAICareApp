import { Router } from 'express';
import AlertRule from '../models/AlertRule.js';

const router = Router();

router.get('/', async (_req, res) => {
  const list = await AlertRule.find().sort({ createdAt: -1 });
  res.json(list);
});

router.post('/', async (req, res) => {
  try {
    const doc = await AlertRule.create(req.body || {});
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await AlertRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.sendStatus(404);
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  const del = await AlertRule.findByIdAndDelete(req.params.id);
  if (!del) return res.sendStatus(404);
  res.sendStatus(204);
});

export default router;
