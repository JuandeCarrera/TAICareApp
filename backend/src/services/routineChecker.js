import Routine from '../models/Routine.js'
import Data from '../models/Data.js'
import RoutineOccurrence from '../models/routineOccurrence.js'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// Helpers
function dayStart(dateLike) {
  const d = new Date(dateLike)
  d.setHours(0,0,0,0)
  return d
}
function buildWindowForDate(dateLike, startHHMM, endHHMM) {
  const [sh, sm] = String(startHHMM || '08:00').split(':').map(Number)
  const [eh, em] = String(endHHMM   || '09:00').split(':').map(Number)

  const base = dayStart(dateLike)

  const windowStart = new Date(base); windowStart.setHours(sh||0, sm||0, 0, 0)
  const windowEnd   = new Date(base); windowEnd.setHours(eh||0, em||0, 0, 0)

  // Cruce de medianoche
  if (windowEnd <= windowStart) {
    windowEnd.setDate(windowEnd.getDate() + 1)
  }
  return { windowStart, windowEnd }
}

/**
 * Calcula el estado de UNA occurrence en una fecha concreta.
 * NO persiste nada (devuelve resultado para el motor de alertas).
 */
async function evaluateOccurrence({ routine, occurrence, date, powerThresholdW = 5 }) {
  const { windowStart, windowEnd } = buildWindowForDate(date, occurrence.start, occurrence.end)

  // Aseguramos ids planos
  const deviceIds = (occurrence.device_ids || [])
    .map(d => (typeof d === 'object' ? (d?._id || d?.id) : d))
    .filter(Boolean)

  let matchedEvents = 0
  if (deviceIds.length) {
    matchedEvents = await Data.countDocuments({
      device_id: { $in: deviceIds },
      time:  { $gte: windowStart, $lt: windowEnd },
      power: { $gte: powerThresholdW }
    })
  }

  const status = matchedEvents > 0 ? 'COMPLETED' : 'MISSED'

  return {
    routine: {
      _id:           routine._id,
      name:          routine.name,
      user_id:       routine.user_id,
      caregiver_id:  routine.caregiver_id,
      household_id:  routine.household_id,
    },
    occurrence: {
      // Nota: en subdocumentos, Mongoose asigna _id a cada occurrence
      _id:          occurrence._id,
      start:        occurrence.start,
      end:          occurrence.end,
      days:         occurrence.days || [],
      device_ids:   deviceIds,
    },
    windowStart,
    windowEnd,
    status,
    matchedEvents,
  }
}

/**
 * Devuelve estado POR OCCURRENCE para todas las occurrences de un paciente en esa fecha.
 * (Esto alimenta alertEngine.processTick)
 */
export async function getRoutinesStatusForDate(userId, dateLike) {
  const baseDay = dayStart(dateLike)
  const dayName = DAY_NAMES[baseDay.getDay()]

  const routines = await Routine.find({
    user_id: userId,
    'occurrences.days': dayName
  }).lean()

  const out = []
  for (const r of routines) {
    const todays = (r.occurrences || []).filter(o => Array.isArray(o.days) && o.days.includes(dayName))
    for (const occ of todays) {
      const res = await evaluateOccurrence({ routine: r, occurrence: occ, date: baseDay })
      out.push(res)
    }
  }
  return out
}

/**
 * Evalúa TODO el sistema para una fecha.
 * - Devuelve resultados por occurrence (como getRoutinesStatusForDate, pero para todos).
 * - (Opcional) Persiste UN documento agregado por rutina+día en tu RoutineOccurrence existente.
 */
export async function evaluateAllForDate(dateLike, { persistAggregate = true } = {}) {
  const baseDay = dayStart(dateLike)
  const dayName = DAY_NAMES[baseDay.getDay()]

  const routines = await Routine.find({ 'occurrences.days': dayName }).lean()

  let checked = 0
  const results = []

  for (const r of routines) {
    const todays = (r.occurrences || []).filter(o => Array.isArray(o.days) && o.days.includes(dayName))

    // Evaluamos todas las occurrences de esta rutina
    const perRoutine = []
    for (const occ of todays) {
      const res = await evaluateOccurrence({ routine: r, occurrence: occ, date: baseDay })
      perRoutine.push(res)
      results.push(res)
      checked += 1
    }

    if (persistAggregate && perRoutine.length > 0) {
      // “Peor” estado del día (si hay alguna MISSED => MISSED; si todas COMPLETED => COMPLETED; si no hay lecturas ni occurrences => PENDING)
      const hasMissed   = perRoutine.some(x => x.status === 'MISSED')
      const hasComplete = perRoutine.some(x => x.status === 'COMPLETED')
      const aggregatedStatus = hasMissed ? 'MISSED' : (hasComplete ? 'COMPLETED' : 'PENDING')

      // Suma de lecturas
      const totalMatched = perRoutine.reduce((acc, x) => acc + (x.matchedEvents || 0), 0)

      // Device “representativo” (el primero que aparezca)
      const firstDev =
        perRoutine.find(x => (x.occurrence.device_ids || []).length)?.occurrence.device_ids[0] || null

      // Ventana “agregada” (mínimo inicio, máximo fin)
      const minStart = perRoutine.reduce((d, x) => !d || x.windowStart < d ? x.windowStart : d, null)
      const maxEnd   = perRoutine.reduce((d, x) => !d || x.windowEnd   > d ? x.windowEnd   : d, null)

      await RoutineOccurrence.findOneAndUpdate(
        { routineId: r._id, date: baseDay },
        {
          $setOnInsert: {
            caregiver_id: r.caregiver_id || undefined,
            household_id: r.household_id || undefined,
          },
          $set: {
            device_id: firstDev || undefined,
            windowStart: minStart || baseDay,
            windowEnd:   maxEnd   || new Date(baseDay.getTime() + 24*60*60*1000),
            status: aggregatedStatus,
            matchedEvents: totalMatched,
            checkedAt: new Date(),
          }
        },
        { new: true, upsert: true }
      ).lean()
    }
  }

  return { ok: true, date: baseDay, checked, results }
}
