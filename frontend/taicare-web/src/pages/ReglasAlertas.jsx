import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';
import { RulesAPI } from '../services/alertsApi.js';

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
  gap: 0.5rem;
  align-items: center;
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
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
`;

export default function ReglasAlertas() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({
    name: '',
    enabled: true,
    kind: 'RoutineMissed',
    type: 'routine_missed',
    severity: 'MEDIUM',
  });

  useEffect(() => {
    load();
  }, []);
  async function load() {
    setRules(await RulesAPI.list().catch(() => []));
  }

  async function save() {
    if (!form.name.trim()) return alert('Nombre requerido');
    await RulesAPI.create(form);
    setForm({
      name: '',
      enabled: true,
      kind: 'RoutineMissed',
      type: 'routine_missed',
      severity: 'MEDIUM',
    });
    load();
  }

  async function toggle(r) {
    await RulesAPI.update(r._id, { enabled: !r.enabled });
    setRules((rs) =>
      rs.map((x) => (x._id === r._id ? { ...x, enabled: !x.enabled } : x))
    );
  }

  async function remove(id) {
    if (!confirm('¿Eliminar la regla?')) return;
    await RulesAPI.remove(id);
    setRules((rs) => rs.filter((x) => x._id !== id));
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
          <h1>Reglas de alertas</h1>

          <Card>
            <h3>Nueva regla</h3>
            <Row>
              <Input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kind: e.target.value }))
                }
              >
                <option value="RoutineMissed">RoutineMissed</option>
              </select>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="routine_missed">routine_missed</option>
              </select>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, severity: e.target.value }))
                }
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, enabled: e.target.checked }))
                  }
                />{' '}
                Activa
              </label>
              <Btn variant="primary" onClick={save}>
                Guardar
              </Btn>
            </Row>
          </Card>

          <Card>
            <h3>Mis reglas</h3>
            {rules.map((r) => (
              <div
                key={r._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '.5rem 0',
                  borderBottom: '1px dashed var(--border)',
                }}
              >
                <div>
                  <strong>{r.name}</strong>{' '}
                  <small>
                    · {r.kind}/{r.type} · {r.severity}
                  </small>{' '}
                  {!r.enabled && (
                    <small style={{ opacity: 0.7 }}>(desactivada)</small>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <Btn onClick={() => toggle(r)}>
                    {r.enabled ? 'Desactivar' : 'Activar'}
                  </Btn>
                  <Btn onClick={() => remove(r._id)}>Eliminar</Btn>
                </div>
              </div>
            ))}
            {!rules.length && (
              <div style={{ opacity: 0.7 }}>Aún no tienes reglas.</div>
            )}
          </Card>
        </Main>
      </Body>
      <Footer />
    </App>
  );
}
