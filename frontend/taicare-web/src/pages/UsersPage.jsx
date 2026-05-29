import React, { useContext, useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import Modal, { FormGroup } from '../components/Modal.jsx';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '../hooks/useUsers';
import {
  useHouseholds,
  useCreateHousehold,
  useUpdateHousehold,
  useAddRoom,
} from '../hooks/useHouseholds';
import { useDevices } from '../hooks/useDevices';
import { useRoutines } from '../hooks/useRoutines';
import { useAlerts } from '../hooks/useAlerts';
import { useIsMobile } from '../hooks/useIsMobile';
import api from '../api/axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ---------- Estilos ---------- */
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
  display: flex;
  overflow: hidden;
`;
const PanelList = styled.div`
  width: 380px;
  background: ${({ theme }) => theme.colors.cardBg};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
`;
const PanelDetail = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.bg};
`;
const ListHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.buttonBg};
  color: ${({ theme }) => theme.colors.text};
  &::placeholder { color: ${({ theme }) => theme.colors.textSecondary}; }
`;
const PatientList = styled.ul`
  list-style: none;
  overflow-y: auto;
  flex: 1;
`;
const PatientItem = styled.li`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  background: ${({ selected, theme }) =>
    selected ? theme.colors.hoverBg : 'transparent'};
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
  }
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  margin-right: 0.75rem;
`;
const Info = styled.div`
  flex: 1;
  min-width: 0;
`;
const Name = styled.div`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Sub = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Badge = styled.span`
  background: #e04848;
  color: #fff;
  border-radius: 999px;
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: bold;
  margin-left: 0.5rem;
`;
/* Detalle */
const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;
const SectionTitle = styled.h3`
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.primary};
`;
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
`;
const Btn = styled.button`
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? '#fff' : theme.colors.text};
  border: 1px solid
    ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.border};
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover {
    background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`;
const DangerBtn = styled(Btn)`
  border-color: #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;

const ToggleWrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
`;
const SwitchControl = styled.div`
  position: relative;
  width: 40px;
  height: 22px;
  background: ${({ active, theme }) => (active ? theme.colors.primary : '#ccc')};
  border-radius: 999px;
  transition: background 0.3s;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ active }) => (active ? '20px' : '2px')};
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: left 0.3s;
  }
