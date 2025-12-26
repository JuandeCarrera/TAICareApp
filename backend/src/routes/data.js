import { Router } from 'express'
import Data from '../models/Data.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const dt = await Data.create(req.body)
    res.status(201).json(dt)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
router.get('/', async (_req, res) => {
  res.json(await Data.find().sort({ time: -1 }))
})
router.get('/:id', async (req, res) => {
  const dt = await Data.findById(req.params.id)
  if (!dt) return res.sendStatus(404)
  res.json(dt)
})
router.put('/:id', async (req, res) => {
  try {
    const dt = await Data.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
    res.json(dt)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
router.delete('/:id', async (req, res) => {
  await Data.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

export default router