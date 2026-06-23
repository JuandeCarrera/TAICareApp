import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';
import { useUpdateUser } from '../hooks/useUsers';
import InfoTooltip from '../components/InfoTooltip.jsx';
import { useAlert } from '../contexts/AlertContext.jsx';
import {
  SettingsAPI,
  NotifPrefsAPI,
  JobsAPI,
  DevAPI,
} from '../services/alertsApi.js';

// ---- Alert type definitions (mirrors backend ALERT_TYPES constant) ----
const ALERT_CATEGORIES = [
  {
    label: '📅 Rutinas',
    types: [
      { code: 'ROUTINE_MISSED', name: 'Rutina no completada', defaultSeverity: 'high' },
    ],
  },
  {
    label: '🌙 Horas Anómalas',
    types: [
      { code: 'UNUSUAL_HOUR_ACTIVITY', name: 'Actividad fuera de horario', defaultSeverity: 'high' },
      { code: 'NIGHT_ACTIVITY', name: 'Actividad nocturna', defaultSeverity: 'medium' },
    ],
  },
  {
    label: '📊 Datos Sospechosos',
    types: [
      { code: 'DATA_GAP', name: 'Sin datos del dispositivo', defaultSeverity: 'high' },
      { code: 'DATA_SPIKE', name: 'Consumo anómalo alto', defaultSeverity: 'medium' },
      { code: 'ERRATIC_BEHAVIOR', name: 'Comportamiento errático', defaultSeverity: 'high' },
    ],
  },
  {
    label: '🔴 Inactividad',
    types: [
      { code: 'NO_ACTIVITY', name: 'Sin actividad en rutina', defaultSeverity: 'high' },
      { code: 'PROLONGED_INACTIVITY', name: 'Inactividad prolongada', defaultSeverity: 'high' },
    ],
  },
  {
    label: '📡 Dispositivo',
    types: [
      { code: 'DEVICE_ISSUE', name: 'Problema con dispositivo', defaultSeverity: 'medium' },
    ],
  },
];
const SEV_OPTIONS = [
  { value: 'high', label: '🔴 Alta' },
  { value: 'medium', label: '🟡 Media' },
  { value: 'low', label: '🟢 Baja' },
];

