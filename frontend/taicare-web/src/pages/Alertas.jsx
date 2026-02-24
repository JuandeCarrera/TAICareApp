import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import SearchToolbar from '../components/SearchToolbar.jsx';
import {
  useAlerts,
  useMarkAlertAsRead,
  useDeleteAlert,
} from '../hooks/useAlerts';
import { useUsers } from '../hooks/useUsers';
import { useIsMobile } from '../hooks/useIsMobile';

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
  padding: 1rem;
  @media (min-width: 768px) {
    padding: 2rem;
  }
  overflow-y: auto;
`;
const TopBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;
const List = styled.ul`
  padding: 0;
  list-style: none;
  margin-top: 1rem;
`;
const AlertItem = styled.li`
  display: flex;
  flex-direction: column;
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  gap: 1rem;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.6rem;
`;
const Left = styled.div`
  display: flex;
  align-items: start;
  gap: 0.75rem;
`;
const Dot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: red;
  margin-top: 0.6rem;
  flex-shrink: 0;
`;
const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-self: flex-end;
  @media (min-width: 640px) {
    align-self: auto;
  }
`;
const Btn = styled.button`
  font-size: 0.85rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid
    ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? 'white' : theme.colors.text};
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`;
const Meta = styled.div`
  font-size: 0.85rem;
  opacity: 0.85;
`;
const DangerBtn = styled(Btn)`
  border-color: #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;

const PatientTag = styled.span`
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: auto;
  @media (min-width: 640px) {
    margin-left: 0;
  }
`;

