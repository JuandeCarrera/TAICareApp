import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { ThemeContext } from '../ThemeContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CHARTS_BASE = 'https://charts.mongodb.com/charts-project-0-mrlcghx';

/* ─── Registro de charts (IDs del embed code de MongoDB Charts) ──────────── */
const CHART_IDS = {
  dispPorPaciente:          'c29cb27f-4ee4-4c9c-a6d9-0540f06ce116',
  numAlertas:               'c5cad3fc-2244-4b73-b0ba-a8793a6a0ac9',
  consumoPorCasa:           '2a56b1b7-9b22-4a9e-9845-37db7ed6f5d9',
  dispPorHab:               '0aa6db07-6166-4feb-b68f-6682eb0d7c14',
  habitacionesMonitorizadas:'858ce105-990f-42d2-aace-97835c085fff',
  alertasHoy:               '5586cb32-40f5-43c6-aa69-2fc92f368003',
  alertasSinResolver:       '4632ee43-0a08-4ed4-8a32-0fc3fd6d6b3a',
};

const chartUrl = (id, theme = 'light') =>
  `${CHARTS_BASE}/embed/charts?id=${id}&maxDataAge=3600&theme=${theme}`;

/* ─── Animaciones ────────────────────────────────────────────────────────── */
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`;
const pulse = keyframes`0%,100% { opacity: 1; } 50% { opacity: .5; }`;

/* ─── Layout principal ───────────────────────────────────────────────────── */
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
  padding: 1.25rem;
  overflow-y: auto;
  @media (min-width: 768px) { padding: 1.75rem; }
`;

/* ─── Cabecera de página ─────────────────────────────────────────────────── */
const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;
const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const PageMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;
const FreeTierBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: rgba(234,179,8,.12);
  color: #b45309;
  border: 1px solid rgba(234,179,8,.3);
`;
const LastUpdated = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
`;
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const RefreshBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
  svg { ${({ $spinning }) => $spinning && css`animation: ${spin} 0.8s linear infinite;`} }
`;

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
const TabBar = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1.5rem;
  overflow-x: auto;
  &::-webkit-scrollbar { height: 0; }
`;
const Tab = styled.button`
  padding: 0.6rem 1.1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${({ $active }) => ($active ? '700' : '400')};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : (theme.colors.textSecondary || theme.colors.text)};
  border-bottom: 2px solid ${({ theme, $active }) =>
    $active ? theme.colors.primary : 'transparent'};
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;
const TabContent = styled.div`
  animation: ${fadeIn} 0.25s ease;
`;

/* ─── Grid de charts ─────────────────────────────────────────────────────── */
const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols || 3}, 1fr);
  gap: 1rem;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 680px)  { grid-template-columns: 1fr; }
`;
const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;
const ChartCardHeader = styled.div`
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;
const ChartCardTitle = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;
const ChartCardDesc = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
  margin-left: auto;
`;
const IframeWrap = styled.div`
  height: ${({ $tall }) => ($tall ? '360px' : '280px')};
  position: relative;
  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
`;

/* ─── Sección con título ─────────────────────────────────────────────────── */
const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  margin-top: ${({ $mt }) => $mt || '0'};
`;
const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;
const SectionDivider = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

/* ─── Selector de paciente ───────────────────────────────────────────────── */
const PatientSelectorWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;
const PatientLabel = styled.label`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;
const PatientSelect = styled.select`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.88rem;
  cursor: pointer;
  min-width: 200px;
  &:focus { outline: 2px solid ${({ theme }) => theme.colors.primary}; }
`;

/* ─── Stats cards (paciente) ─────────────────────────────────────────────── */
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;
const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
const StatIcon = styled.div`
  font-size: 1.4rem;
`;
const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1;
`;
const StatDesc = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
`;
const LoadingPulse = styled.div`
  width: 60%;
  height: 1.8rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.border};
  animation: ${pulse} 1.2s ease infinite;
`;