const App = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;
const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;
const Main = styled.main`
  flex: 1;
  background: ${({ theme }) => theme.colors.bg};
  padding: 2rem;
  overflow: auto;
`;
const Card = styled.section`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
`;
const SwitchTrack = styled.div`
  position: relative;
  width: 40px;
  height: 22px;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : '#ccc'};
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.25s;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? '20px' : '2px'};
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: left 0.25s;
  }
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;
const Btn = styled.button`
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid
    ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? '#fff' : theme.colors.text};
  &:hover {
    background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
`;
const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
`;

export default function AjustesAlertas() {
  const { logout, user, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { showAlert } = useAlert();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  // ---- Per-type alert preferences ----
  const updateUserMutation = useUpdateUser();
  const [prefs, setPrefs] = useState(() => {
    // Seed from user context if available
    const raw = user?.alert_preferences;
    if (!raw) return {};
    // alert_preferences may be a plain object or a Map
    return raw instanceof Map ? Object.fromEntries(raw) : raw;
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  function getPref(code, field) {
    const cat = ALERT_CATEGORIES.flatMap(c => c.types).find(t => t.code === code);
    return prefs[code]?.[field] ?? (field === 'enabled' ? true : cat?.defaultSeverity ?? 'medium');
  }
  function setPrefsField(code, field, value) {
    setPrefs(p => ({ ...p, [code]: { ...p[code], [field]: value, enabled: getPref(code, 'enabled') } }));
  }
  async function savePrefsPerType() {
    setPrefsSaving(true);
    try {
      const id = user?._id || user?.sub;
      await updateUserMutation.mutateAsync({ id, alert_preferences: prefs, alert_preferences_configured: true });
      if (updateUserProfile) updateUserProfile({ alert_preferences: prefs, alert_preferences_configured: true });
      showAlert('Preferencias guardadas correctamente.', 'success');
    } catch (e) {
      showAlert('Error al guardar: ' + e.message);
    } finally {
      setPrefsSaving(false);
    }
  }

  // ---- System settings ----
  const [enabled, setEnabled] = useState(true);
  const [windowStart, setWindowStart] = useState('06:00');
  const [windowEnd, setWindowEnd] = useState('22:00');

  // my notification prefs
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelPush, setChannelPush] = useState(false);
  const [minSeverity, setMinSeverity] = useState('LOW');

  // dev tools: selector de "ventanas de hoy" basadas en occurrences
  const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const todayName = DAY_NAMES[new Date().getDay()];
  const [routines, setRoutines] = useState([]); // crudas del backend
  const [devices, setDevices] = useState([]); // para nombres bonitos
  const [entriesToday, setEntriesToday] = useState([]); // aplanado occurrence×device para hoy
  const [selKey, setSelKey] = useState(''); // routineId::occIdx::deviceId
  const [testWhere, setTestWhere] = useState('outside'); // 'inside' | 'outside'
  const [testPower, setTestPower] = useState(60); // W
  const [testOffset, setTestOffset] = useState(0); // minutos (+/-)

  useEffect(() => {
    load();
  }, []);

  async function load() {
    // ajustes
    const s = await SettingsAPI.getSystem().catch(() => null);
    if (s) {
      setEnabled(!!s.alerts_enabled);
      if (s.quiet_hours?.start) setWindowStart(s.quiet_hours.start);
      if (s.quiet_hours?.end) setWindowEnd(s.quiet_hours.end);
    }
    const p = await NotifPrefsAPI.getMine().catch(() => null);
    if (p) {
      setChannelEmail(!!p.channels?.email);
      setChannelPush(!!p.channels?.push);
      setMinSeverity(p.min_severity || 'LOW');
    }

    // datos para dev tool
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [rRes, dRes] = await Promise.all([
      fetch(`${API}/routines`, { credentials: 'include' }),
      fetch(`${API}/devices`, { credentials: 'include' }),
    ]);
    const [rts, devs] = await Promise.all([
      rRes.ok ? rRes.json() : [],
      dRes.ok ? dRes.json() : [],
    ]);
    setRoutines(Array.isArray(rts) ? rts : []);
    setDevices(Array.isArray(devs) ? devs : []);
  }

  // construir entradas seleccionables de hoy (routine×occurrence×device)
  useEffect(() => {
    const deviceMap = new Map(devices.map((d) => [String(d._id), d]));
    const list = [];

    for (const r of routines) {
      const userId =
        typeof r.user_id === 'object'
          ? r.user_id?._id || r.user_id?.id || ''
          : r.user_id || '';
      const userName =
        typeof r.user_id === 'object' ? r.user_id?.name || '' : '';
      const occs = Array.isArray(r.occurrences) ? r.occurrences : [];

      occs.forEach((o, idx) => {
        if (!o || !Array.isArray(o.days) || !o.days.includes(todayName)) return;
        const start = o.start || '08:00';
        const end = o.end || '09:00';
        const devIds = Array.isArray(o.device_ids) ? o.device_ids : [];
        devIds.forEach((devIdRaw) => {
          const devId =
            typeof devIdRaw === 'object'
              ? devIdRaw?._id || devIdRaw?.id || ''
              : devIdRaw || '';
          if (!devId) return;
          const d = deviceMap.get(String(devId));
          const devName =
            d?.appliance || d?.plugmodel || String(devId).slice(-6);
          list.push({
            key: `${r._id}::${idx}::${devId}`,
            routineId: r._id,
            occIdx: idx,
            device_id: devId,
            device_name: devName,
            user_id: userId,
            user_name: userName,
            start,
            end,
            routine_name: r.name || 'Rutina',
          });
        });
      });
    }

    setEntriesToday(list);
    if (list[0]?.key) setSelKey(list[0].key);
  }, [routines, devices, todayName]);

  async function saveSystem() {
    await SettingsAPI.updateSystem({
      alerts_enabled: enabled,
      quiet_hours: { start: windowStart, end: windowEnd },
    });
    showAlert('Ajustes guardados', 'success');
  }

  async function savePrefs() {
    await NotifPrefsAPI.upsertMine({
      channels: { email: channelEmail, push: channelPush },
      min_severity: minSeverity,
    });
    showAlert('Preferencias guardadas', 'success');
  }

  function parseSel() {
    if (!selKey) return null;
    const [routineId, occIdxStr, deviceId] = selKey.split('::');
    const occIdx = Number(occIdxStr);
    const entry = entriesToday.find((e) => e.key === selKey);
    if (!entry) return null;
    return {
      routineId,
      occIdx,
      device_id: deviceId,
      user_id: entry.user_id,
      start: entry.start,
      end: entry.end,
    };
  }

  async function insertTestData() {
    try {
      const parsed = parseSel();
      if (!parsed) { showAlert('Selecciona una franja de hoy'); return; }

      const { device_id, user_id, start, end } = parsed;
      if (!device_id || !user_id) { showAlert('Faltan device_id o user_id'); return; }

      const now = new Date();
      now.setSeconds(0, 0);

      const [sh, sm] = (start || '08:00').split(':').map(Number);
      const [eh, em] = (end || '09:00').split(':').map(Number);

      let base = new Date(now);
      if (testWhere === 'inside') {
        // punto medio soportando cruce de día
        const startDate = new Date(now);
        startDate.setHours(sh || 0, sm || 0, 0, 0);
        const endDate = new Date(now);
        endDate.setHours(eh || 0, em || 0, 0, 0);
        if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
        const midpoint = new Date(
          (startDate.getTime() + endDate.getTime()) / 2
        );
        base = midpoint;
      } else {
        // fuera: fin + 2h
        const endPlus = new Date(now);
        endPlus.setHours(eh || 0, (em || 0) + 120, 0, 0);
        base = endPlus;
      }

      // offset manual en minutos
      const t = new Date(base.getTime() + Number(testOffset || 0) * 60 * 1000);

      await DevAPI.insertData({
        device_id,
        user_id,
        time: t.toISOString(),
        status: true,
        power: Number(testPower || 0),
        synthetic: true,
      });

      await JobsAPI.runRoutineCheck();

      showAlert(
        `Lectura insertada (${testWhere === 'inside' ? 'dentro' : 'fuera'}) y checker ejecutado. Revisa /alerts.`,
        'success'
      );
    } catch (e) {
      showAlert(`Error: ${e.message}`);
    }
  }

  return (
    <App>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <Body>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Main>
          <h1>Ajustes de alertas</h1>

          <Card>
            <h3>
              Sistema (Horas de Silencio)
              <InfoTooltip text="Rango de horas durante las cuales el sistema no enviará notificaciones molestas por email o push (las alertas se seguirán registrando en el sistema)." />
            </h3>
            <Row>
              <div>Motor de alertas</div>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                {enabled ? 'Activado' : 'Desactivado'}
              </label>
            </Row>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '.75rem',
                marginTop: '.75rem',
              }}
            >
              <div>
                <label>Quiet hours · inicio</label>
                <Input
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                />
              </div>
              <div>
                <label>Quiet hours · fin</label>
                <Input
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: '.75rem', textAlign: 'right' }}>
              <Btn variant="primary" onClick={saveSystem}>
                Guardar
              </Btn>
            </div>
          </Card>

          <Card>
            <h3>
              Mis notificaciones
              <InfoTooltip text="Canales por los cuales deseas ser notificado en tiempo real ante una nueva alerta." />
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '.75rem',
              }}
            >
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                />
                Email
              </label>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={channelPush}
                  onChange={(e) => setChannelPush(e.target.checked)}
                />
                Push
              </label>
              <div>
                <label>
                  Severidad mínima
                  <InfoTooltip text="Solo recibirás avisos push o email si la severidad de la alerta es igual o superior al nivel seleccionado." />
                </label>
                <Select
                  value={minSeverity}
                  onChange={(e) => setMinSeverity(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </Select>
              </div>
            </div>
            <div style={{ marginTop: '.75rem', textAlign: 'right' }}>
              <Btn variant="primary" onClick={savePrefs}>
                Guardar
              </Btn>
            </div>
          </Card>


          <Card>
            <h3>Herramientas de prueba (dev)</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '.75rem',
                marginTop: '.25rem',
              }}
            >
              <div>
                <label>Rutina de hoy (franja × dispositivo)</label>
                <Select
                  value={selKey}
                  onChange={(e) => setSelKey(e.target.value)}
                >
                  {entriesToday.map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.routine_name} ·{' '}
                      {e.user_name || String(e.user_id).slice(-6)} ·{' '}
                      {e.device_name} · {e.start}–{e.end}
                    </option>
                  ))}
                  {!entriesToday.length && (
                    <option value="">(No hay franjas para hoy)</option>
                  )}
                </Select>
              </div>

              <div>
                <label>¿Dónde insertar?</label>
                <Select
                  value={testWhere}
                  onChange={(e) => setTestWhere(e.target.value)}
                >
                  <option value="inside">Dentro de la ventana</option>
                  <option value="outside">Fuera de la ventana</option>
                </Select>
                <small style={{ display: 'block', opacity: 0.75 }}>
                  Dentro → debería evitar la alerta. Fuera → debería disparar{' '}
                  <em>routine_missed</em>.
                </small>
              </div>

              <div>
                <label>
                  Potencia (W)
                  <InfoTooltip text="Consumo eléctrico en tiempo real. Un valor superior a 5W indica que el aparato está encendido." />
                </label>
                <Input
                  type="number"
                  value={testPower}
                  onChange={(e) => setTestPower(e.target.value)}
                />
                <small style={{ display: 'block', opacity: 0.75 }}>
                  Umbral de uso en el checker ≈ 5W.
                </small>
              </div>

              <div>
                <label>Offset minutos (+/-)</label>
                <Input
                  type="number"
                  value={testOffset}
                  onChange={(e) => setTestOffset(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '.75rem',
                display: 'flex',
                gap: '.5rem',
                flexWrap: 'wrap',
              }}
            >
              <Btn onClick={insertTestData}>
                Insertar lectura de prueba + ejecutar checker
              </Btn>
              <Btn onClick={JobsAPI.runRoutineCheck}>
                Ejecutar chequeo de rutinas ahora
              </Btn>
            </div>
          </Card>
        </Main>
      </Body>
      <Footer />
    </App>
  );
}