export default function Alertas() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  // --- Hooks ---
  const {
    data: alerts = [],
    isLoading: loadingAlerts,
    error: alertsError,
    refetch,
  } = useAlerts();
  const { data: patients = [] } = useUsers({ role: 'paciente' });

  const markReadMutation = useMarkAlertAsRead();
  const deleteMutation = useDeleteAlert();

  // búsqueda / filtros / orden
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState({
    resolved: '', // '', 'true', 'false'
    types: [], // múltiple
    patient: '', // user_id
    dateFrom: '', // yyyy-mm-dd
    dateTo: '', // yyyy-mm-dd
    onlyUnseen: false,
  });
  const [sort, setSort] = useState('timestamp:desc');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // helpers
  const fmtDateTime = (d) => {
    if (!d) return '';
    const dd = new Date(d);
    if (isNaN(+dd)) return '';
    return dd.toLocaleString();
  };
  const includesText = (str, q) =>
    String(str || '')
      .toLowerCase()
      .includes(String(q || '').toLowerCase());

  // opciones para filtros dinámicos (tipos, pacientes)

  const patientOptions = useMemo(() => {
    return (patients || []).map((u) => ({
      value: u._id,
      label: u.name || u.email || u._id,
    }));
  }, [patients]);

  const sortOptions = [
    { value: 'timestamp:desc', label: 'Más recientes' },
    { value: 'timestamp:asc', label: 'Más antiguas' },
    { value: 'type:asc', label: 'Tipo (A–Z)' },
    { value: 'type:desc', label: 'Tipo (Z–A)' },
  ];

  // Mapeo de tipos de alerta a textos e iconos amigables
  const ALERT_CONFIG = useMemo(() => ({
    routine_missed: { label: 'Rutina Incumplida', icon: '❌', color: '#e04848' },
    NO_ACTIVITY: { label: 'Inactividad Detectada', icon: '⚠️', color: '#f59e0b' },
    DOOR_OPEN: { label: 'Puerta Abierta', icon: '🚪', color: '#3b82f6' },
    GAS_LEAK: { label: 'Fuga de Gas', icon: '🔥', color: '#ef4444' },
    SMOKE: { label: 'Humo Detectado', icon: '💨', color: '#71717a' },
    SOS: { label: 'Botón de Pánico', icon: '🆘', color: '#ef4444' },
    FALL: { label: 'Caída Detectada', icon: '🤕', color: '#ef4444' },
    DEFAULT: { label: 'Alerta', icon: '🔔', color: '#6366f1' },
  }), []);

  const getAlertConfig = useCallback((type) => {
    return ALERT_CONFIG[type] || ALERT_CONFIG.DEFAULT;
  }, [ALERT_CONFIG]);

  // fallback helpers
  const patientLabel = useCallback((a) => {
    return a?.user_id?.name || a?.patient_name_snapshot || a?.user_id || '';
  }, []);

  const safeTitle = useCallback(
    (a) => {
      // 1. Si el backend ya trae un título limpio, úsalo (prioridad máxima)
      if (a?.title && a.title.trim() && a.title !== 'Alerta') return a.title;

      // 2. Si no, usa el mapeo de tipos
      const config = getAlertConfig(a?.type);

      // 3. Enriquece con info extra si es necesario
      if (a?.type === 'routine_missed') {
        const routineName = a?.routine_name_snapshot || a?.routine_id?.name || '';
        return routineName ? `${config.label}: ${routineName}` : config.label;
      }

      return config.label;
    },
    [getAlertConfig]
  );

  // filtrado + ordenación (client-side)
  const visible = useMemo(() => {
    let arr = Array.isArray(alerts) ? [...alerts] : [];

    if (query.trim()) {
      arr = arr.filter(
        (a) =>
          includesText(safeTitle(a), query) ||
          includesText(a.message, query) ||
          includesText(a.type, query) ||
          includesText(a.device_id?.appliance, query) ||
          includesText(a.device_id?.room, query) ||
          includesText(patientLabel(a), query)
      );
    }

    if (filterValues.resolved === 'true') {
      arr = arr.filter((a) => a.resolved === true);
    } else if (filterValues.resolved === 'false') {
      arr = arr.filter((a) => a.resolved === false);
    }

    if (filterValues.onlyUnseen) {
      arr = arr.filter(
        (a) => a.seen === false || a.seen === 'false' || a.read === false
      );
      // Nota: El backend a veces usa 'seen' o 'read'. Ajustar según modelo real.
    }

    if (Array.isArray(filterValues.types) && filterValues.types.length) {
      const set = new Set(filterValues.types);
      arr = arr.filter((a) => a.type && set.has(a.type));
    }

    if (filterValues.patient) {
      const pid = String(filterValues.patient);
      arr = arr.filter(
        (a) => String(a.user_id?._id || a.user_id || '') === pid
      );
    }

    if (filterValues.dateFrom) {
      const from = new Date(filterValues.dateFrom + 'T00:00:00Z').getTime();
      arr = arr.filter((a) => {
        const t = new Date(a.timestamp || a.createdAt).getTime();
        return !isNaN(t) && t >= from;
      });
    }
    if (filterValues.dateTo) {
      const to = new Date(filterValues.dateTo + 'T23:59:59Z').getTime();
      arr = arr.filter((a) => {
        const t = new Date(a.timestamp || a.createdAt).getTime();
        return !isNaN(t) && t <= to;
      });
    }

    const [field, dir = 'asc'] = String(sort || '').split(':');
    const mul = dir === 'desc' ? -1 : 1;
    arr.sort((x, y) => {
      let a, b;
      if (field === 'timestamp') {
        a = new Date(x.timestamp || x.createdAt).getTime();
        b = new Date(y.timestamp || y.createdAt).getTime();
      } else if (field === 'type') {
        a = String(x.type || '');
        b = String(y.type || '');
      } else {
        a = 0;
        b = 0;
      }
      if (a < b) return -1 * mul;
      if (a > b) return 1 * mul;
      return 0;
    });

    return arr;
  }, [alerts, query, filterValues, sort, safeTitle, patientLabel]);

  // acciones
  async function markSeen(id) {
    markReadMutation.mutate(id);
  }

  async function deleteAlert(id) {
    if (!confirm('¿Borrar esta alerta?')) return;
    deleteMutation.mutate(id);
  }

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Main>
          <TopBar>
            <h1>Alertas</h1>
            <Btn variant="primary" onClick={() => refetch()}>
              Recargar
            </Btn>
          </TopBar>

          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar por texto..."
            filters={[
              {
                key: 'resolved',
                label: 'Estado',
                type: 'select',
                options: [
                  { value: '', label: 'Todas' },
                  { value: 'false', label: 'Pendientes' },
                  { value: 'true', label: 'Resueltas' },
                ],
              },
              {
                key: 'patient',
                label: 'Paciente',
                type: 'select',
                options: [{ value: '', label: 'Todos' }, ...patientOptions],
              },
              {
                key: 'date',
                label: 'Fecha',
                type: 'daterange',
                fromKey: 'dateFrom',
                toKey: 'dateTo',
              },
            ]}
            values={filterValues}
            onValuesChange={setFilterValues}
            sortOptions={[...sortOptions]}
            sort={sort}
            onSortChange={setSort}
            onClear={() => {
              setQuery('');
              setFilterValues({
                resolved: '',
                types: [],
                patient: '',
                dateFrom: '',
                dateTo: '',
                onlyUnseen: false,
              });
              setSort('timestamp:desc');
            }}
          />

          {loadingAlerts ? (
            <p style={{ opacity: 0.8, marginTop: 12 }}>Cargando…</p>
          ) : alertsError ? (
            <p style={{ color: '#f55', marginTop: 12 }}>
              Error al cargar alertas
            </p>
          ) : visible.length === 0 ? (
            <p style={{ opacity: 0.7, marginTop: 12 }}>
              No hay alertas para mostrar.
            </p>
          ) : (
            <>
              <p style={{ opacity: 0.7, margin: '8px 0 12px' }}>
                {visible.length} alerta{visible.length !== 1 ? 's' : ''}{' '}
                encontradas
              </p>

              <List>
                {visible.map((a) => (
                  <AlertItem key={a._id}>
                    <Left>
                      {/* Usamos !a.read porque el backend suele usar 'read', pero UI previa usaba 'seen' */}
                      {(a.seen === false || a.read === false) && <Dot />}
                      <div>
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.2rem' }}>{getAlertConfig(a.type).icon}</span>
                          <strong>{safeTitle(a)}</strong>
                          {patientLabel(a) && (
                            <PatientTag>👤 {patientLabel(a)}</PatientTag>
                          )}
                        </p>
                        {a.message && (
                          <p style={{ margin: '.2rem 0 0' }}>{a.message}</p>
                        )}
                        <Meta>
                          {fmtDateTime(a.timestamp || a.createdAt)}
                          {a.type ? ` · ${a.type}` : ''}
                          {a.device_id?.room ? ` · ${a.device_id.room}` : ''}
                        </Meta>
                      </div>
                    </Left>
                    <Actions>
                      {(a.seen === false || a.read === false) && (
                        <Btn
                          variant="primary"
                          onClick={() => markSeen(a._id)}
                          title="Marcar como vista"
                        >
                          ✓
                        </Btn>
                      )}
                      <DangerBtn
                        onClick={() => deleteAlert(a._id)}
                        title="Eliminar"
                      >
                        🗑
                      </DangerBtn>
                    </Actions>
                  </AlertItem>
                ))}
              </List>
            </>
          )}
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  );
}