/* ─── Categorías ─────────────────────────────────────────────────────────── */
const CatBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
`;
const CatBtn = styled.button`
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, $active }) => ($active ? '#fff' : theme.colors.text)};
  font-size: 0.84rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s;
`;

/* ─── Info banner ────────────────────────────────────────────────────────── */
const InfoBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.2);
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.82rem;
  margin-bottom: 1.25rem;
  line-height: 1.5;
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'justo ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `hace ${diffH}h`;
  return `hace ${Math.floor(diffH / 24)}d`;
}

/* ─── Componente chart embebido ──────────────────────────────────────────── */
function EmbeddedChart({ id, title, desc, tall, refreshKey, chartTheme }) {
  return (
    <ChartCard>
      <ChartCardHeader>
        <ChartCardTitle>{title}</ChartCardTitle>
        {desc && <ChartCardDesc>{desc}</ChartCardDesc>}
      </ChartCardHeader>
      <IframeWrap $tall={tall}>
        <iframe
          key={`${id}-${refreshKey}`}
          title={title}
          src={chartUrl(id, chartTheme)}
          allowFullScreen
        />
      </IframeWrap>
    </ChartCard>
  );
}

/* ─── Categorías config ──────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    key: 'alertas',
    label: '🔔 Alertas',
    charts: [
      { id: CHART_IDS.alertasHoy,        title: 'Alertas de hoy',      desc: 'Total pendientes' },
      { id: CHART_IDS.alertasSinResolver, title: 'Sin resolver hoy',    desc: 'KPI' },
    ],
  },
  {
    key: 'dispositivos',
    label: '📡 Dispositivos',
    charts: [
      { id: CHART_IDS.dispPorPaciente, title: 'Disp. por paciente',    desc: 'Por hogar' },
      { id: CHART_IDS.dispPorHab,      title: 'Disp. por habitación',  desc: 'Distribución' },
    ],
  },
  {
    key: 'hogares',
    label: '🏠 Hogares',
    charts: [
      { id: CHART_IDS.habitacionesMonitorizadas, title: 'Habitaciones monitorizadas', desc: 'Estado' },
      { id: CHART_IDS.consumoPorCasa,            title: 'Consumo por casa',           desc: 'Actividad' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export default function Datos() {
  const { logout } = useContext(AuthContext);
  const { themeName } = useContext(ThemeContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);

  useEffect(() => { setMenuOpen(!isMobile); }, [isMobile]);

  /* ── Tabs ── */
  const [activeTab, setActiveTab] = useState('overview');

  /* ── Refresh ── */
  const [refreshKey, setRefreshKey] = useState(0);       // recarga iframes
  const [dataRefreshKey, setDataRefreshKey] = useState(0); // recarga datos de API
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);       // fuerza recarga de iframes de MongoDB Charts
    setDataRefreshKey((k) => k + 1);   // fuerza recarga de datos de la API
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  /* ── Pacientes ── */
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/users?role=paciente`, { credentials: 'include' });
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        setPatients(list);
        if (list.length) setSelectedPatientId((prev) => prev || String(list[0]._id));
      } catch { /* silencioso */ }
    })();
  }, [dataRefreshKey]);

  useEffect(() => {
    if (!selectedPatientId) return;
    setLoadingPatient(true);
    setPatientData(null);

    (async () => {
      try {
        const [devRes, alertRes, routRes, hhRes] = await Promise.all([
          fetch(`${API}/devices`,    { credentials: 'include' }),
          fetch(`${API}/alerts`,     { credentials: 'include' }),
          fetch(`${API}/routines`,   { credentials: 'include' }),
          fetch(`${API}/households`, { credentials: 'include' }),
        ]);

        const [devices, alerts, routines, households] = await Promise.all([
          devRes.ok   ? devRes.json()   : [],
          alertRes.ok ? alertRes.json() : [],
          routRes.ok  ? routRes.json()  : [],
          hhRes.ok    ? hhRes.json()    : [],
        ]);

        // Hogar del paciente
        const patientHousehold = Array.isArray(households)
          ? households.find((h) => String(h.owner) === selectedPatientId || String(h.owner?._id) === selectedPatientId)
          : null;
        const hhId = patientHousehold ? String(patientHousehold._id) : null;

        // Dispositivos del hogar del paciente
        const patientDevices = Array.isArray(devices)
          ? devices.filter((d) => {
              const dHhId = d.household_id ? String(d.household_id?._id ?? d.household_id) : null;
              return hhId && dHhId === hhId;
            })
          : [];

        // Rutinas del paciente
        const patientRoutines = Array.isArray(routines)
          ? routines.filter((r) => String(r.user_id?._id ?? r.user_id) === selectedPatientId)
          : [];

        // Alertas no resueltas asociadas al hogar
        const patientAlerts = Array.isArray(alerts)
          ? alerts.filter((a) => {
              const aHhId = a.device_id?.household_id
                ? String(a.device_id.household_id?._id ?? a.device_id.household_id)
                : null;
              return hhId && aHhId === hhId && a.resolved === false;
            })
          : [];

        setPatientData({
          household:   patientHousehold,
          devices:     patientDevices,
          routines:    patientRoutines,
          alerts:      patientAlerts,
        });
      } catch { setPatientData(null); }
      finally   { setLoadingPatient(false); }
    })();
  }, [selectedPatientId, dataRefreshKey]);

  /* ── Categorías ── */
  const [activeCategory, setActiveCategory] = useState('alertas');
  const currentCat = useMemo(
    () => CATEGORIES.find((c) => c.key === activeCategory) || CATEGORIES[0],
    [activeCategory],
  );

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p._id) === selectedPatientId),
    [patients, selectedPatientId],
  );

  const chartTheme = themeName === 'dark' ? 'dark' : 'light';

  /* ── Render ── */
  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={() => { logout(); navigate('/login'); }}
      />
      <Body>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Main>

          {/* ── Cabecera ── */}
          <PageHeader>
            <PageMeta>
              <PageTitle>📊 Estadísticas</PageTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <LastUpdated>Última actualización: {timeAgo(lastUpdated)}</LastUpdated>
                <FreeTierBadge>
                  ⚠ Plan gratuito · refresco cada 4h
                </FreeTierBadge>
              </div>
            </PageMeta>
            <HeaderActions>
              <RefreshBtn onClick={handleRefresh} $spinning={isRefreshing}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Actualizar
              </RefreshBtn>
            </HeaderActions>
          </PageHeader>

          {/* ── Tabs ── */}
          <TabBar>
            <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              🗺 Resumen del sistema
            </Tab>
            <Tab $active={activeTab === 'patient'} onClick={() => setActiveTab('patient')}>
              👤 Datos del paciente
            </Tab>
            <Tab $active={activeTab === 'category'} onClick={() => setActiveTab('category')}>
              📂 Por categoría
            </Tab>
          </TabBar>

          {/* ══════════════════════════════════════════
              TAB: VISTA GENERAL
          ══════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <TabContent>
              <InfoBanner>
                ℹ️ Los gráficos se cargan desde MongoDB Charts con un retardo de 4h (plan gratuito).
                Usa el botón "Actualizar" que hay arriba a la derecha para forzar la recarga visual.
              </InfoBanner>

              {/* Fila 1 — KPIs rápidos */}
              <SectionLabel>
                <SectionTitle>Indicadores del día</SectionTitle>
                <SectionDivider />
              </SectionLabel>
              <ChartGrid $cols={3} style={{ marginBottom: '1.25rem' }}>
                <EmbeddedChart id={CHART_IDS.alertasHoy}         title="Alertas de hoy"          desc="Estado pendiente"    refreshKey={refreshKey} chartTheme={chartTheme} />
                <EmbeddedChart id={CHART_IDS.alertasSinResolver}  title="Alertas sin resolver"    desc="Contador KPI"        refreshKey={refreshKey} chartTheme={chartTheme} />
                <EmbeddedChart id={CHART_IDS.habitacionesMonitorizadas} title="Habitaciones monitorizadas" desc="Estado global" refreshKey={refreshKey} chartTheme={chartTheme} />
              </ChartGrid>

              {/* Fila 2 — Distribución */}
              <SectionLabel $mt="0.5rem">
                <SectionTitle>Distribución</SectionTitle>
                <SectionDivider />
              </SectionLabel>
              <ChartGrid $cols={3} style={{ marginBottom: '1.25rem' }}>
                <EmbeddedChart id={CHART_IDS.dispPorPaciente}   title="Dispositivos por paciente"   desc="Por hogar"        tall refreshKey={refreshKey} chartTheme={chartTheme} />
                <EmbeddedChart id={CHART_IDS.dispPorHab}        title="Dispositivos por habitación" desc="Distribución"     tall refreshKey={refreshKey} chartTheme={chartTheme} />
                <EmbeddedChart id={CHART_IDS.consumoPorCasa}    title="Consumo por casa"            desc="Actividad"        tall refreshKey={refreshKey} chartTheme={chartTheme} />
              </ChartGrid>

              {/* Fila 3 — Alertas detalle */}
              <SectionLabel $mt="0.5rem">
                <SectionTitle>Alertas — detalle</SectionTitle>
                <SectionDivider />
              </SectionLabel>
              <ChartGrid $cols={2}>
                <EmbeddedChart id={CHART_IDS.numAlertas}       title="Número de alertas"        desc="Por hogar" tall refreshKey={refreshKey} chartTheme={chartTheme} />
                <EmbeddedChart id={CHART_IDS.alertasSinResolver} title="Sin resolver hoy"         desc="KPI"      tall refreshKey={refreshKey} chartTheme={chartTheme} />
              </ChartGrid>
            </TabContent>
          )}

          {/* ══════════════════════════════════════════
              TAB: DATOS DEL PACIENTE
          ══════════════════════════════════════════ */}
          {activeTab === 'patient' && (
            <TabContent>
              {/* Selector */}
              <PatientSelectorWrap>
                <PatientLabel htmlFor="patient-select">Paciente:</PatientLabel>
                <PatientSelect
                  id="patient-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.length === 0 && <option value="">Sin pacientes</option>}
                  {patients.map((p) => (
                    <option key={p._id} value={String(p._id)}>
                      {p.name || p.email}
                    </option>
                  ))}
                </PatientSelect>
              </PatientSelectorWrap>

              {/* KPIs + listas del paciente */}
              {selectedPatient ? (
                <>
                  <SectionLabel>
                    <SectionTitle>
                      Resumen de {selectedPatient.name || selectedPatient.email}
                    </SectionTitle>
                    <SectionDivider />
                  </SectionLabel>

                  {/* Tarjetas KPI */}
                  <StatsGrid>
                    <StatCard>
                      <StatIcon>📡</StatIcon>
                      {loadingPatient ? <LoadingPulse /> : (
                        <StatValue>{patientData?.devices?.length ?? '—'}</StatValue>
                      )}
                      <StatDesc>Dispositivos registrados</StatDesc>
                    </StatCard>
                    <StatCard>
                      <StatIcon>🔔</StatIcon>
                      {loadingPatient ? <LoadingPulse /> : (
                        <StatValue>{patientData?.alerts?.length ?? '—'}</StatValue>
                      )}
                      <StatDesc>Alertas pendientes</StatDesc>
                    </StatCard>
                    <StatCard>
                      <StatIcon>📅</StatIcon>
                      {loadingPatient ? <LoadingPulse /> : (
                        <StatValue>{patientData?.routines?.length ?? '—'}</StatValue>
                      )}
                      <StatDesc>Rutinas configuradas</StatDesc>
                    </StatCard>
                    <StatCard>
                      <StatIcon>🏠</StatIcon>
                      {loadingPatient ? <LoadingPulse /> : (
                        <StatValue style={{ fontSize: '1.2rem' }}>
                          {patientData?.household?.name || '—'}
                        </StatValue>
                      )}
                      <StatDesc>Hogar asignado</StatDesc>
                    </StatCard>
                  </StatsGrid>

                  {/* Dispositivos */}
                  {!loadingPatient && patientData?.devices?.length > 0 && (
                    <>
                      <SectionLabel $mt="0.5rem">
                        <SectionTitle>Dispositivos</SectionTitle>
                        <SectionDivider />
                      </SectionLabel>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {patientData.devices.map((d) => (
                          <DeviceChip key={d._id}>
                            📡 {d.appliance || d.type || 'Dispositivo'}
                            {d.room && <em style={{ marginLeft: '0.35rem', color: 'inherit', opacity: 0.75 }}>· {d.room}</em>}
                          </DeviceChip>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Rutinas */}
                  {!loadingPatient && patientData?.routines?.length > 0 && (
                    <>
                      <SectionLabel $mt="0.5rem">
                        <SectionTitle>Rutinas</SectionTitle>
                        <SectionDivider />
                      </SectionLabel>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {patientData.routines.map((r) => (
                          <DeviceChip key={r._id}>
                            📅 {r.name || 'Rutina sin nombre'}
                          </DeviceChip>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Alertas pendientes */}
                  {!loadingPatient && patientData?.alerts?.length > 0 && (
                    <>
                      <SectionLabel $mt="0.5rem">
                        <SectionTitle>Alertas pendientes</SectionTitle>
                        <SectionDivider />
                      </SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {patientData.alerts.map((a) => (
                          <div key={a._id} style={{
                            padding: '0.6rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,.25)',
                            background: 'rgba(239,68,68,.06)',
                            fontSize: '0.85rem',
                          }}>
                            🔔 <strong>{a.title || a.type || 'Alerta'}</strong>
                            {a.timestamp && (
                              <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                                · {new Date(a.timestamp).toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Sin datos */}
                  {!loadingPatient && patientData &&
                    !patientData.devices?.length &&
                    !patientData.routines?.length &&
                    !patientData.alerts?.length && (
                    <InfoBanner style={{ marginTop: '0.5rem' }}>
                      ℹ️ Este paciente no tiene dispositivos, rutinas ni alertas registradas.
                    </InfoBanner>
                  )}
                </>
              ) : (
                <InfoBanner>ℹ️ Selecciona un paciente para ver sus datos.</InfoBanner>
              )}
            </TabContent>
          )}

          {/* ══════════════════════════════════════════
              TAB: POR CATEGORÍA
          ══════════════════════════════════════════ */}
          {activeTab === 'category' && (
            <TabContent>
              <CatBar>
                {CATEGORIES.map((cat) => (
                  <CatBtn
                    key={cat.key}
                    $active={activeCategory === cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    {cat.label}
                  </CatBtn>
                ))}
              </CatBar>

              <ChartGrid $cols={currentCat.charts.length >= 3 ? 2 : currentCat.charts.length}>
                {currentCat.charts.map((c, i) => (
                  <EmbeddedChart
                    key={`${currentCat.key}-${i}`}
                    id={c.id}
                    title={c.title}
                    desc={c.desc}
                    tall
                    refreshKey={refreshKey}
                    chartTheme={chartTheme}
                  />
                ))}
              </ChartGrid>
            </TabContent>
          )}

        </Main>
      </Body>
      <Footer />
    </AppContainer>
  );
}

/* ─── DeviceChip (inline para no saturar imports) ───────────────────────── */
const DeviceChip = styled.div`
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
`;
