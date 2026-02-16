import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  SettingsAPI,
  NotifPrefsAPI,
  JobsAPI,
  DevAPI,
} from '../services/alertsApi.js';

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
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  // system settings
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
    alert('Ajustes guardados');
  }

  async function savePrefs() {
    await NotifPrefsAPI.upsertMine({
      channels: { email: channelEmail, push: channelPush },
      min_severity: minSeverity,
    });
    alert('Preferencias guardadas');
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
      if (!parsed) return alert('Selecciona una franja de hoy');

      const { device_id, user_id, start, end } = parsed;
      if (!device_id || !user_id) return alert('Faltan device_id o user_id');

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

      alert(
        `Lectura insertada (${testWhere === 'inside' ? 'dentro' : 'fuera'}) y checker ejecutado. Revisa /alerts.`
      );
    } catch (e) {
      alert(`Error: ${e.message}`);
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
            <h3>Sistema</h3>
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
            <h3>Mis notificaciones</h3>
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
                <label>Severidad mínima</label>
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
                <label>Potencia (W)</label>
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
