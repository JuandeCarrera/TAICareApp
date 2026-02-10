import React, { useContext, useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import Modal, { FormGroup } from '../components/Modal.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';
import {
  useHouseholds,
  useCreateHousehold,
  useUpdateHousehold,
  useDeleteHousehold,
  useAddRoom,
} from '../hooks/useHouseholds';
import { useUsers } from '../hooks/useUsers';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getUserId = (u) => u?._id || u?.id;

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
const Row = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.25rem;
  height: 100%;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  overflow: auto;
`;
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
`;
const PatientItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ selected, theme }) =>
    selected ? theme.colors.hoverBg : theme.colors.cardBg};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
  }
  & + & {
    margin-top: 0.5rem;
  }
`;
const Left = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  > strong,
  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  > strong,
  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  & > button {
    margin-left: 0.25rem;
  }
`;
const Dot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #e00;
  border-radius: 999px;
  margin-left: 0.25rem;
`;
const Btn = styled.button`
  font-size: 0.85rem;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
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
const NewButton = styled(Btn).attrs({ variant: 'primary' })`
  margin: 0.5rem 0 1rem;
`;
const Section = styled.section`
  & + & {
    margin-top: 1rem;
  }
`;
const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;
const DeviceRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;
const RoomsList = styled.ul`
  margin-top: 0.5rem;
  padding-left: 1.25rem;
  list-style: disc;
`;
const RoomItem = styled.li`
  margin-bottom: 0.25rem;
`;
const SuggestBox = styled.div`
  position: absolute;
  z-index: 20;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
`;
const SuggestItem = styled.div`
  padding: 8px 10px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
  }
`;
const SuggestDivider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
const DangerBtn = styled(Btn)`
  border-color: #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;

export default function UsersPage() {
  const { user, logout } = useContext(AuthContext);
  const caregiverId = user?._id || user?.id || null;
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768);

  // --- Hooks (React Query) ---
  const { data: households = [], isLoading: loadingHouseholds } = useHouseholds(); // reemplaza fetchHouseholds

  // Parametros para useUsers
  const userQueryParams = useMemo(() => {
    const p = { role: 'paciente' };
    if (caregiverId) p.caregiver_id = caregiverId;
    return p;
  }, [caregiverId]);

  const { data: patients = [], isLoading: loadingPatients } = useUsers(userQueryParams);

  // Mutations
  const createHouseholdMutation = useCreateHousehold();
  const updateHouseholdMutation = useUpdateHousehold();
  const addRoomMutation = useAddRoom();

  // --- Estados locales para UI ---
  const [hhQuery, setHhQuery] = useState('');
  const [hhOpen, setHhOpen] = useState(false);

  // Dispositivos (del cuidador; luego filtramos por hogar del paciente)
  const [allDevices, setAllDevices] = useState([]);
  const [patientDevices, setPatientDevices] = useState([]);
  const [patientHouse, setPatientHouse] = useState(null);

  // ---- Modal de hogar dentro de Pacientes ----
  const [houseModalOpen, setHouseModalOpen] = useState(false);
  const [houseMode, setHouseMode] = useState('view');
  const [houseForm, setHouseForm] = useState({
    targetHouseId: '',
    name: '',
    address: '',
    roomName: '',
    // para dispositivo
    plugmodel: '',
    room: '',
    appliance: '',
  });

  const [selectedId, setSelectedId] = useState(null);
  const [unread, setUnread] = useState({});
  const [routines, setRoutines] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'paciente',
    household_id: '',
    history: '',
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({ id: null, name: '' });

  // Carga de alertas no leídas inicial (podríamos moverlo a hook también, pero por ahora lo dejamos)
  useEffect(() => {
    if (patients.length) {
      refreshUnreadForList(patients).catch(() => { });
    }
  }, [patients]);

  // Carga de dispositivos (pendiente de refactorizar a hook useDevices si se quisiera)
  useEffect(() => {
    fetch(`${API}/devices`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllDevices)
      .catch(() => setAllDevices([]));
  }, []); // Cargar una vez

  // Al seleccionar paciente
  useEffect(() => {
    if (!selectedId) {
      setRoutines([]);
      setAlerts([]);
      setPatientHouse(null);
      setPatientDevices([]);
      return;
    }
    setRoutines([]);
    setAlerts([]);
    loadUnreadCount(selectedId);
    loadRoutines(selectedId);
    loadAlerts(selectedId);

    const p = patients.find((x) => x._id === selectedId);
    const house = households.find((h) => sameId(h.owner, p?._id));
    setPatientHouse(house || null);

    if (house?._id) {
      const list = allDevices.filter((d) => sameId(d.household_id, house._id));
      setPatientDevices(list);
    } else {
      setPatientDevices([]);
    }
  }, [selectedId, households, allDevices, patients]);

  /* --- Helpers de carga de sub-entidades (pendientes de refactor) --- */

  async function loadUnreadCount(userId) {
    try {
      const res = await fetch(
        `${API}/alerts?user_id=${encodeURIComponent(userId)}&unread=1`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) {
        setUnread((u) => ({ ...u, [userId]: 0 }));
        return;
      }
      let arr = await res.json();
      arr = Array.isArray(arr)
        ? arr.filter(
          (a) =>
            sameId(a.user_id, userId) &&
            (a.read === false || a.read === 0 || a.read === 'false')
        )
        : [];
      const count = arr.length;
      setUnread((u) => ({ ...u, [userId]: count }));
    } catch (e) {
      console.warn('No pude obtener no leídas', e);
      setUnread((u) => ({ ...u, [userId]: 0 }));
    }
  }

  async function loadRoutines(userId) {
    try {
      const res = await fetch(
        `${API}/routines?user_id=${encodeURIComponent(userId)}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        setRoutines([]);
        return;
      }
      let arr = await res.json();
      arr = Array.isArray(arr)
        ? arr.filter((r) => (r.user_id?._id || r.user_id) === userId)
        : [];
      setRoutines(arr);
    } catch {
      setRoutines([]);
    }
  }

  async function loadAlerts(userId) {
    try {
      const res = await fetch(
        `${API}/alerts?user_id=${encodeURIComponent(userId)}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        setAlerts([]);
        return;
      }
      let arr = await res.json();
      arr = Array.isArray(arr)
        ? arr.filter((a) => (a.user_id?._id || a.user_id) === userId)
        : [];
      setAlerts(arr);
    } catch {
      setAlerts([]);
    }
  }

  async function refreshUnreadForList(list) {
    if (!Array.isArray(list) || !list.length) return;
    const entries = await Promise.all(
      list.map(async (p) => {
        try {
          const res = await fetch(
            `${API}/alerts?user_id=${encodeURIComponent(p._id)}&unread=1`,
            { credentials: 'include' }
          );
          if (!res.ok) return [p._id, 0];
          let arr = await res.json();
          arr = Array.isArray(arr)
            ? arr.filter(
              (a) =>
                sameId(a.user_id, p._id) &&
                (a.read === false || a.read === 0 || a.read === 'false')
            )
            : [];
          return [p._id, arr.length];
        } catch {
          return [p._id, 0];
        }
      })
    );
    setUnread((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  function formatDateSafe(v) {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openNew = () => {
    setEditId(null);
    setForm({
      name: '',
      email: '',
      role: 'paciente',
      household_id: '',
      history: '',
      caregiver_id: caregiverId || '',
    });
    setHhQuery('');
    setShowEditModal(true);
  };

  const openEditPatient = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name || '',
      email: p.email || '',
      role: p.role || 'paciente',
      household_id: p.household_id || '',
      history: p.history || '',
      caregiver_id: getUserId(p.caregiver_id) || caregiverId || '',
    });
    setHhQuery(getHouseholdName(p.household_id) || '');
    setShowEditModal(true);
  };

  const openEditHistory = (p) => {
    setEditId(p._id);
    setForm((f) => ({ ...f, history: p.history || '' }));
    setShowHistoryModal(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Guardar paciente (Create / Update) - No refactorizado a hook aun
  const savePatient = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: 'paciente',
        household_id: form.household_id || null,
        history: form.history || '',
        caregiver_id: form.caregiver_id || caregiverId || null,
      };
      let res;
      if (editId) {
        res = await fetch(`${API}/users/${editId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/users`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error('Error al guardar el paciente');

      // Invalidar cache de users
      // Como no estamos usando useUsers mutation, hacemos "refetch" manual indirecto?
      // Lo ideal seria usar mutation. Pero al usar useUsers hook, si hacemos invalidateQueries, se recargará.
      // Por ahora, forzamos recarga simple:
      window.location.reload();
      // OJO: Esto es "sucio" pero rápido si no refactorizamos User mutations ahora.
      // Mejor sería:
      // queryClient.invalidateQueries(['users'])

      setShowEditModal(false);
      setEditId(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const saveHistoryOnly = async () => {
    try {
      if (!editId) return;
      const res = await fetch(`${API}/users/${editId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: form.history }),
      });
      if (!res.ok) throw new Error('Error al guardar la historia clínica');
      window.location.reload();
      setShowHistoryModal(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const sameId = (a, b) => {
    const A = (a && (a._id || a.id || a))?.toString?.() ?? String(a);
    const B = (b && (b._id || b.id || b))?.toString?.() ?? String(b);
    return A === B;
  };

  const getHouseholdName = (id) => {
    const h = households.find((x) => x._id === id);
    return h?.name || '';
  };

  // Crear hogar rápido desde modal paciente
  async function addNewHousehold(name) {
    if (!name?.trim()) return;
    try {
      const created = await createHouseholdMutation.mutateAsync({
        name: name.trim(),
        rooms: [],
        owner: caregiverId, // <--- Assign caregiver as owner initially
      });

      setForm((f) => ({ ...f, household_id: created._id }));
      setHhQuery(created.name);
      setHhOpen(false);
    } catch (e) {
      alert(e.message || 'Error al crear hogar');
    }
  }

  function openHouseModal(h) {
    if (!h) return;
    setHouseMode('view');
    setHouseForm({
      targetHouseId: h._id,
      name: h.name || '',
      address: h.address || '',
      roomName: '',
      plugmodel: '',
      room: '',
      appliance: '',
    });
    setHouseModalOpen(true);
  }

  function openEditHouseInModal() {
    setHouseMode('editHouse');
  }

  function openNewRoomInModal() {
    setHouseMode('room');
    setHouseForm((f) => ({ ...f, roomName: '' }));
  }

  function openNewDeviceInModal() {
    setHouseMode('device');
    const h = households.find((x) => x._id === houseForm.targetHouseId);
    const firstRoom = h?.rooms?.[0] || '';
    setHouseForm((f) => ({
      ...f,
      plugmodel: '',
      room: firstRoom,
      appliance: '',
    }));
  }

  // Refrescar al guardar cambios en modal hogar
  async function refreshHouseAndPanel() {
    // Ya no es necesario recargar manual con hooks si invalidamos queries
    // pero necesitamos recargar los devices si cambiaron
    fetch(`${API}/devices`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllDevices)
      .catch(() => setAllDevices([]));
  }

  async function saveHouseModal() {
    try {
      const hid = houseForm.targetHouseId;

      if (houseMode === 'editHouse') {
        await updateHouseholdMutation.mutateAsync({
          id: hid,
          name: houseForm.name,
          address: houseForm.address
        });
      }

      if (houseMode === 'room') {
        await addRoomMutation.mutateAsync({
          id: hid,
          room: houseForm.roomName
        });
      }

      if (houseMode === 'device') {
        // Device mutation no implementada en hook aun, usamos fetch original
        const res = await fetch(`${API}/devices`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plugmodel: houseForm.plugmodel,
            household_id: hid,
            room: houseForm.room,
            appliance: houseForm.appliance,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          setAllDevices((prev) => [...prev, saved]);
        } else {
          throw new Error('Error guardando dispositivo');
        }
      }

      await refreshHouseAndPanel(); // para recargar devices si hace falta
      setHouseMode('view');
    } catch (e) {
      alert(e.message || 'Error al guardar');
    }
  }

  async function deleteRoomInModal(room) {
    if (!confirm('¿Borrar habitación?')) return;
    const hid = houseForm.targetHouseId;
    const h = households.find((x) => x._id === hid);
    const updated = (h?.rooms || []).filter((r) => r !== room);

    try {
      await updateHouseholdMutation.mutateAsync({
        id: hid,
        rooms: updated
      });
      await refreshHouseAndPanel();
    } catch (e) {
      alert('Error al borrar habitación');
    }
  }

  function askDeletePatient(p) {
    setConfirmData({ id: p._id, name: p.name || 'Sin nombre' });
    setConfirmOpen(true);
  }

  async function confirmDeletePatient() {
    // Usamos fetch directo porque no hay mutation
    if (!confirmData.id) return;
    try {
      const res = await fetch(`${API}/users/${confirmData.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al borrar paciente');

      window.location.reload(); // Force reload list
      setConfirmOpen(false);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <h1>Pacientes</h1>

          <Row>
            {/* Columna izquierda: listado */}
            <Card>
              <NewButton onClick={openNew}>+ Nuevo paciente</NewButton>
              {loadingPatients ? (
                <p>Cargando…</p>
              ) : (
                <List>
                  {patients.map((p) => (
                    <PatientItem
                      key={p._id}
                      selected={p._id === selectedId}
                      onClick={() => setSelectedId(p._id)}
                    >
                      <Left>
                        <strong>{p.name || '(Sin nombre)'}</strong>
                        {/* <span style={{ opacity:.8, fontSize:'.9rem' }}>{p.email}</span> */}
                        {(unread[p._id] ?? 0) > 0 && (
                          <Dot
                            title={`${unread[p._id]} notificaciones sin leer`}
                          />
                        )}
                      </Left>
                      <Right>
                        <Btn
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditHistory(p);
                          }}
                        >
                          🧾 Hist
                        </Btn>
                        <Btn
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPatient(p);
                          }}
                        >
                          ✎{' '}
                        </Btn>
                        <DangerBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            askDeletePatient(p);
                          }}
                        >
                          🗑
                        </DangerBtn>
                      </Right>
                    </PatientItem>
                  ))}
                </List>
              )}
            </Card>

            {/* Columna derecha: detalles */}
            <Card>
              {!selectedId ? (
                <p style={{ opacity: 0.6 }}>Selecciona un paciente para ver detalles</p>
              ) : (
                <>
                  <Section>
                    <h2>
                      {patients.find((p) => p._id === selectedId)?.name}
                    </h2>
                    <p>
                      <strong>Email: </strong>
                      {patients.find((p) => p._id === selectedId)?.email || '-'}
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                      <strong>Historia Clínica:</strong>
                    </p>
                    <div
                      style={{
                        background: '#f9fafb',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginTop: '0.25rem',
                        minHeight: '60px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {patients.find((p) => p._id === selectedId)?.history ||
                        'Sin historia clínica.'}
                    </div>
                  </Section>

                  <Section>
                    <SectionHeader>
                      <h3>Hogar</h3>
                      <Btn
                        variant="primary"
                        onClick={() => openHouseModal(patientHouse)}
                        disabled={!patientHouse}
                      >
                        Ver detalles / Dispositivos
                      </Btn>
                    </SectionHeader>

                    {patientHouse ? (
                      <div
                        style={{
                          border: '1px solid #ccc',
                          padding: '0.75rem',
                          borderRadius: '6px',
                        }}
                      >
                        <strong>{patientHouse.name}</strong>
                        {patientHouse.address && (
                          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            {patientHouse.address}
                          </div>
                        )}
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          <strong>Habitaciones: </strong>
                          {(patientHouse.rooms || []).length > 0
                            ? patientHouse.rooms.join(', ')
                            : 'Ninguna'}
                        </div>
                      </div>
                    ) : (
                      <p style={{ opacity: 0.7 }}>Este paciente no tiene hogar asignado.</p>
                    )}
                  </Section>

                  <Section>
                    <h3>Rutinas de hoy</h3>
                    {routines.length === 0 ? (
                      <p>No hay rutinas asignadas.</p>
                    ) : (
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                        {routines.map((r) => (
                          <li key={r._id} style={{ marginBottom: '0.25rem' }}>
                            <strong>{r.name}</strong>{' '}
                            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                              ({(r.occurrences || []).map(o => `${o.start}-${o.end}`).join(', ')})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section>
                    <h3>Alertas recientes</h3>
                    {alerts.length === 0 ? (
                      <p>No hay alertas.</p>
                    ) : (
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                        {alerts.slice(0, 5).map((a) => (
                          <li key={a._id} style={{ marginBottom: '0.25rem' }}>
                            [{formatDateSafe(a.created_at)}] {a.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                </>
              )}
            </Card>
          </Row>
        </Main>
      </Body>
      <Footer />

      {/* Modal editar paciente */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2>{editId ? 'Editar paciente' : 'Nuevo paciente'}</h2>
        <FormGroup>
          <label>Nombre</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Nombre completo"
          />
        </FormGroup>
        <FormGroup>
          <label>Email (opcional)</label>
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="correo@ejemplo.com"
          />
        </FormGroup>

        {/* Selección hogar */}
        <FormGroup style={{ position: 'relative' }}>
          <label>Hogar</label>
          <div
            style={{
              border: '1px solid #ccc',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onClick={() => setHhOpen(!hhOpen)}
          >
            <span>{hhQuery || 'Sin hogar asignado'}</span>
            <span style={{ fontSize: '0.8rem' }}>▼</span>
          </div>

          {hhOpen && (
            <SuggestBox>
              <div style={{ padding: '8px' }}>
                <input
                  autoFocus
                  placeholder="Buscar hogar o escribir nuevo..."
                  style={{ width: '100%', padding: '0.4rem' }}
                  value={hhQuery}
                  onChange={(e) => setHhQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <SuggestDivider />
              {households
                .filter((h) =>
                  (h.name || '').toLowerCase().includes(hhQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((h) => (
                  <SuggestItem
                    key={h._id}
                    onClick={() => {
                      setForm((f) => ({ ...f, household_id: h._id }));
                      setHhQuery(h.name);
                      setHhOpen(false);
                    }}
                  >
                    {h.name} <small>({h.address})</small>
                  </SuggestItem>
                ))}
              {hhQuery &&
                !households.find(
                  (h) => h.name.toLowerCase() === hhQuery.toLowerCase()
                ) && (
                  <>
                    <SuggestDivider />
                    <SuggestItem
                      onClick={() => addNewHousehold(hhQuery)}
                      style={{ color: '#2563eb', fontWeight: 'bold' }}
                    >
                      + Crear "{hhQuery}"
                    </SuggestItem>
                  </>
                )}
              <SuggestDivider />
              <SuggestItem
                onClick={() => {
                  setForm((f) => ({ ...f, household_id: '' }));
                  setHhQuery('');
                  setHhOpen(false);
                }}
                style={{ color: '#666' }}
              >
                (Ninguno)
              </SuggestItem>
            </SuggestBox>
          )}
        </FormGroup>

        <FormGroup>
          <label>Historia Clínica / Notas</label>
          <textarea
            name="history"
            value={form.history}
            onChange={onChange}
            rows={4}
            placeholder="Antecedentes, medicación, observaciones..."
          />
        </FormGroup>

        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <DangerBtn onClick={() => setShowEditModal(false)}>Cancelar</DangerBtn>
          <Btn variant="primary" onClick={savePatient}>
            Guardar
          </Btn>
        </div>
      </Modal>

      {/* Modal Historial */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        <h2>Historia Clínica</h2>
        <p style={{ marginBottom: '1rem', opacity: 0.7 }}>
          Edición rápida de los antecedentes y notas médicas.
        </p>
        <FormGroup>
          <textarea
            name="history"
            value={form.history}
            onChange={onChange}
            rows={10}
            style={{ fontFamily: 'monospace' }}
          />
        </FormGroup>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <DangerBtn onClick={() => setShowHistoryModal(false)}>
            Cancelar
          </DangerBtn>
          <Btn variant="primary" onClick={saveHistoryOnly}>
            Guardar
          </Btn>
        </div>
      </Modal>

      {/* Modal Confirmación Borrar */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2>¿Eliminar paciente?</h2>
        <p>
          Se borrará a <strong>{confirmData.name}</strong>. Esta acción es
          irreversible.
        </p>
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <Btn onClick={() => setConfirmOpen(false)}>Cancelar</Btn>
          <DangerBtn onClick={confirmDeletePatient}>Sí, borrar</DangerBtn>
        </div>
      </Modal>

      {/* Modal Detalle Hogar dentro de Pacientes */}
      <Modal isOpen={houseModalOpen} onClose={() => setHouseModalOpen(false)}>
        <h2>
          {houseMode === 'view' && 'Detalles del Hogar'}
          {houseMode === 'editHouse' && 'Editar Hogar'}
          {houseMode === 'room' && 'Añadir habitación'}
          {houseMode === 'device' && 'Añadir dispositivo'}
        </h2>

        {houseMode === 'view' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h3>{houseForm.name}</h3>
              <p>{houseForm.address}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4>Habitaciones</h4>
              <RoomsList>
                {households.find(h => h._id === houseForm.targetHouseId)?.rooms?.map(r => (
                  <DeviceRow key={r}>
                    {r}
                    <DangerBtn style={{ padding: '.1rem .4rem', fontSize: '.7rem' }} onClick={() => deleteRoomInModal(r)}>x</DangerBtn>
                  </DeviceRow>
                ))}
              </RoomsList>
              <Btn onClick={openNewRoomInModal} style={{ marginTop: '.5rem' }}>+ Añadir habitación</Btn>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4>Dispositivos en este hogar</h4>
              <List>
                {patientDevices.map(d => (
                  <li key={d._id} style={{ padding: '.25rem 0' }}>
                    <strong>{d.plugmodel}</strong> en <em>{d.room}</em> ({d.appliance})
                  </li>
                ))}
                {!patientDevices.length && <li>No hay dispositivos.</li>}
              </List>
              <Btn onClick={openNewDeviceInModal} style={{ marginTop: '.5rem' }}>+ Añadir dispositivo</Btn>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '.5rem',
              }}
            >
              <Btn onClick={() => setHouseModalOpen(false)}>Cerrar</Btn>
              <Btn variant="primary" onClick={openEditHouseInModal}>Editar Datos</Btn>
            </div>
          </div>
        )}

        {houseMode !== 'view' && (
          <>
            {houseMode === 'editHouse' && (
              <>
                <FormGroup>
                  <label>Nombre</label>
                  <input value={houseForm.name} onChange={e => setHouseForm(f => ({ ...f, name: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <label>Dirección</label>
                  <input value={houseForm.address} onChange={e => setHouseForm(f => ({ ...f, address: e.target.value }))} />
                </FormGroup>
              </>
            )}

            {houseMode === 'room' && (
              <FormGroup>
                <label>Nombre habitación</label>
                <input value={houseForm.roomName} onChange={e => setHouseForm(f => ({ ...f, roomName: e.target.value }))} />
              </FormGroup>
            )}

            {houseMode === 'device' && (
              <>
                <FormGroup>
                  <label>Modelo enchufe</label>
                  <input value={houseForm.plugmodel} onChange={e => setHouseForm(f => ({ ...f, plugmodel: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <label>Habitación</label>
                  <select value={houseForm.room} onChange={e => setHouseForm(f => ({ ...f, room: e.target.value }))}>
                    {households.find(h => h._id === houseForm.targetHouseId)?.rooms?.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormGroup>
                <FormGroup>
                  <label>Electrodoméstico</label>
                  <input value={houseForm.appliance} onChange={e => setHouseForm(f => ({ ...f, appliance: e.target.value }))} />
                </FormGroup>
              </>
            )}

            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '.5rem',
              }}
            >
              <DangerBtn onClick={() => setHouseMode('view')}>Cancelar</DangerBtn>
              <Btn variant="primary" onClick={saveHouseModal}>Guardar</Btn>
            </div>
          </>
        )}
      </Modal>
    </AppContainer>
  );
}
