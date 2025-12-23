import Routine from '../models/Routine.js';
import Data from '../models/Data.js';
import { ensureAlert } from '../services/alertEngine.js';

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const POWER_THRESHOLD_W = 5;

function windowFor(date, startHHMM, endHHMM) {
  const [sH, sM] = startHHMM.split(':').map(Number);
  const [eH, eM] = endHHMM.split(':').map(Number);
  const start = new Date(date); start.setHours(sH, sM, 0, 0);
  let end = new Date(date);     end.setHours(eH, eM, 0, 0);
  if (end <= start) end = new Date(end.getTime() + 24*3600*1000); // cruza medianoche
  return { start, end };
}

export async function runRoutineCheck({ baseDate = new Date() } = {}) {
  const todayName = DAY_NAMES[baseDate.getDay()];
  const routines = await Routine.find({ days: todayName }).lean();
  const now = new Date();

  for (const r of routines) {
    const { start, end } = windowFor(baseDate, r.expected_start, r.expected_end);
    if (end > now) continue; // aún no terminó la ventana, evita falso positivo

    const readings = await Data.find({
      device_id: r.device_id,
      time:  { $gte: start, $lt: end },
      power: { $gte: POWER_THRESHOLD_W }
    }).select('_id').limit(1).lean();

    const hadUsage = readings.length > 0;
    if (!hadUsage) {
      await ensureAlert({
        type: 'routine_missed',
        user_id: r.user_id,
        device_id: r.device_id,
        routine_id: r._id,
        timestamp: end,
        resolved: false,
        seen: false,
      });
    }
  }
}
