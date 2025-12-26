import { Router } from 'express'
import { runRoutineCheckerTick } from '../services/index.js'

const router = Router()

// Dispara manualmente el checker de rutinas (útil para pruebas)
router.post('/routine-checker-tick', async (_req, res) => {
  try {
    const result = await runRoutineCheckerTick()
    res.json({ ok: true, ...result })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

export default router
