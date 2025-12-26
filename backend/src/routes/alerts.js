import { Router } from 'express'
import RoutinePreset from '../models/RoutinePreset.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, expected_start, expected_end, days, description } = req.body || {}
    if (!name || !expected_start || !expected_end || !Array.isArray(days) || !days.length) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }
    const p = await RoutinePreset.create({
      owner: req.user.sub,
      name: name.trim(),
      expected_start, expected_end, days,
      description: (description || '').trim()
    })
    res.status(201).json(p)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/', async (req, res) => {
  const list = await RoutinePreset.find({ owner: req.user.sub }).sort({ createdAt: -1 })
  res.json(list)
})

router.get('/:id', async (req, res) => {
  const p = await RoutinePreset.findOne({ _id:req.params.id, owner:req.user.sub })
  if (!p) return res.sendStatus(404)
  res.json(p)
})

router.put('/:id', async (req, res) => {
  try {
    const upd = await RoutinePreset.findOneAndUpdate(
      { _id:req.params.id, owner:req.user.sub },
      req.body,
      { new:true, runValidators:true }
    )
    if (!upd) return res.sendStatus(404)
    res.json(upd)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  const del = await RoutinePreset.findOneAndDelete({ _id:req.params.id, owner:req.user.sub })
  if (!del) return res.sendStatus(404)
  res.sendStatus(204)
})

export default router