import { alertsEnabled, processTick } from './alertEngine.js'

export async function runRoutineCheckerTick() {
  if (!(await alertsEnabled())) {
    return { ok: true, ran: false, reason: 'alerts_disabled' }
  }
  const result = await processTick().catch(err => ({ error: err?.message }))
  if (result?.error) return { ok: false, ran: false, error: result.error }
  return { ok: true, ran: true, result }
}

// Scheduler opcional en memoria
let _timer = null
const DEFAULT_MS = 60_000 // 1 minuto

export async function startJobs() {
  if (_timer) return { ok: true, running: true }
  _timer = setInterval(() => {
    runRoutineCheckerTick().catch(() => {})
  }, DEFAULT_MS)
  return { ok: true, running: true }
}

export async function stopJobs() {
  if (_timer) {
    clearInterval(_timer)
    _timer = null
  }
  return { ok: true, running: false }
}