import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { SettingsAPI, NotifPrefsAPI, JobsAPI, DevAPI } from '../services/alertsApi.js';

const App = styled.div`display:flex;flex-direction:column;height:100vh;width:100vw;`;
const Body = styled.div`flex:1;display:flex;overflow:hidden;`;
const Main = styled.main`flex:1;background:${({theme})=>theme.colors.bg};padding:2rem;overflow:auto;`;
const Card = styled.section`
  background:${({theme})=>theme.colors.cardBg};
  border:1px solid ${({theme})=>theme.colors.border};
  border-radius:10px;padding:1rem;margin-bottom:1rem;
`;
const Row = styled.div`display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;`;
const Btn = styled.button`
  font-size:.9rem;padding:.4rem .75rem;border-radius:8px;cursor:pointer;
  border:1px solid ${({theme,variant}) => variant==='primary'? theme.colors.primary : theme.colors.border};
  background:${({theme,variant}) => variant==='primary'? theme.colors.primary : theme.colors.cardBg};
  color:${({theme,variant}) => variant==='primary'? '#fff' : theme.colors.text};
  &:hover{background:${({theme,variant}) => variant==='primary'? theme.colors.primaryDark : theme.colors.hoverBg};}
`;
const Input = styled.input`
  width:100%;padding:.5rem;border:1px solid ${({theme})=>theme.colors.border};
  border-radius:8px;background:${({theme})=>theme.colors.cardBg};color:${({theme})=>theme.colors.text};
`;
const Select = styled.select`
  width:100%;padding:.5rem;border:1px solid ${({theme})=>theme.colors.border};
  border-radius:8px;background:${({theme})=>theme.colors.cardBg};color:${({theme})=>theme.colors.text};
`;

