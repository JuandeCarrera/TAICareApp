import { Router } from 'express'
import SystemSetting from '../models/SystemSetting.js'

const router = Router()

async function loadSettings() {
  let doc = await SystemSetting.findOne()
  if (!doc) doc = await SystemSetting.create({ alerts: { enabled: true } })
  return doc
}

router.get('/', async (_req, res) => {
  const s = await loadSettings()
  res.json(s)
})

router.put('/', async (req, res) => {
  try {
    const s = await loadSettings()
    s.set(req.body || {})
    await s.save()
    res.json(s)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
