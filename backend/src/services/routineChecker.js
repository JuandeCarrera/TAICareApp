import Routine from '../models/Routine.js';
import RoutineOccurrence from '../models/routineOccurrence.js';
import Data from '../models/Data.js';
import User from '../models/User.js';

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const z2 = n => String(n).padStart(2, '0');

function dayStart(dateLike) {
  const d = new Date(dateLike);
  d.setHours(0,0,0,0);
  return d;
}
function sameDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function windowFor(date, startHHMM, endHHMM) {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);

  const base = dayStart(date);

  const ws = new Date(base); ws.setHours(sh ?? 0, sm ?? 0, 0, 0);
  let we = new Date(base);   we.setHours(eh ?? 0, em ?? 0, 0, 0);

  // Si el fin es "menor o igual" que el inicio => cruza a día siguiente
  if (we <= ws) {
    we = new Date(we.getTime() + 24*60*60*1000);
  }
  return { windowStart: ws, windowEnd: we };
}

/**
 * Evalúa una occurrence (subdoc) de una rutina para una fecha.
 * - Busca actividad por cada device_id dentro de la ventana.
 * - Crea/actualiza RoutineOccurrence (único por routine_id + occurrence_id + date).
 * - Devuelve el resultado.
 */
export async function evaluateOccurrenceForDate({ routine, occurrence, date, powerThresholdW = 5 }) {
  const { windowStart, windowEnd } = windowFor(date, occurrence.expected_start, occurrence.expected_end);

  // Lecturas por dispositivo
  const summary = [];
  let totalMatched = 0;

  for (const devId of occurrence.device_ids) {
    const readings = await Data.find({
      device_id: devId,
      time:  { $gte: windowStart, $lt: windowEnd },
      power: { $gte: powerThresholdW }
    }).lean();

    summary.push({
      device_id: devId,
      matchedEvents: readings.length,
      minutesActive: 0,
    });

    totalMatched += readings.length;
  }

  // Criterio de cumplimiento:
  //  - COMPLETED si hubo actividad en AL MENOS UNO de los dispositivos
  const status = totalMatched > 0 ? 'COMPLETED' : 'MISSED';

  // date lógico = 00:00 del día base (no la hora del windowStart)
  const logicalDate = dayStart(date);

  // Upsert de RoutineOccurrence (una fila por routine+occurrence+date)
  const doc = await RoutineOccurrence.findOneAndUpdate(
    {
      routine_id:    routine._id,
      occurrence_id: occurrence._id,
      date:          logicalDate
    },
    {
      $setOnInsert: {
        user_id:      routine.user_id,
        caregiver_id: routine.caregiver_id || undefined,
        household_id: routine.household_id || undefined,
        device_ids:   occurrence.device_ids,
      },
      $set: {
        windowStart, windowEnd,
        status,
        checkedAt: new Date(),
        summary,
        matchedEvents: totalMatched
      }
    },
    { new: true, upsert: true }
  ).lean();

  // Estructura de salida homogénea
  return {
    routine: {
      _id: routine._id,
      name: routine.name,
      user_id: routine.user_id,
      caregiver_id: routine.caregiver_id,
      household_id: routine.household_id
    },
    occurrence: {
      _id: occurrence._id,
      expected_start: occurrence.expected_start,
      expected_end: occurrence.expected_end,
      days: occurrence.days,
      device_ids: occurrence.device_ids
    },
    windowStart, windowEnd,
    status: doc.status,
    matchedEvents: doc.matchedEvents,
    summary: doc.summary
  };
}

/**
 * Devuelve el estado de TODAS las occurrences de un paciente para una fecha concreta.
 * Recorre rutinas con occurrences que contengan el día de la semana dado.
 */
export async function getRoutinesStatusForDate(userId, dateLike) {
  const baseDay = dayStart(dateLike);
  const dayName = DAY_NAMES[baseDay.getDay()];

  // Rutinas de ese paciente que tengan al menos una occurrence activa ese día
  const routines = await Routine.find({
    user_id: userId,
    'occurrences.days': dayName
  }).lean();

  const results = [];
  for (const r of routines) {
    // occurrences que aplican al día
    const todays = (r.occurrences || []).filter(occ => (occ.days || []).includes(dayName));
    for (const occ of todays) {
      const res = await evaluateOccurrenceForDate({ routine: r, occurrence: occ, date: baseDay });
      results.push(res);
    }
  }
  return results;
}

/**
 * Evalúa TODAS las occurrences del sistema para una fecha.
 * Útil para jobs programados (cron) o para el endpoint /jobs/routines/tick
 */
export async function evaluateAllForDate(dateLike) {
  const baseDay = dayStart(dateLike);
  const dayName = DAY_NAMES[baseDay.getDay()];

  // Todas las rutinas que tengan occurrences con ese día
  const routines = await Routine.find({ 'occurrences.days': dayName }).lean();
  let checked = 0;
  let createdOrUpdated = 0;

  const results = [];
  for (const r of routines) {
    const todays = (r.occurrences || []).filter(occ => (occ.days || []).includes(dayName));
    for (const occ of todays) {
      const res = await evaluateOccurrenceForDate({ routine: r, occurrence: occ, date: baseDay });
      results.push(res);
      checked += 1;
      // contamos como “actualizado/creado” siempre que se hizo upsert (para simple métrica)
      createdOrUpdated += 1;
    }
  }

  return { ok: true, date: baseDay, checked, createdOrUpdated, results };
}