export default function AjustesAlertas() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768);

  // system settings
  const [enabled, setEnabled] = useState(true);
  const [windowStart, setWindowStart] = useState('06:00');
  const [windowEnd, setWindowEnd] = useState('22:00');

  // my notification prefs
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelPush, setChannelPush] = useState(false);
  const [minSeverity, setMinSeverity] = useState('LOW');

  // dev tools: selector de rutina de hoy y parámetros de inserción
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = DAY_NAMES[new Date().getDay()];
  const [routinesToday, setRoutinesToday] = useState([]);
  const [selRoutineId, setSelRoutineId] = useState('');
  const [testWhere, setTestWhere] = useState('outside'); // 'inside' | 'outside'
  const [testPower, setTestPower] = useState(60);        // W
  const [testOffset, setTestOffset] = useState(0);       // minutos (+/-)

  useEffect(()=>{ load(); }, []);
  useEffect(() => { loadRoutinesToday(); }, []); // cargar rutinas del día para el selector

  async function load() {
    const s = await SettingsAPI.getSystem().catch(()=>null);
    if (s) {
      setEnabled(!!s.alerts_enabled);
      if (s.quiet_hours?.start) setWindowStart(s.quiet_hours.start);
      if (s.quiet_hours?.end)   setWindowEnd(s.quiet_hours.end);
    }
    const p = await NotifPrefsAPI.getMine().catch(()=>null);
    if (p) {
      setChannelEmail(!!p.channels?.email);
      setChannelPush(!!p.channels?.push);
      setMinSeverity(p.min_severity || 'LOW');
    }
  }

  async function loadRoutinesToday() {
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API}/routines`, { credentials:'include' });
      const all = res.ok ? await res.json() : [];
      const todays = (all || []).filter(r => Array.isArray(r.days) && r.days.includes(todayName));
      setRoutinesToday(todays);
      if (todays[0]?._id) setSelRoutineId(todays[0]._id);
    } catch (e) {
      // no-op
    }
  }

  async function saveSystem() {
    await SettingsAPI.updateSystem({
      alerts_enabled: enabled,
      quiet_hours: { start: windowStart, end: windowEnd }
    });
    alert('Ajustes guardados');
  }

  async function savePrefs() {
    await NotifPrefsAPI.upsertMine({
      channels: { email: channelEmail, push: channelPush },
      min_severity: minSeverity
    });
    alert('Preferencias guardadas');
  }

  async function insertTestData() {
    try {
      if (!selRoutineId) return alert('Selecciona una rutina');
      const r = routinesToday.find(x => x._id === selRoutineId);
      if (!r) return alert('Rutina no encontrada');

      // obtener ids "planos" por si vienen populados
      const deviceId = typeof r.device_id === 'object' ? (r.device_id?._id || r.device_id?.id) : r.device_id;
      const userId   = typeof r.user_id   === 'object' ? (r.user_id?._id   || r.user_id?.id)   : r.user_id;

      if (!deviceId) return alert('La rutina no tiene device_id');
      if (!userId)   return alert('La rutina no tiene user_id');

      // calcular timestamp
      const now = new Date(); now.setSeconds(0,0);

      const [sh, sm] = (r.expected_start || '08:00').split(':').map(Number);
      const [eh, em] = (r.expected_end   || '09:00').split(':').map(Number);

      let base = new Date(now);
      if (testWhere === 'inside') {
        // punto medio de la ventana, soportando cruce de medianoche
        const startDate = new Date(now); startDate.setHours(sh||0, sm||0, 0, 0);
        const endDate   = new Date(now); endDate.setHours(eh||0, em||0, 0, 0);
        if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
        const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
        base = midpoint;
      } else {
        // fuera: fin + 2h
        const endPlus = new Date(now);
        endPlus.setHours((eh||0), (em||0) + 120, 0, 0);
        base = endPlus;
      }

      // aplicar offset manual
      const t = new Date(base.getTime() + Number(testOffset || 0) * 60 * 1000);

      // insertar lectura
      await DevAPI.insertData({
        device_id: deviceId,
        user_id:   userId,
        time:      t.toISOString(),
        status:    true,
        power:     Number(testPower || 0),
        synthetic: true,
      });

      // ejecutar checker
      await JobsAPI.runRoutineCheck();

      alert(`Lectura insertada (${testWhere === 'inside' ? 'dentro' : 'fuera'}) y checker ejecutado. Revisa /alerts.`);
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  return (
    <App>
      <Header onToggleMenu={() => setMenuOpen(o=>!o)} onLogout={()=>{logout();navigate('/login')}}/>
      <Body>
        <Sidebar open={menuOpen}/>
        <Main>
          <h1>Ajustes de alertas</h1>

          <Card>
            <h3>Sistema</h3>
            <Row>
              <div>Motor de alertas</div>
              <label style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>
                {enabled ? 'Activado' : 'Desactivado'}
              </label>
            </Row>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginTop:'.75rem'}}>
              <div>
                <label>Quiet hours · inicio</label>
                <Input value={windowStart} onChange={e=>setWindowStart(e.target.value)} />
              </div>
              <div>
                <label>Quiet hours · fin</label>
                <Input value={windowEnd} onChange={e=>setWindowEnd(e.target.value)} />
              </div>
            </div>
            <div style={{marginTop:'.75rem',textAlign:'right'}}>
              <Btn variant="primary" onClick={saveSystem}>Guardar</Btn>
            </div>
          </Card>

          <Card>
            <h3>Mis notificaciones</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem'}}>
              <label style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                <input type="checkbox" checked={channelEmail} onChange={e=>setChannelEmail(e.target.checked)}/>
                Email
              </label>
              <label style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                <input type="checkbox" checked={channelPush} onChange={e=>setChannelPush(e.target.checked)}/>
                Push
              </label>
              <div>
                <label>Severidad mínima</label>
                <Select value={minSeverity} onChange={e=>setMinSeverity(e.target.value)}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </Select>
              </div>
            </div>
            <div style={{marginTop:'.75rem',textAlign:'right'}}>
              <Btn variant="primary" onClick={savePrefs}>Guardar</Btn>
            </div>
          </Card>

          <Card>
            <h3>Herramientas de prueba (dev)</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginTop:'.25rem'}}>
              <div>
                <label>Rutina (hoy)</label>
                <Select
                  value={selRoutineId}
                  onChange={e=>setSelRoutineId(e.target.value)}
                >
                  {routinesToday.map(r => {
                    const dname = typeof r.device_id === 'object'
                      ? (r.device_id?.appliance || r.device_id?.plugmodel || 'Dispositivo')
                      : String(r.device_id).slice(-6);
                    const uname = typeof r.user_id === 'object'
                      ? (r.user_id?.name || 'Paciente')
                      : String(r.user_id).slice(-6);
                    return (
                      <option key={r._id} value={r._id}>
                        {r.name || 'Rutina'} · {uname} · {dname} · {r.expected_start}–{r.expected_end}
                      </option>
                    );
                  })}
                  {!routinesToday.length && <option value="">(No hay rutinas para hoy)</option>}
                </Select>
              </div>

              <div>
                <label>¿Dónde insertar?</label>
                <Select value={testWhere} onChange={e=>setTestWhere(e.target.value)}>
                  <option value="inside">Dentro de la ventana</option>
                  <option value="outside">Fuera de la ventana</option>
                </Select>
                <small style={{display:'block', opacity:.75}}>
                  Dentro → debería evitar la alerta. Fuera → debería disparar <em>routine_missed</em>.
                </small>
              </div>

              <div>
                <label>Potencia (W)</label>
                <Input
                  type="number"
                  value={testPower}
                  onChange={e=>setTestPower(e.target.value)}
                />
                <small style={{display:'block', opacity:.75}}>
                  Umbral de uso en el checker ≈ 5W.
                </small>
              </div>

              <div>
                <label>Offset minutos (+/-)</label>
                <Input
                  type="number"
                  value={testOffset}
                  onChange={e=>setTestOffset(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop:'.75rem', display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
              <Btn onClick={insertTestData}>Insertar lectura de prueba + ejecutar checker</Btn>
              <Btn onClick={JobsAPI.runRoutineCheck}>Ejecutar chequeo de rutinas ahora</Btn>
            </div>
          </Card>
        </Main>
      </Body>
      <Footer/>
    </App>
  );
}
