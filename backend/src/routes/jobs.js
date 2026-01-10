import { Router } from 'express'
import { runRoutineCheckerTick } from '../services/index.js'

const router = Router()

// Ejecuta el motor de chequeo de rutinas (genera alertas si procede)
async function handleRunTick(_req, res) {
  try {
    const result = await runRoutineCheckerTick()
    res.json({ ok: true, ...result })
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'Failed to run routine checker' })
  }
}

router.post('/routine-checker-tick', handleRunTick)

router.post('/routines/tick', handleRunTick)

export default router
