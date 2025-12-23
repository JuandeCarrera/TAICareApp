import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { SettingsAPI, NotifPrefsAPI, JobsAPI } from '../services/alertsApi.js';

const App = styled.div`display:flex;flex-direction:column;height:100vh;width:100vw;`;
const Body = styled.div`flex:1;display:flex;overflow:hidden;`;
const Main = styled.main`flex:1;background:${({theme})=>theme.colors.bg};padding:2rem;overflow:auto;`;
const Card = styled.section`
  background:${({theme})=>theme.colors.cardBg};
  border:1px solid ${({theme})=>theme.colors.border};
  border-radius:10px;padding:1rem;margin-bottom:1rem;
`;
const Row = styled.div`display:flex;align-items:center;justify-content:space-between;gap:1rem;`;
const Btn = styled.button`
  font-size:.9rem;padding:.4rem .75rem;border-radius:8px;cursor:pointer;
  border:1px solid ${({theme,variant}) => variant==='primary'? theme.colors.primary : theme.colors.border};
  background:${({theme,variant}) => variant==='primary'? theme.colors.primary : theme.colors.cardBg};
  color:${({theme,variant}) => variant==='primary'? '#fff' : theme.colors.text};
  &:hover{background:${({theme,variant}) => variant==='primary'? theme.colors.primaryDark : theme.colors.hoverBg};}
`;
const Input = styled.input`width:100%;padding:.5rem;border:1px solid ${({theme})=>theme.colors.border};border-radius:8px;background:${({theme})=>theme.colors.cardBg};color:${({theme})=>theme.colors.text};`;
const Select = styled.select`width:100%;padding:.5rem;border:1px solid ${({theme})=>theme.colors.border};border-radius:8px;background:${({theme})=>theme.colors.cardBg};color:${({theme})=>theme.colors.text};`;

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

  useEffect(()=>{ load(); }, []);

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
            <Btn onClick={JobsAPI.runRoutineCheck}>Ejecutar chequeo de rutinas ahora</Btn>
          </Card>
        </Main>
      </Body>
      <Footer/>
    </App>
  );
}