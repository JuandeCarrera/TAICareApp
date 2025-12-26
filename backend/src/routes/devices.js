import { Router } from 'express'
import Device from '../models/Device.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body, user: req.user.sub }
    const d = await Device.create(payload)
    res.status(201).json(d)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
router.get('/', async (req, res) => {
  res.json(await Device.find({ user: req.user.sub }))
})
router.get('/:id', async (req, res) => {
  const d = await Device.findById(req.params.id)
  if (!d) return res.sendStatus(404)
  res.json(d)
})
router.put('/:id', async (req, res) => {
  try {
    const d = await Device.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
    res.json(d)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
router.delete('/:id', async (req, res) => {
  await Device.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

export default router