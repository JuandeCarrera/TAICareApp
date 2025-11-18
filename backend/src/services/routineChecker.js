import Routine from '../models/Routine.js';
import Data from '../models/Data.js';

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function buildWindowForDate(date, expected_start, expected_end) {
  const [startHour, startMinute] = expected_start.split(':').map(Number);
  const [endHour, endMinute]     = expected_end.split(':').map(Number);

  const windowStart = new Date(date);
  windowStart.setHours(startHour, startMinute, 0, 0);

  const windowEnd = new Date(date);
  windowEnd.setHours(endHour, endMinute, 0, 0);

  return { windowStart, windowEnd };
}

async function checkRoutineForDate(routine, date) {
  const { device_id, expected_start, expected_end } = routine;

  const { windowStart, windowEnd } =
    buildWindowForDate(date, expected_start, expected_end);

  // Umbral simple de “uso”
  const POWER_THRESHOLD_W = 5;

  const readings = await Data.find({
    device_id,
    time:  { $gte: windowStart, $lt: windowEnd },
    power: { $gte: POWER_THRESHOLD_W }
  }).lean();

  const matchedEvents = readings.length;
  const status = matchedEvents > 0 ? 'COMPLETED' : 'MISSED';

  return { status, matchedEvents, windowStart, windowEnd };
}

export async function getRoutinesStatusForDate(userId, date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const dayName = DAY_NAMES[day.getDay()];

  // Rutinas de ese paciente para ese día de la semana
  const routines = await Routine.find({
    user_id: userId,
    days: dayName
  }).lean();

  const result = [];
  for (const r of routines) {
    const check = await checkRoutineForDate(r, day);
    result.push({
      routine: {
        _id:            r._id,
        name:           r.name,
        expected_start: r.expected_start,
        expected_end:   r.expected_end,
        days:           r.days,
        device_id:      r.device_id
      },
      ...check        // status, matchedEvents, windowStart, windowEnd
    });
  }

  return result;
}
