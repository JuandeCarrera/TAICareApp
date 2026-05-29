import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';
import { useUpdateUser } from '../hooks/useUsers';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ---- Alert type definitions ----
const ALERT_CATEGORIES = [
  {
    label: '📅 Rutinas', types: [
      { code: 'ROUTINE_MISSED', name: 'Rutina no completada', defaultSeverity: 'high' },
    ]
  },
  {
    label: '🌙 Horas Anómalas', types: [
      { code: 'UNUSUAL_HOUR_ACTIVITY', name: 'Actividad fuera de horario', defaultSeverity: 'high' },
      { code: 'NIGHT_ACTIVITY', name: 'Actividad nocturna', defaultSeverity: 'medium' },
    ]
  },
  {
    label: '📊 Datos Sospechosos', types: [
      { code: 'DATA_GAP', name: 'Sin datos del dispositivo', defaultSeverity: 'high' },
      { code: 'DATA_SPIKE', name: 'Consumo anómalo alto', defaultSeverity: 'medium' },
      { code: 'ERRATIC_BEHAVIOR', name: 'Comportamiento errático', defaultSeverity: 'high' },
    ]
  },
  {
    label: '🔴 Inactividad', types: [
      { code: 'NO_ACTIVITY', name: 'Sin actividad en rutina', defaultSeverity: 'high' },
      { code: 'PROLONGED_INACTIVITY', name: 'Inactividad prolongada', defaultSeverity: 'high' },
    ]
  },
  {
    label: '📡 Dispositivo', types: [
      { code: 'DEVICE_ISSUE', name: 'Problema con dispositivo', defaultSeverity: 'medium' },
    ]
  },
];
const SEV_OPTIONS = [
  { value: 'high', label: '🔴 Alta' },
  { value: 'medium', label: '🟡 Media' },
  { value: 'low', label: '🟢 Baja' },
];

const AppContainer = styled.div`
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
  overflow-y: auto;
`;

const Section = styled.section`
  width: 100%;
  max-width: 500px;
  margin: 0 0 2rem 0;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;
const Field = styled.div`
  margin-bottom: 1rem;
`;
const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;
const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.buttonBg};
  color: ${({ theme }) => theme.colors.text};
`;
const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;
const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  ${({ variant, theme }) =>
    variant === 'primary'
      ? `
    background: ${theme.colors.primary};
    color: white;
  `
      : `
    background: ${theme.colors.cardBg};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};
  `}
  &:hover {
    opacity: 0.9;
  }
`;
const DangerBtn = styled(Button)`
  border: 1px solid #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
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

const SevSelect = styled.select`
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.82rem;
  opacity: ${({ disabled }) => disabled ? 0.4 : 1};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  /* Force OS native dropdown to match current color scheme */
  color-scheme: ${({ theme }) => theme.isDark ? 'dark' : 'light'};
  option {
    background: ${({ theme }) => theme.colors.cardBg};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const PrefRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.45rem 0;
  flex-wrap: wrap;
`;

