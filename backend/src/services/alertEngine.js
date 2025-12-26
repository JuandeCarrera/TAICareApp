import Alert from '../models/Alert.js';
import AlertRule from '../models/AlertRule.js';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import Device from '../models/Device.js';
import Routine from '../models/Routine.js';
import { getRoutinesStatusForDate } from './routineChecker.js'

const z2 = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${z2(d.getMonth()+1)}-${z2(d.getDate())}`;

export async function alertsEnabled() {
  const s = await SystemSetting.findOne({ key: 'alerts_enabled' }).lean();
  return s ? !!s.value : true; // por defecto ON
}

export async function getActiveRules({ type } = {}) {
  const where = { enabled: true };
  if (type) where.type = type;
  return AlertRule.find(where).lean();
}

async function contextFromRefs({ user_id, device_id, routine_id }) {
  const [user, device, routine] = await Promise.all([
    user_id ? User.findById(user_id).lean() : null,
    device_id ? Device.findById(device_id).lean() : null,
    routine_id ? Routine.findById(routine_id).lean() : null,
  ]);

  const caregiver_id = user?.caregiver_id || null;
  const household_id = routine?.household_id || device?.household_id || null;

  let title = 'Alerta';
  let message = '';

  if (routine && user) {
    const rname = routine.name || 'Rutina';
    const uname = user.name || 'Paciente';
    title = `Incumplida — ${rname} — ${uname}`;
    message = `${uname} no ha completado “${rname}” (${routine.expected_start}–${routine.expected_end}).`;
  } else if (user && device) {
    title = `Alerta de ${user.name || 'Paciente'}`;
    message = `Evento en ${device.appliance || device.plugmodel || 'dispositivo'}.`;
  }

  const window_key = routine ? `${routine.expected_start}–${routine.expected_end}` : undefined;

  return { caregiver_id, household_id, title, message, window_key, user, device, routine };
}

/**
 * Crea alerta con deduplicación blanda:
 * - Si hay routine_id: 1 alerta por (type+user+routine+dayKey).
 * - Si NO hay routine_id: 1 alerta activa por (type+user+device+dayKey).
 */
export async function ensureAlert({
  type,
  user_id,
  device_id,
  routine_id,
  timestamp = new Date(),
  resolved = false,
  seen = false,
  title,
  message,
}) {
  if (!(await alertsEnabled())) return null;

  const ctx = await contextFromRefs({ user_id, device_id, routine_id });
  const dk = dayKey(new Date(timestamp));

  const base = {
    type,
    user_id,
    device_id,
    routine_id: routine_id || undefined,
    timestamp,
    resolved: !!resolved,
    seen: !!seen,
    caregiver_id: ctx.caregiver_id || undefined,
    household_id: ctx.household_id || undefined,
    day_key: dk,
    window_key: ctx.window_key,
    title: typeof title === 'string' ? title : ctx.title,
    message: typeof message === 'string' ? message : ctx.message,
  };

  if (routine_id) {
    const found = await Alert.findOne({
      type, user_id, routine_id, day_key: dk,
    });
    if (found) return found;
    return Alert.create(base);
  }

  const existing = await Alert.findOne({
    type, user_id, device_id, day_key: dk, resolved: false,
  });
  if (existing) return existing;

  return Alert.create(base);
}

/**
 * Evalúa reglas custom.
 * Recibe un payload de evento e intenta disparar alertas según reglas.
 */
export async function evaluateRulesAndAlert(event) {
  if (!(await alertsEnabled())) return null;

  const rules = await getActiveRules({ type: event.type });
  const created = [];

  for (const rule of rules) {
    const matchType = !rule.type || rule.type === event.type;
    if (!matchType) continue;

    const alert = await ensureAlert({
      type: rule.type || event.type,
      user_id: event.user_id,
      device_id: event.device_id,
      routine_id: event.routine_id,
      timestamp: event.timestamp || new Date(),
      resolved: false,
      seen: false,
      title: rule.title,      
      message: rule.message, 
    });

    if (alert) created.push(alert);
  }

  return created;
}

export async function processTick({ date = new Date() } = {}) {
  // Por si el sistema está desactivado
  if (!(await alertsEnabled())) {
    return { ok: true, ran: false, reason: 'alerts_disabled' }
  }

  // Obtenemos los pacientes que tengan rutinas
  const patients = await User.find({ role: 'paciente' }, { _id: 1 }).lean()
  let created = 0
  let checkedRoutines = 0

  for (const p of patients) {
    const statuses = await getRoutinesStatusForDate(p._id, date)
    for (const s of statuses) {
      checkedRoutines += 1
      if (s.status === 'MISSED') {
        await ensureAlert({
          type: 'routine_missed',
          user_id: p._id,
          device_id: s.routine.device_id,
          routine_id: s.routine._id,
          timestamp: s.windowEnd || date,
          resolved: false,
          seen: false,
          // título/mensaje se auto-generan con contextFromRefs si no los pasas
        })
        created += 1
      }
    }
  }

  return { ok: true, ran: true, created, checkedRoutines, patients: patients.length }
}