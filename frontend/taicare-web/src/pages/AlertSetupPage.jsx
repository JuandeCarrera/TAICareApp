import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import api from '../api/axios';

/* ─── Alert type definitions (mirrors backend constants) ─── */
const CATEGORIES = [
    {
        label: '📅 Rutinas',
        types: [
            { code: 'ROUTINE_MISSED', name: 'Rutina no completada', description: 'El paciente no realizó una rutina en su ventana horaria.', defaultSeverity: 'high' },
        ],
    },
    {
        label: '🌙 Actividad en Horas Anómalas',
        types: [
            { code: 'UNUSUAL_HOUR_ACTIVITY', name: 'Actividad fuera de horario', description: 'Dispositivo activo fuera del rango horario configurado del paciente.', defaultSeverity: 'high' },
            { code: 'NIGHT_ACTIVITY', name: 'Actividad nocturna', description: 'Actividad intensa detectada durante la franja nocturna.', defaultSeverity: 'medium' },
        ],
    },
    {
        label: '📊 Datos Sospechosos',
        types: [
            { code: 'DATA_GAP', name: 'Sin datos del dispositivo', description: 'El dispositivo no envió datos durante un período prolongado.', defaultSeverity: 'high' },
            { code: 'DATA_SPIKE', name: 'Consumo anómalo alto', description: 'Consumo eléctrico notablemente superior a la media del paciente.', defaultSeverity: 'medium' },
            { code: 'ERRATIC_BEHAVIOR', name: 'Comportamiento errático', description: 'Ciclos de encendido/apagado repetidos en poco tiempo.', defaultSeverity: 'high' },
        ],
    },
    {
        label: '🔴 Inactividad',
        types: [
            { code: 'NO_ACTIVITY', name: 'Sin actividad en rutina', description: 'Ningún dispositivo activo durante la ventana de una rutina.', defaultSeverity: 'high' },
            { code: 'PROLONGED_INACTIVITY', name: 'Inactividad prolongada', description: 'Ningún dispositivo activo durante un período largo en horas de vigilia.', defaultSeverity: 'high' },
        ],
    },
    {
        label: '📡 Dispositivo',
        types: [
            { code: 'DEVICE_ISSUE', name: 'Problema con dispositivo', description: 'Dispositivo offline, sin respuesta o con lecturas inválidas.', defaultSeverity: 'medium' },
        ],
    },
];

const SEVERITY_OPTIONS = [
    { value: 'high', label: '🔴 Alta' },
    { value: 'medium', label: '🟡 Media' },
    { value: 'low', label: '🟢 Baja' },
];

function buildDefaults() {
    const prefs = {};
    CATEGORIES.forEach(cat => cat.types.forEach(t => {
        prefs[t.code] = { enabled: true, severity: t.defaultSeverity };
    }));
    return prefs;
}

/* ─── Styled Components ─── */
const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem 4rem;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 720px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 0.25rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.65;
  margin: 0 0 2rem;
  font-size: 0.95rem;
`;

const CategoryTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  margin: 1.5rem 0 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TypeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0;
  flex-wrap: wrap;
`;

const TypeInfo = styled.div`
  flex: 1;
  min-width: 180px;
`;

const TypeName = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
`;

const TypeDesc = styled.div`
  font-size: 0.82rem;
  opacity: 0.6;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 2px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const SwitchTrack = styled.div`
  position: relative;
  width: 40px;
  height: 22px;
  background: ${({ active, theme }) => active ? theme.colors.primary : '#ccc'};
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.25s;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ active }) => active ? '20px' : '2px'};
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: left 0.25s;
  }
`;

const SeveritySelect = styled.select`
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  cursor: pointer;
  opacity: ${({ disabled }) => disabled ? 0.4 : 1};
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ theme, variant }) => variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, variant }) => variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ theme, variant }) => variant === 'primary' ? '#fff' : theme.colors.text};
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* ─── Component ─── */
export default function AlertSetupPage() {
    const { user, updateUserProfile } = useContext(AuthContext);
    const navigate = useNavigate();
    const [prefs, setPrefs] = useState(buildDefaults);
    const [saving, setSaving] = useState(false);

    function toggleEnabled(code) {
        setPrefs(p => ({ ...p, [code]: { ...p[code], enabled: !p[code].enabled } }));
    }

    function setSeverity(code, severity) {
        setPrefs(p => ({ ...p, [code]: { ...p[code], severity } }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const id = user._id || user.sub;
            await api.put(`/users/${id}`, {
                alert_preferences: prefs,
                alert_preferences_configured: true,
            });
            updateUserProfile({ alert_preferences: prefs, alert_preferences_configured: true });
            navigate('/');
        } catch (err) {
            alert('Error al guardar las preferencias: ' + (err.message || 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    }

    async function handleRemindLater() {
        // Just navigate away; alert_preferences_configured stays false
        // The setup screen will reappear next login
        sessionStorage.setItem('skipSetup', 'true');
        navigate('/');
    }

    return (
        <Page>
            <Card>
                <Title>⚙️ Configura tus alertas</Title>
                <Subtitle>
                    Decide qué tipos de alerta quieres recibir y con qué severidad.
                    Siempre podrás cambiarlo desde la página de Configuración.
                </Subtitle>

                {CATEGORIES.map(cat => (
                    <div key={cat.label}>
                        <CategoryTitle>{cat.label}</CategoryTitle>
                        {cat.types.map(t => (
                            <TypeRow key={t.code}>
                                <TypeInfo>
                                    <TypeName>{t.name}</TypeName>
                                    <TypeDesc>{t.description}</TypeDesc>
                                </TypeInfo>
                                <Controls>
                                    <SeveritySelect
                                        value={prefs[t.code]?.severity || t.defaultSeverity}
                                        disabled={!prefs[t.code]?.enabled}
                                        onChange={e => setSeverity(t.code, e.target.value)}
                                    >
                                        {SEVERITY_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </SeveritySelect>
                                    <SwitchTrack
                                        active={!!prefs[t.code]?.enabled}
                                        onClick={() => toggleEnabled(t.code)}
                                        title={prefs[t.code]?.enabled ? 'Desactivar' : 'Activar'}
                                    />
                                </Controls>
                            </TypeRow>
                        ))}
                    </div>
                ))}

                <Actions>
                    <Btn variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : '✅ Guardar configuración'}
                    </Btn>
                    <Btn onClick={handleRemindLater}>
                        🕐 Recordar más tarde
                    </Btn>
                </Actions>
            </Card>
        </Page>
    );
}