const CatLabel = styled.div`
  font-weight: 600;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0.9rem 0 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export default function Configuracion() {
  const { user, setUser, logout, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => { setMenuOpen(!isMobile); }, [isMobile]);

  // ---- Profile form ----
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    oldPassword: '',
    newPassword: '',
    confirmNew: '',
    currentPassword: '',
  });
  const [error, setError] = useState('');

  // ---- Alert preferences ----
  const updateUserMutation = useUpdateUser();
  const [prefs, setPrefs] = useState(() => {
    const raw = user?.alert_preferences;
    if (!raw) return {};
    return raw instanceof Map ? Object.fromEntries(raw) : raw;
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [showAlertPrefs, setShowAlertPrefs] = useState(false);

  function getPref(code, field) {
    const t = ALERT_CATEGORIES.flatMap(c => c.types).find(x => x.code === code);
    return prefs[code]?.[field] ?? (field === 'enabled' ? true : t?.defaultSeverity ?? 'medium');
  }
  function togglePref(code) {
    setPrefs(p => ({ ...p, [code]: { ...p[code], enabled: !getPref(code, 'enabled') } }));
  }
  function setSev(code, sev) {
    setPrefs(p => ({ ...p, [code]: { ...p[code], severity: sev, enabled: getPref(code, 'enabled') } }));
  }
  async function savePrefs() {
    setPrefsSaving(true);
    try {
      const id = user?._id || user?.sub;
      await updateUserMutation.mutateAsync({ id, alert_preferences: prefs, alert_preferences_configured: true });
      if (updateUserProfile) updateUserProfile({ alert_preferences: prefs, alert_preferences_configured: true });
      alert('Preferencias de alertas guardadas.');
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setPrefsSaving(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
  };
  const handleCancel = () => {
    setEditing(false);
    setForm({
      name: user.name,
      email: user.email,
      oldPassword: '',
      newPassword: '',
      confirmNew: '',
      currentPassword: '',
    });
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (form.newPassword) {
      if (form.newPassword !== form.confirmNew) {
        setError('Las nuevas contraseñas no coinciden');
        return;
      }
      if (!form.oldPassword) {
        setError('Introduce tu contraseña actual para cambiarla');
        return;
      }
    }
    if (!form.currentPassword) {
      setError('Introduce tu contraseña para confirmar cambios');
      return;
    }

    try {
      const res1 = await fetch(`${API}/users/${user._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      if (!res1.ok) {
        const { error } = await res1.json();
        throw new Error(error || 'Error actualizando perfil');
      }

      if (form.newPassword) {
        const res2 = await fetch(`${API}/auth/change-password`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldPassword: form.oldPassword,
            newPassword: form.newPassword,
            currentPassword: form.currentPassword,
          }),
        });
        if (!res2.ok) {
          const { error } = await res2.json();
          throw new Error(error || 'Error cambiando contraseña');
        }
      }

      setUser({ ...user, name: form.name, email: form.email });
      setEditing(false);
      setForm((f) => ({
        ...f,
        oldPassword: '',
        newPassword: '',
        confirmNew: '',
        currentPassword: '',
      }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Main>
          <h1>CONFIGURACIÓN</h1>

          <Section>
            {!editing ? (
              <>
                <p>
                  <strong>Nombre:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <Actions>
                  <Button variant="primary" onClick={handleEdit}>
                    Editar perfil
                  </Button>
                </Actions>
              </>
            ) : (
              <>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <Field>
                  <Label>Nombre</Label>
                  <Input name="name" value={form.name} onChange={onChange} />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input name="email" value={form.email} onChange={onChange} />
                </Field>
                <Field>
                  <Label>Contraseña actual</Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={onChange}
                  />
                </Field>
                <Field>
                  <Label>Nueva contraseña (opcional)</Label>
                  <Input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={onChange}
                  />
                </Field>
                {form.newPassword && (
                  <Field>
                    <Label>Confirma nueva contraseña</Label>
                    <Input
                      type="password"
                      name="confirmNew"
                      value={form.confirmNew}
                      onChange={onChange}
                    />
                  </Field>
                )}
                <Actions>
                  <DangerBtn onClick={handleCancel}>Cancelar</DangerBtn>
                  <Button variant="primary" onClick={handleSave}>
                    Guardar
                  </Button>
                </Actions>
              </>
            )}
          </Section>

          {/* ---- Preferencias de alertas ---- */}
          <Section style={{ width: '100%', maxWidth: 600 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setShowAlertPrefs(s => !s)}
            >
              <h2 style={{ marginTop: 0, fontSize: '1rem', marginBottom: 0 }}>🔔 Preferencias de alertas</h2>
              <span style={{ fontSize: '1.1rem', opacity: 0.6 }}>{showAlertPrefs ? '▲' : '▼'}</span>
            </div>
            {showAlertPrefs && (
              <>
                <p style={{ opacity: 0.65, fontSize: '0.85rem', margin: '0.5rem 0' }}>
                  Activa o desactiva cada tipo de alerta y ajusta su severidad.
                </p>
                {ALERT_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <CatLabel>{cat.label}</CatLabel>
                    {cat.types.map(t => {
                      const on = getPref(t.code, 'enabled');
                      return (
                        <PrefRow key={t.code}>
                          <span style={{ flex: 1, fontSize: '0.9rem' }}>{t.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <SevSelect
                              value={getPref(t.code, 'severity')}
                              disabled={!on}
                              onChange={e => setSev(t.code, e.target.value)}
                            >
                              {SEV_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </SevSelect>
                            <SwitchTrack $active={on} onClick={() => togglePref(t.code)} title={on ? 'Desactivar' : 'Activar'} />
                          </div>
                        </PrefRow>
                      );
                    })}
                  </div>
                ))}
                <Actions style={{ marginTop: '1rem' }}>
                  <Button variant="primary" onClick={savePrefs} disabled={prefsSaving}>
                    {prefsSaving ? 'Guardando...' : 'Guardar preferencias'}
                  </Button>
                </Actions>
              </>
            )}
          </Section>
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  );
}
