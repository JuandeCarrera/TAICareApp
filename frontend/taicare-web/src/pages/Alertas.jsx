import React, { useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Header   from '../components/Header.jsx';
import Sidebar  from '../components/Sidebar.jsx';
import Footer   from '../components/Footer.jsx';
import SearchToolbar from '../components/SearchToolbar.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AppContainer = styled.div`
  display: flex; flex-direction: column; height: 100vh; width: 100vw;
`;
const Body = styled.div`
  flex: 1; display: flex; overflow: hidden;
`;
const Main = styled.main`
  flex: 1; background: ${({ theme }) => theme.colors.bg}; padding: 2rem; overflow-y: auto;
`;
const TopBar = styled.div`
  display:flex; justify-content:space-between; align-items:center; gap:.75rem;
`;
const List = styled.ul`
  padding: 0; list-style: none; margin-top: 1rem;
`;
const AlertItem = styled.li`
  display: flex; align-items: center; justify-content: space-between;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 0.75rem 1rem; margin-bottom: 0.6rem;
`;
const Left = styled.div`
  display: flex; align-items: start; gap: .75rem;
`;
const Dot = styled.span`
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: red; margin-top: .6rem;
`;
const Actions = styled.div`
  display: flex; gap: 0.5rem;
`;
const Btn = styled.button`
  font-size: 0.85rem; padding: 0.25rem 0.6rem; border-radius: 6px;
  border: 1px solid
    ${({ theme, variant }) => variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, variant }) => variant === 'primary' ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, variant }) => variant === 'primary' ? 'white' : theme.colors.text};
  cursor: pointer; transition: background 0.2s;
  &:hover {
    background: ${({ theme, variant }) => variant === 'primary' ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`;
const Meta = styled.div`
  font-size: .85rem; opacity: .85;
`;

export default function Alertas() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768);

  // datos
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]); // filtro por paciente
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // búsqueda / filtros / orden
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState({
    resolved: '',       // '', 'true', 'false'
    types: [],          // múltiple (lo dejamos oculto por ahora)
    patient: '',        // user_id
    dateFrom: '',       // yyyy-mm-dd
    dateTo: '',         // yyyy-mm-dd
    onlyUnseen: false
  });
  const [sort, setSort] = useState('timestamp:desc');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoadError('');
      setLoading(true);
      const [aRes, pRes] = await Promise.all([
        fetch(`${API}/alerts`, { credentials: 'include' }),
        fetch(`${API}/users?role=paciente`, { credentials: 'include' }),
      ]);

      if (!aRes.ok) {
        const t = await aRes.text().catch(()=> '');
        throw new Error(`GET /alerts → HTTP ${aRes.status} ${t}`);
      }
      const a = await aRes.json().catch(()=>[]);
      console.log('[Alertas] /alerts →', a);

      const p = pRes.ok ? await pRes.json() : [];

      setAlerts(Array.isArray(a) ? a : []);
      setPatients(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || 'No se pudieron cargar las alertas');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  // helpers
  const fmtDateTime = (d) => {
    if (!d) return '';
    const dd = new Date(d);
    if (isNaN(+dd)) return '';
    return dd.toLocaleString();
  };
  const includesText = (str, q) =>
    String(str || '').toLowerCase().includes(String(q || '').toLowerCase());

  // opciones para filtros dinámicos (tipos, pacientes)
  const typeOptions = useMemo(() => {
    const uniq = Array.from(new Set((alerts || []).map(a => a?.type).filter(Boolean)));
    return uniq.map(v => ({ value: v, label: v }));
  }, [alerts]);

  const patientOptions = useMemo(() => {
    return (patients || []).map(u => ({ value: u._id, label: u.name || u.email || u._id }));
  }, [patients]);

  const sortOptions = [
    { value: 'timestamp:desc', label: 'Más recientes' },
    { value: 'timestamp:asc',  label: 'Más antiguas' },
    { value: 'type:asc',       label: 'Tipo (A–Z)' },
    { value: 'type:desc',      label: 'Tipo (Z–A)' },
  ];

  // fallback helpers para mostrar nombre paciente, dispositivo y título
  function patientLabel(a) {
    return a?.user_id?.name || a?.patient_name_snapshot || a?.user_id || '';
  }
  function deviceLabel(a) {
    if (a?.device_id && typeof a.device_id === 'object') {
      return a.device_id.appliance || a.device_id.plugmodel || a.device_id.room || '';
    }
    return '';
  }
  function safeTitle(a) {
    if (a?.title && a.title.trim()) return a.title;
    const parts = [];
    const p = patientLabel(a);
    const r = a?.routine_name_snapshot || a?.routine_id?.name || '';
    if (p) parts.push(`Paciente: ${p}`);
    if (r) parts.push(`Rutina: ${r}`);
    if (a?.type) parts.push(a.type);
    return parts.length ? parts.join(' · ') : 'Alerta';
  }

  // filtrado + ordenación (client-side)
  const visible = useMemo(() => {
    let arr = Array.isArray(alerts) ? [...alerts] : [];

    if (query.trim()) {
      arr = arr.filter(a =>
        includesText(safeTitle(a), query) ||
        includesText(a.message, query) ||
        includesText(a.type, query) ||
        includesText(a.device_id?.appliance, query) ||
        includesText(a.device_id?.room, query) ||
        includesText(patientLabel(a), query)
      );
    }

    if (filterValues.resolved === 'true') {
      arr = arr.filter(a => a.resolved === true);
    } else if (filterValues.resolved === 'false') {
      arr = arr.filter(a => a.resolved === false);
    }

    if (filterValues.onlyUnseen) {
      arr = arr.filter(a => !a.seen);
    }

    if (Array.isArray(filterValues.types) && filterValues.types.length) {
      const set = new Set(filterValues.types);
      arr = arr.filter(a => a.type && set.has(a.type));
    }

    if (filterValues.patient) {
      const pid = String(filterValues.patient);
      arr = arr.filter(a => String(a.user_id?._id || a.user_id || '') === pid);
    }

    if (filterValues.dateFrom) {
      const from = new Date(filterValues.dateFrom + 'T00:00:00Z').getTime();
      arr = arr.filter(a => {
        const t = new Date(a.timestamp || a.createdAt).getTime();
        return !isNaN(t) && t >= from;
      });
    }
    if (filterValues.dateTo) {
      const to = new Date(filterValues.dateTo + 'T23:59:59Z').getTime();
      arr = arr.filter(a => {
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
        a = 0; b = 0;
      }
      if (a < b) return -1 * mul;
      if (a > b) return  1 * mul;
      return 0;
    });

    return arr;
  }, [alerts, query, filterValues, sort]);

  // acciones
  async function markSeen(id) {
    await fetch(`${API}/alerts/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ seen: true })
    }).catch(()=>{});
    setAlerts(as => as.map(a => a._id === id ? { ...a, seen: true } : a));
  }

  async function deleteAlert(id) {
    if (!confirm('¿Borrar esta alerta?')) return;
    const res = await fetch(`${API}/alerts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) setAlerts(as => as.filter(a => a._id !== id));
  }

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen(o => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen}/>
        <Main>
          <TopBar>
            <h1>Alertas</h1>
            <Btn onClick={loadData}>Recargar</Btn>
          </TopBar>

          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar por texto (título, mensaje, tipo, habitación, electrodoméstico)…"
            filters={[
              {
                key: 'resolved',
                label: 'Estado',
                type: 'select',
                options: [
                  { value: '', label: 'Todas' },
                  { value: 'false', label: 'Pendientes' },
                  { value: 'true',  label: 'Resueltas' },
                ]
              },
              {
                key: 'patient',
                label: 'Paciente',
                type: 'select',
                options: [{ value: '', label: 'Todos' }, ...patientOptions]
              },
              { key: 'date', label: 'Fecha', type: 'daterange', fromKey: 'dateFrom', toKey: 'dateTo' },
            ]}
            values={filterValues}
            onValuesChange={setFilterValues}
            sortOptions={[...sortOptions]}
            sort={sort}
            onSortChange={setSort}
            onClear={() => {
              setQuery('');
              setFilterValues({ resolved: '', types: [], patient: '', dateFrom:'', dateTo:'', onlyUnseen:false });
              setSort('timestamp:desc');
            }}
          />

          {loading ? (
            <p style={{ opacity:.8, marginTop: 12 }}>Cargando…</p>
          ) : loadError ? (
            <p style={{ color:'#f55', marginTop: 12 }}>
              {loadError}
            </p>
          ) : visible.length === 0 ? (
            <p style={{ opacity:.7, marginTop: 12 }}>
              No hay alertas para mostrar.
              {alerts.length > 0 && ' (las existentes podrían no pasar los filtros o tener campos vacíos)'}
            </p>
          ) : (
            <>
              <p style={{ opacity:.7, margin: '8px 0 12px' }}>
                {visible.length} alerta{visible.length !== 1 ? 's' : ''} encontradas
              </p>

              <List>
                {visible.map(a => (
                  <AlertItem key={a._id}>
                    <Left>
                      {!a.seen && <Dot />}
                      <div>
                        <p style={{ margin: 0 }}>
                          <strong>{safeTitle(a)}</strong>
                        </p>
                        {a.message && (
                          <p style={{ margin: '.2rem 0 0' }}>{a.message}</p>
                        )}
                        <Meta>
                          {fmtDateTime(a.timestamp || a.createdAt)}
                          {patientLabel(a) ? ` · ${patientLabel(a)}` : ''}
                          {a.type ? ` · ${a.type}` : ''}
                          {a.device_id?.room ? ` · ${a.device_id.room}` : ''}
                          {deviceLabel(a) ? ` · ${deviceLabel(a)}` : ''}
                        </Meta>
                      </div>
                    </Left>
                    <Actions>
                      {!a.seen && (
                        <Btn variant="primary" onClick={() => markSeen(a._id)} title="Marcar como vista">✓</Btn>
                      )}
                      <Btn onClick={() => deleteAlert(a._id)} title="Eliminar">🗑</Btn>
                    </Actions>
                  </AlertItem>
                ))}
              </List>
            </>
          )}
        </Main>
      </Body>
      <Footer/>
    </AppContainer>
  );
}