`;

export default function UsersPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => { setMenuOpen(!isMobile); }, [isMobile]);

  const caregiverId = user?.role === 'cuidador' ? user._id : null;

  // React Query Hooks
  const { data: users = [] } = useUsers(
    caregiverId
      ? { caregiver_id: caregiverId, role: 'paciente' }
      : { role: 'paciente' }
  );
  const { data: households = [] } = useHouseholds();
  const { data: allDevices = [] } = useDevices();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const createHouseholdMutation = useCreateHousehold();
  const updateHouseholdMutation = useUpdateHousehold();
  const addRoomMutation = useAddRoom();

  const [selectedId, setSelectedId] = useState(null);
  const [q, setQ] = useState('');

  // Estados derivados
  const patients = useMemo(() => {
    let list = Array.isArray(users) ? users : [];
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.email?.toLowerCase().includes(lower)
      );
    }
    return list;
  }, [users, q]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p._id === selectedId) || null,
    [patients, selectedId]
  );

  const { data: patientRoutines = [] } = useRoutines({ userId: selectedId || null });
  const { data: patientAlerts = [] } = useAlerts({ userId: selectedId || null });

  // Unread counts logic (simplified, without hooks for N+1 perf)
  const [unread, setUnread] = useState({});

  useEffect(() => {
    // Legacy support for unread counts in list - keeping it simple with ONE effect
    if (!patients.length) return;

    // Use api.get instead of fetch
    const loadUnreads = async () => {
      const counts = {};
      for (const p of patients) {
        try {
          const { data } = await api.get(`/alerts?user_id=${p._id}&unread=1`);
          const arr = Array.isArray(data) ? data : [];
          const valid = arr.filter(
            (a) =>
              String(a.user_id) === String(p._id) ||
              (a.user_id && a.user_id._id === p._id)
          );
          counts[p._id] = valid.length;
        } catch {
          counts[p._id] = 0;
        }
      }
      setUnread((prev) => ({ ...prev, ...counts }));
    };

    loadUnreads();
  }, [patients]); // Runs when patients list changes

  const selectedHouses = useMemo(() => {
    if (!selectedPatient) return [];
    return households.filter(
      (h) =>
        h.owner === selectedPatient._id ||
        (h.owner && h.owner._id === selectedPatient._id) ||
        (Array.isArray(h.members) &&
          h.members.some((m) => (m._id || m) === selectedPatient._id)) ||
        (Array.isArray(h.users) &&
          h.users.some((u) => (u._id || u) === selectedPatient._id)) ||
        (selectedPatient.household_id &&
          (selectedPatient.household_id === h._id ||
            selectedPatient.household_id._id === h._id))
    );
  }, [selectedPatient, households]);

  const selectedDevices = useMemo(() => {
    if (!selectedHouses.length) return [];
    const houseIds = selectedHouses.map((h) => h._id);
    return allDevices.filter(
      (d) =>
        houseIds.includes(d.household_id) ||
        (d.household_id && houseIds.includes(d.household_id._id))
    );
  }, [selectedHouses, allDevices]);

  /* --- Modals State --- */
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHouseModal, setHouseModalOpen] = useState(false); // Para ver/editar casa
  const [houseMode, setHouseMode] = useState('view'); // view | editHouse | room | device
  const [hhOpen, setHhOpen] = useState(false); // Para crear hogar rápido desde modal paciente

  const [editId, setEditId] = useState(null); // ID paciente siendo editado o creado
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'paciente',
    household_id: '',
    history: '',
    caregiver_id: '',
  });
  const [hhQuery, setHhQuery] = useState('');

  const [houseForm, setHouseForm] = useState({
    targetHouseId: '',
    name: '',
    address: '',
    roomName: '',
    plugmodel: '',
    room: '',
    appliance: '',
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({ id: null, name: '' });

  /* --- Handlers --- */
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
      household_id:
        (p.household_id && (p.household_id._id || p.household_id)) || '',
      history: p.history || '',
      caregiver_id:
        (p.caregiver_id && (p.caregiver_id._id || p.caregiver_id)) ||
        caregiverId ||
        '',
    });
    const hName =
      households.find(
        (h) =>
          h._id === (p.household_id && (p.household_id._id || p.household_id))
      )?.name || '';
    setHhQuery(hName);
    setShowEditModal(true);
  };

  const openEditHistory = (p) => {
    setEditId(p._id);
    setForm((prev) => ({ ...prev, history: p.history || '' }));
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
      if (editId) {
        await updateUserMutation.mutateAsync({ id: editId, ...payload });
      } else {
        await createUserMutation.mutateAsync(payload);
      }
      setShowEditModal(false);
      setEditId(null);
    } catch (e) {
      alert(e.message || 'Error al guardar');
    }
  };

  const saveHistoryOnly = async () => {
    try {
      if (!editId) return;
      await updateUserMutation.mutateAsync({
        id: editId,
        history: form.history,
      });
      setShowHistoryModal(false);
    } catch (e) {
      alert(e.message || 'Error al guardar');
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!confirmData.id) return;
      await deleteUserMutation.mutateAsync(confirmData.id);
      if (selectedId === confirmData.id) setSelectedId(null);
      setConfirmOpen(false);
    } catch (e) {
      alert(e.message || 'Error al borrar');
    }
  };

  async function addNewHousehold(name) {
    if (!name?.trim()) return;
    try {
      const created = await createHouseholdMutation.mutateAsync({
        name: name.trim(),
        rooms: [],
        owner: caregiverId,
      });
      setForm((f) => ({ ...f, household_id: created._id }));
      setHhQuery(created.name);
      setHhOpen(false);
    } catch (e) {
      alert(e.message || 'Error al crear hogar');
    }
  }

  /* --- House Modal Logic --- */
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

  async function saveHouseModal() {
    try {
      const hid = houseForm.targetHouseId;
      if (houseMode === 'editHouse') {
        await updateHouseholdMutation.mutateAsync({
          id: hid,
          name: houseForm.name,
          address: houseForm.address,
        });
      } else if (houseMode === 'room') {
        await addRoomMutation.mutateAsync({
          id: hid,
          room: houseForm.roomName,
        });
      }
      // Device creation is handled separately via useDevices? Or implicit?
      // The old code handled it weirdly. We will skip device creation inside HouseModal for now
      // or assume it used a separate call.
      // If we want to support device creation here, we need useCreateDevice.

      setHouseMode('view');
    } catch (e) {
      alert(e.message || 'Error');
    }
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
          {/* COLUMNA IZQ: LISTA */}
          {(!isMobile || !selectedId) && (
            <PanelList style={{ width: isMobile ? '100%' : '380px' }}>
              <ListHeader>
                <h3>Pacientes</h3>
                <Btn variant="primary" onClick={openNew}>
                  + Nuevo
                </Btn>
              </ListHeader>
              <div style={{ padding: '0.5rem 1rem' }}>
                <SearchInput
                  placeholder="Buscar paciente..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <PatientList>
                {patients.map((p) => {
                  const isSel = p._id === selectedId;
                  const ur = unread[p._id] || 0;
                  return (
                    <PatientItem
                      key={p._id}
                      selected={isSel}
                      onClick={() => setSelectedId(p._id)}
                    >
                      <Avatar>
                        {p.name ? p.name.substring(0, 1).toUpperCase() : 'U'}
                      </Avatar>
                      <Info>
                        <Name>{p.name}</Name>
                        <Sub>{p.email}</Sub>
                      </Info>
                      {ur > 0 && <Badge>{ur}</Badge>}
                    </PatientItem>
                  );
                })}
                {!patients.length && (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      opacity: 0.6,
                    }}
                  >
                    No hay pacientes.
                  </div>
                )}
              </PatientList>
            </PanelList>
          )}

          {/* COLUMNA DER: DETALLE */}
          {(!isMobile || selectedId) && (
            <PanelDetail>
              {isMobile && selectedId && (
                <div style={{ marginBottom: '1rem' }}>
                  <Btn onClick={() => setSelectedId(null)}>
                    ← Volver a la lista
                  </Btn>
                </div>
              )}
              {!selectedPatient ? (
                <div
                  style={{
                    opacity: 0.5,
                    marginTop: '4rem',
                    textAlign: 'center',
                  }}
                >
                  <h2>Selecciona un paciente</h2>
                </div>
              ) : (
                <>
                  <DetailHeader>
                    <div style={{ width: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <h1 style={{ marginBottom: '0.25rem' }}>
                            {selectedPatient.name}
                          </h1>
                          <div style={{ opacity: 0.8 }}>
                            {selectedPatient.email}
                          </div>
                        </div>
                        {!isMobile && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Btn
                              variant="primary"
                              onClick={() => openEditHistory(selectedPatient)}
                            >
                              Historia
                            </Btn>
                            <Btn
                              variant="primary"
                              onClick={() => openEditPatient(selectedPatient)}
                            >
                              Editar
                            </Btn>
                            <DangerBtn
                              onClick={() => {
                                setConfirmData({
                                  id: selectedPatient._id,
                                  name: selectedPatient.name,
                                });
                                setConfirmOpen(true);
                              }}
                            >
                              Borrar
                            </DangerBtn>
                          </div>
                        )}
                      </div>

                      {/* Toggle Modo Vacaciones */}
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Modo Vacaciones</strong>
                          <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Suspende todas las alertas de rutinas temporalmente.</div>
                        </div>
                        <ToggleWrapper onClick={async (e) => {
                          e.preventDefault();
                          try {
                            await updateUserMutation.mutateAsync({
                              id: selectedPatient._id,
                              vacation_mode: !selectedPatient.vacation_mode
                            });
                          } catch (err) {
                            alert('Error al actualizar modo vacaciones: ' + err.message);
                          }
                        }}>
                          <SwitchControl active={!!selectedPatient.vacation_mode} />
                        </ToggleWrapper>
                      </div>

                      {isMobile && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <Btn
                            variant="primary"
                            onClick={() => openEditHistory(selectedPatient)}
                          >
                            Historia
                          </Btn>
                          <Btn
                            variant="primary"
                            onClick={() => openEditPatient(selectedPatient)}
                          >
                            Editar
                          </Btn>
                          <DangerBtn
                            onClick={() => {
                              setConfirmData({
                                id: selectedPatient._id,
                                name: selectedPatient.name,
                              });
                              setConfirmOpen(true);
                            }}
                          >
                            Borrar
                          </DangerBtn>
                        </div>
                      )}

                      {selectedHouses.length > 0 ? (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            gap: '.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {selectedHouses.map((h) => (
                            <span
                              key={h._id}
                              style={{
                                fontSize: '0.9rem',
                                color: 'var(--primary, #646cff)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: 'rgba(100,108,255,0.12)',
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                              onClick={() => openHouseModal(h)}
                            >
                              🏠 {h.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.85rem',
                            opacity: 0.6,
                          }}
                        >
                          Sin hogar asignado
                        </div>
                      )}
                    </div>
                  </DetailHeader>

                  <SectionTitle>Datos médicos / Historia</SectionTitle>
                  <Card style={{ minHeight: 80, whiteSpace: 'pre-wrap' }}>
                    {selectedPatient.history || (
                      <span style={{ opacity: 0.5 }}>
                        Sin historia clínica registrada.
                      </span>
                    )}
                  </Card>

                  <SectionTitle>
                    Estado General (Rutinas y Alertas)
                  </SectionTitle>
                  <CardGrid>
                    {/* Rutinas */}
                    <Card>
                      <h4>
                        Rutinas (
                        {
                          patientRoutines.filter(
                            (r) =>
                              (r.user_id?._id || r.user_id) ===
                              selectedPatient._id
                          ).length
                        }
                        )
                      </h4>
                      <ul
                        style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}
                      >
                        {patientRoutines
                          .filter(
                            (r) =>
                              (r.user_id?._id || r.user_id) ===
                              selectedPatient._id
                          )
                          .slice(0, 5)
                          .map((r) => (
                            <li key={r._id} style={{ marginBottom: 4 }}>
                              {r.name || 'Rutina sin nombre'}
                            </li>
                          ))}
                      </ul>
                      {!patientRoutines.filter(
                        (r) =>
                          (r.user_id?._id || r.user_id) === selectedPatient._id
                      ).length && (
                          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Sin rutinas
                          </div>
                        )}
                    </Card>
                    {/* Alertas */}
                    <Card>
                      <h4>
                        Alertas recientes (
                        {
                          patientAlerts.filter(
                            (a) =>
                              (a.user_id?._id || a.user_id) ===
                              selectedPatient._id
                          ).length
                        }
                        )
                      </h4>
                      <ul
                        style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}
                      >
                        {patientAlerts
                          .filter(
                            (a) =>
                              (a.user_id?._id || a.user_id) ===
                              selectedPatient._id
                          )
                          .slice(0, 5)
                          .map((a) => (
                            <li
                              key={a._id}
                              style={{
                                marginBottom: 4,
                                color:
                                  a.priority === 'high' ? 'red' : 'inherit',
                              }}
                            >
                              {a.message}
                            </li>
                          ))}
                      </ul>
                      {!patientAlerts.filter(
                        (a) =>
                          (a.user_id?._id || a.user_id) === selectedPatient._id
                      ).length && (
                          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Sin alertas
                          </div>
                        )}
                    </Card>
                  </CardGrid>

                  <SectionTitle>Dispositivos en su(s) hogar(es)</SectionTitle>
                  <CardGrid>
                    {selectedDevices.map((d) => (
                      <Card key={d._id}>
                        <strong>{d.plugmodel}</strong>
                        <div style={{ fontSize: '.9rem' }}>{d.appliance}</div>
                        <div style={{ fontSize: '.8rem', opacity: 0.7 }}>
                          {d.room}
                        </div>
                      </Card>
                    ))}
                    {!selectedDevices.length && (
                      <div style={{ opacity: 0.7 }}>
                        No hay dispositivos asignados a su hogar.
                      </div>
                    )}
                  </CardGrid>
                </>
              )}
            </PanelDetail>
          )}
        </Main>
      </Body>
      <Footer />

      {/* --- MODAL EDICION --- */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2>{editId ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
        <FormGroup>
          <label>Nombre</label>
          <input name="name" value={form.name} onChange={onChange} />
        </FormGroup>
        <FormGroup>
          <label>Email</label>
          <input name="email" value={form.email} onChange={onChange} />
        </FormGroup>
        {!editId && (
          <FormGroup>
            <label>Historia inicial (opcional)</label>
            <textarea
              name="history"
              value={form.history}
              onChange={onChange}
              rows={3}
            />
          </FormGroup>
        )}
        <FormGroup>
          <label>Hogar asignado</label>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input
              readOnly
              value={hhQuery}
              placeholder="Selecciona o crea un hogar..."
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => setHhOpen(!hhOpen)}
            />
            {form.household_id && (
              <DangerBtn
                onClick={() => {
                  setForm((f) => ({ ...f, household_id: '' }));
                  setHhQuery('');
                }}
              >
                X
              </DangerBtn>
            )}
          </div>
          {hhOpen && (
            <div
              style={{
                border: '1px solid #ccc',
                marginTop: 4,
                padding: 8,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  fontWeight: 'bold',
                  fontSize: '.9rem',
                }}
              >
                Seleccionar existente:
              </div>
              <div
                style={{ maxHeight: 150, overflow: 'auto', marginBottom: 8 }}
              >
                {households.map((h) => (
                  <div
                    key={h._id}
                    style={{ padding: 4, cursor: 'pointer' }}
                    onClick={() => {
                      setForm((f) => ({ ...f, household_id: h._id }));
                      setHhQuery(h.name);
                      setHhOpen(false);
                    }}
                  >
                    {h.name}
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
                <div style={{ fontSize: '.9rem', marginBottom: 4 }}>
                  O crear nuevo:
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input id="newHhName" placeholder="Nombre casa" />
                  <Btn
                    variant="primary"
                    onClick={() => {
                      const val = document.getElementById('newHhName').value;
                      addNewHousehold(val);
                    }}
                  >
                    Crear
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </FormGroup>

        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <Btn variant="primary" onClick={savePatient}>
            Guardar
          </Btn>
        </div>
      </Modal>

      {/* --- MODAL HISTORIA --- */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      >
        <h2>Historia Clínica</h2>
        <textarea
          style={{ width: '100%', height: '300px', padding: '0.5rem' }}
          value={form.history}
          onChange={(e) => setForm({ ...form, history: e.target.value })}
        />
        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <Btn variant="primary" onClick={saveHistoryOnly}>
            Guardar Cambios
          </Btn>
        </div>
      </Modal>

      {/* --- MODAL CONFIRM DELETE --- */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2>¿Borrar paciente?</h2>
        <p>
          Se eliminará a <strong>{confirmData.name}</strong>.
        </p>
        <div
          style={{
            textAlign: 'right',
            marginTop: '1rem',
            display: 'flex',
            gap: '.5rem',
            justifyContent: 'flex-end',
          }}
        >
          <Btn onClick={() => setConfirmOpen(false)}>Cancelar</Btn>
          <DangerBtn onClick={handleDeleteUser}>Confirmar</DangerBtn>
        </div>
      </Modal>

      {/* --- MODAL HOUSE VIEW/EDIT --- */}
      <Modal isOpen={showHouseModal} onClose={() => setHouseModalOpen(false)}>
        {houseMode === 'view' && (
          <>
            <h2>Detalle Hogar</h2>
            <p>
              <strong>Nombre:</strong> {houseForm.name}
            </p>
            <p>
              <strong>Dirección:</strong> {houseForm.address}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.5rem' }}>
              <Btn onClick={() => setHouseMode('editHouse')}>Editar Datos</Btn>
              <Btn onClick={() => setHouseMode('room')}>+ Añadir Sala</Btn>
            </div>
          </>
        )}
        {houseMode === 'editHouse' && (
          <>
            <h2>Editar Hogar</h2>
            <FormGroup>
              <label>Nombre</label>
              <input
                value={houseForm.name}
                onChange={(e) =>
                  setHouseForm({ ...houseForm, name: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <label>Dirección</label>
              <input
                value={houseForm.address}
                onChange={(e) =>
                  setHouseForm({ ...houseForm, address: e.target.value })
                }
              />
            </FormGroup>
            <div style={{ textAlign: 'right' }}>
              <Btn variant="primary" onClick={saveHouseModal}>
                Guardar
              </Btn>
            </div>
          </>
        )}
        {houseMode === 'room' && (
          <>
            <h2>Añadir Sala</h2>
            <FormGroup>
              <label>Nombre Sala</label>
              <input
                value={houseForm.roomName}
                onChange={(e) =>
                  setHouseForm({ ...houseForm, roomName: e.target.value })
                }
              />
            </FormGroup>
            <div style={{ textAlign: 'right' }}>
              <Btn variant="primary" onClick={saveHouseModal}>
                Añadir
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </AppContainer>
  );
}
