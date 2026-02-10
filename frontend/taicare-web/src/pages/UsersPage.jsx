import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import Modal, { FormGroup } from '../components/Modal.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';

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

  // Hogares
  const [households, setHouseholds] = useState([]);
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
  const [editRoomOld, setEditRoomOld] = useState('');

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadPatients();
  }, [caregiverId]);

  useEffect(() => {
    fetch(`${API}/households`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setHouseholds)
      .catch(() => setHouseholds([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/devices`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllDevices)
      .catch(() => setAllDevices([]));
  }, []);

  async function loadPatients() {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set('role', 'paciente');
      if (caregiverId) qs.set('caregiver_id', caregiverId);
      let res = await fetch(`${API}/users?${qs.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('No se pudieron cargar los pacientes');
      let data = await res.json();
      if (caregiverId) {
        data = Array.isArray(data)
          ? data.filter(
            (p) =>
              p.role === 'paciente' &&
              (getUserId(p.caregiver_id) === caregiverId ||
                p.caregiver_id === caregiverId)
          )
          : [];
      } else {
        data = Array.isArray(data)
          ? data.filter((p) => p.role === 'paciente')
          : [];
      }
      setPatients(data);
      refreshUnreadForList(data).catch(() => { });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
  }, [selectedId, households, allDevices]);

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
      const saved = await res.json();
      setPatients((list) => {
        if (editId) return list.map((x) => (x._id === editId ? saved : x));
        return [...list, saved];
      });
      setShowEditModal(false);
      setEditId(null);
      if (!selectedId) setSelectedId(saved._id);
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
      const saved = await res.json();
      setPatients((list) => list.map((x) => (x._id === editId ? saved : x)));
      setShowHistoryModal(false);
      if (selectedId === editId) {
      }
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

  async function addNewHousehold(name) {
    if (!name?.trim()) return;
    try {
      const res = await fetch(`${API}/households`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          rooms: [],
          owner: caregiverId, // <--- Assign caregiver as owner initially
        }),
      });
      if (!res.ok) throw new Error('No se pudo crear el hogar');
      const created = await res.json();
      setHouseholds((prev) => [...prev, created]);
      setForm((f) => ({ ...f, household_id: created._id }));
      setHhQuery(created.name);
      setHhOpen(false);
    } catch (e) {
      alert(e.message);
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

  async function refreshHouseAndPanel() {
    try {
      const res = await fetch(`${API}/households`, { credentials: 'include' });
      const list = res.ok ? await res.json() : [];
      setHouseholds(list);

      const p = patients.find((x) => x._id === selectedId);
      const house = list.find((h) => h._id === (p?.household_id || ''));
      setPatientHouse(house || null);

      if (house?._id) {
        const listDevices = allDevices.filter(
          (d) => d.household_id === house._id
        );
        setPatientDevices(listDevices);
      } else {
        setPatientDevices([]);
      }
    } catch { }
  }

  async function saveHouseModal() {
    try {
      let res;
      const hid = houseForm.targetHouseId;

      if (houseMode === 'editHouse') {
        res = await fetch(`${API}/households/${hid}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: houseForm.name,
            address: houseForm.address,
          }),
        });
      }

      if (houseMode === 'room') {
        res = await fetch(`${API}/households/${hid}/rooms`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: houseForm.roomName }),
        });
      }

      if (houseMode === 'device') {
        res = await fetch(`${API}/devices`, {
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
          // añade a allDevices para que aparezca sin recargar
          const saved = await res.json();
          setAllDevices((prev) => [...prev, saved]);
        }
      }

      if (!res || !res.ok) {
        const err = res ? await res.json().catch(() => ({})) : {};
        throw new Error(err.error || 'Error al guardar');
      }

      await refreshHouseAndPanel();
      setHouseMode('view');
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteRoomInModal(room) {
    if (!confirm('¿Borrar habitación?')) return;
    const hid = houseForm.targetHouseId;
    const h = households.find((x) => x._id === hid);
    const updated = (h?.rooms || []).filter((r) => r !== room);
    const res = await fetch(`${API}/households/${hid}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rooms: updated }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'No se pudo borrar la habitación');
      return;
    }
    await refreshHouseAndPanel();
  }

  async function deletePatient(id) {
    if (!id) return;
    const who = patients.find((x) => x._id === id);
    const ok = confirm(
      `¿Borrar al paciente "${who?.name || 'Sin nombre'}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo borrar el paciente');
      }

      setPatients((list) => list.filter((p) => p._id !== id));
      setUnread((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      if (selectedId === id) {
        setSelectedId(null);
        setRoutines([]);
        setAlerts([]);
        setPatientHouse(null);
        setPatientDevices([]);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  function askDeletePatient(p) {
    setConfirmData({ id: p._id, name: p.name || 'Sin nombre' });
    setConfirmOpen(true);
  }

  async function deletePatient(id) {
    if (!id) return;
    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo borrar el paciente');
      }
      setPatients((list) => list.filter((p) => p._id !== id));
      setUnread((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      if (selectedId === id) {
        setSelectedId(null);
        setRoutines([]);
        setAlerts([]);
        setPatientHouse(null);
        setPatientDevices([]);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  async function confirmDeletePatient() {
    await deletePatient(confirmData.id);
    setConfirmOpen(false);
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
              {loading ? (
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
                          variant="primary"
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
                  {!patients.length && (
                    <p style={{ opacity: 0.7 }}>No hay pacientes aún.</p>
                  )}
                </List>
              )}
            </Card>

            {/* Columna derecha: detalle seleccionado */}
            <Card>
              {!selectedId ? (
                <p>Selecciona un paciente del listado.</p>
              ) : (
                <>
                  <Section>
                    <SectionHeader>
                      <h3 style={{ margin: 0 }}>Rutinas</h3>
                    </SectionHeader>
                    {!routines.length ? (
                      <p style={{ opacity: 0.7 }}>
                        Sin rutinas para este paciente.
                      </p>
                    ) : (
                      <ul>
                        {routines.map((r) => (
                          <li key={r._id}>
                            <strong>{r.name || '(Rutina)'}</strong>{' '}
                            <span style={{ opacity: 0.8 }}>
                              {r.expected_start}–{r.expected_end} ·{' '}
                              {Array.isArray(r.days) ? r.days.join(', ') : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section>
                    <SectionHeader>
                      <h3 style={{ margin: 0 }}>Notificaciones</h3>
                    </SectionHeader>
                    {!alerts.length ? (
                      <p style={{ opacity: 0.7 }}>Sin notificaciones.</p>
                    ) : (
                      <ul>
                        {alerts.map((a) => (
                          <li key={a._id}>
                            <strong>{a.type || 'Alerta'}</strong>{' '}
                            <span style={{ opacity: 0.8 }}>
                              {new Date(
                                a.time || a.created_at || a.date
                              ).toLocaleString()}
                            </span>
                            {a.read ? null : (
                              <Dot title="Sin leer" style={{ marginLeft: 6 }} />
                            )}
                            {a.message ? (
                              <div style={{ opacity: 0.9 }}>{a.message}</div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                  {/* HOGAR del paciente */}
                  <Section>
                    <SectionHeader>
                      <h3
                        style={{ margin: 0, cursor: 'pointer' }}
                        onClick={() =>
                          patientHouse && openHouseModal(patientHouse)
                        }
                      >
                        Hogar
                      </h3>
                    </SectionHeader>
                    {!patientHouse ? (
                      <p style={{ opacity: 0.7 }}>
                        Este paciente no tiene hogar asignado.
                      </p>
                    ) : (
                      <div>
                        <strong
                          style={{
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                          onClick={() => openHouseModal(patientHouse)}
                        >
                          {patientHouse.name}
                        </strong>
                        {patientHouse.address ? (
                          <div style={{ opacity: 0.85 }}>
                            {patientHouse.address}
                          </div>
                        ) : null}
                        {Array.isArray(patientHouse.rooms) &&
                          patientHouse.rooms.length ? (
                          <RoomsList>
                            {patientHouse.rooms.map((r) => (
                              <RoomItem key={r}>{r}</RoomItem>
                            ))}
                          </RoomsList>
                        ) : (
                          <p style={{ opacity: 0.7, marginTop: '.35rem' }}>
                            Sin habitaciones.
                          </p>
                        )}
                      </div>
                    )}
                  </Section>

                  {/* DISPOSITIVOS del hogar del paciente */}
                  <Section>
                    <SectionHeader>
                      <h3 style={{ margin: 0 }}>Dispositivos</h3>
                    </SectionHeader>
                    {!patientHouse ? (
                      <p style={{ opacity: 0.7 }}>
                        Asigna un hogar al paciente para ver sus dispositivos.
                      </p>
                    ) : !patientDevices.length ? (
                      <p style={{ opacity: 0.7 }}>
                        Sin dispositivos en este hogar.
                      </p>
                    ) : (
                      <ul>
                        {patientDevices.map((d) => (
                          <DeviceRow key={d._id}>
                            <span>
                              {d.plugmodel} — {d.room} / {d.appliance}
                            </span>
                            {/* Si quisieras acciones aquí, puedes traer tus <Btn> como en la page de Dispositivos */}
                          </DeviceRow>
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

      {/* Modal crear/editar paciente */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2>{editId ? 'Editar paciente' : 'Nuevo paciente'}</h2>
        <FormGroup>
          <label>Nombre y apellidos</label>
          <input name="name" value={form.name} onChange={onChange} />
        </FormGroup>
        <FormGroup>
          <label>Email</label>
          <input name="email" value={form.email} onChange={onChange} />
        </FormGroup>
        {/* Hogar con búsqueda + crear nuevo */}
        <FormGroup style={{ position: 'relative' }}>
          <label>Hogar (opcional)</label>
          <input
            placeholder="Escribe para buscar…"
            value={hhQuery}
            onFocus={() => setHhOpen(true)}
            onChange={(e) => {
              setHhQuery(e.target.value);
              setHhOpen(true);
            }}
            onBlur={() => setTimeout(() => setHhOpen(false), 150)} // cierra tras hacer click en opción
          />
          {hhOpen && (
            <SuggestBox>
              {households
                .filter((h) =>
                  h.name?.toLowerCase().includes(hhQuery.toLowerCase())
                )
                .map((h) => (
                  <SuggestItem
                    key={h._id}
                    onMouseDown={() => {
                      setForm((f) => ({ ...f, household_id: h._id }));
                      setHhQuery(h.name);
                      setHhOpen(false);
                    }}
                  >
                    {h.name}
                  </SuggestItem>
                ))}
              <SuggestDivider />
              <SuggestItem
                onMouseDown={() => addNewHousehold(hhQuery || 'Nuevo hogar')}
                style={{ fontWeight: 600 }}
              >
                ➕ Añadir “{hhQuery || 'Nuevo hogar'}”
              </SuggestItem>
            </SuggestBox>
          )}
          {/* Mantén el id real en el form */}
          <input
            type="hidden"
            name="household_id"
            value={form.household_id || ''}
          />
          {form.household_id && (
            <small style={{ opacity: 0.8 }}>
              Seleccionado:{' '}
              {getHouseholdName(form.household_id) || form.household_id}
            </small>
          )}
        </FormGroup>
        <FormGroup>
          <label>Historia clínica (opcional)</label>
          <textarea
            name="history"
            rows="4"
            value={form.history}
            onChange={onChange}
          />
        </FormGroup>
        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={savePatient}>
            Guardar
          </Btn>
        </FormGroup>
      </Modal>

      {/* Modal historia clínica rápida */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      >
        <h2>Historia clínica</h2>
        <FormGroup>
          <textarea
            name="history"
            rows="8"
            value={form.history}
            onChange={onChange}
          />
        </FormGroup>
        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={saveHistoryOnly}>
            Guardar
          </Btn>
        </FormGroup>
      </Modal>

      <Modal isOpen={houseModalOpen} onClose={() => setHouseModalOpen(false)}>
        {/* Vista / Acciones */}
        {houseMode === 'view' && (
          <>
            <h2>Hogar</h2>
            <p style={{ marginTop: '.5rem' }}>
              <strong>{patientHouse?.name}</strong>
              <br />
              {patientHouse?.address ? (
                <span>{patientHouse.address}</span>
              ) : (
                <span style={{ opacity: 0.7 }}>Sin dirección</span>
              )}
            </p>

            <div style={{ marginTop: '1rem' }}>
              <strong>Habitaciones</strong>
              {Array.isArray(patientHouse?.rooms) &&
                patientHouse.rooms.length ? (
                <ul
                  style={{
                    marginTop: '.35rem',
                    paddingLeft: '1.25rem',
                    listStyle: 'disc',
                  }}
                >
                  {patientHouse.rooms.map((r) => (
                    <li
                      key={r}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '.35rem',
                      }}
                    >
                      <span>{r}</span>
                      <Btn
                        variant="primary"
                        onClick={() => deleteRoomInModal(r)}
                      >
                        🗑
                      </Btn>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ opacity: 0.7, marginTop: '.35rem' }}>
                  Sin habitaciones.
                </p>
              )}
            </div>

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '.5rem',
                justifyContent: 'flex-end',
              }}
            >
              <Btn variant="primary" onClick={openNewRoomInModal}>
                + Habitación
              </Btn>
              <Btn variant="primary" onClick={openNewDeviceInModal}>
                + Dispositivo
              </Btn>
              <Btn variant="primary" onClick={openEditHouseInModal}>
                ✎ Editar
              </Btn>
            </div>
          </>
        )}

        {houseMode === 'editHouse' && (
          <>
            <h2>Editar casa</h2>
            <label style={{ display: 'block', marginTop: '.5rem' }}>
              Nombre
              <input
                value={houseForm.name}
                onChange={(e) =>
                  setHouseForm((f) => ({ ...f, name: e.target.value }))
                }
                style={{ width: '100%', marginTop: '.35rem' }}
              />
            </label>
            <label style={{ display: 'block', marginTop: '1rem' }}>
              Dirección
              <input
                value={houseForm.address}
                onChange={(e) =>
                  setHouseForm((f) => ({ ...f, address: e.target.value }))
                }
                style={{ width: '100%', marginTop: '.35rem' }}
              />
            </label>
            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <Btn variant="primary" onClick={saveHouseModal}>
                Guardar
              </Btn>
            </div>
          </>
        )}

        {houseMode === 'room' && (
          <>
            <h2>Añadir habitación</h2>
            <label style={{ display: 'block', marginTop: '.5rem' }}>
              Nombre habitación
              <input
                value={houseForm.roomName}
                onChange={(e) =>
                  setHouseForm((f) => ({ ...f, roomName: e.target.value }))
                }
                style={{ width: '100%', marginTop: '.35rem' }}
              />
            </label>
            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <Btn variant="primary" onClick={saveHouseModal}>
                Guardar
              </Btn>
            </div>
          </>
        )}

        {houseMode === 'device' && (
          <>
            <h2>Nuevo dispositivo</h2>
            <label style={{ display: 'block', marginTop: '.5rem' }}>
              Modelo
              <input
                value={houseForm.plugmodel}
                onChange={(e) =>
                  setHouseForm((f) => ({ ...f, plugmodel: e.target.value }))
                }
                style={{ width: '100%', marginTop: '.35rem' }}
              />
            </label>

            <label style={{ display: 'block', marginTop: '1rem' }}>
              Habitación
              <select
                value={houseForm.room}
                onChange={(e) =>
                  setHouseForm((f) => ({ ...f, room: e.target.value }))
                }
                style={{ width: '100%', marginTop: '.35rem' }}
              >
                {(patientHouse?.rooms || []).length ? (
                  patientHouse.rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))
                ) : (
                  <option value="">— Añade primero una habitación —</option>
                )}
              </select>
            </label>

            <label style={{ display: 'block', marginTop: '1rem' }}>
              Electrodoméstico
              <input
                value={houseForm.appliance}
                onChange={(e) =>
                  setHouseForm((f) => ({ ...f, appliance: e.target.value }))
                }
                style={{ width: '100%', marginTop: '.35rem' }}
              />
            </label>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <Btn variant="primary" onClick={saveHouseModal}>
                Guardar
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2>Eliminar paciente</h2>
        <p style={{ marginTop: '.5rem' }}>
          ¿Seguro que quieres borrar a <strong>{confirmData.name}</strong>?
          <br />
          <span style={{ opacity: 0.8 }}>
            Esta acción no se puede deshacer.
          </span>
        </p>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <Btn variant="primary" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Btn>
          <DangerBtn variant="primary" onClick={confirmDeletePatient}>
            🗑 Borrar
          </DangerBtn>
        </div>
      </Modal>
    </AppContainer>
  );
}
