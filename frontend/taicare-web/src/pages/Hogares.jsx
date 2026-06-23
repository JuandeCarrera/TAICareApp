import React, { useContext, useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { Pencil, Trash2 } from 'lucide-react';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import Modal, { FormGroup } from '../components/Modal.jsx';
import SearchToolbar from '../components/SearchToolbar.jsx';
import {
  useHouseholds,
  useCreateHousehold,
  useUpdateHousehold,
  useDeleteHousehold,
  useAddRoom,
} from '../hooks/useHouseholds';
import { useUsers } from '../hooks/useUsers';
import { useIsMobile } from '../hooks/useIsMobile';
import InfoTooltip from '../components/InfoTooltip.jsx';
import { useAlert } from '../contexts/AlertContext.jsx';

/* ---------- Estilos base ---------- */
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

/* ---------- Tarjetas de hogar ---------- */
const HouseItem = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
`;
const HouseHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
`;
const Title = styled.strong`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  min-width: 200px;
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  @media (min-width: 640px) {
    margin-top: 0;
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
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
  &:hover {
    background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`;
const ToggleButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  padding: 0.25rem 0.5rem;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
  }
`;
const RoomsList = styled.ul`
  margin-top: 0.75rem;
  padding-left: 1.25rem;
  list-style: disc;
`;
const RoomItem = styled.li`
  display: flex;
  flex-direction: column;
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.35rem;
  border-radius: 6px;
  gap: 0.5rem;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
  }
`;
const Small = styled.small`
  opacity: 0.8;
`;
const DangerBtn = styled(Btn)`
  border-color: #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;
const ActionsTop = styled.div`
  margin-bottom: 1rem;
`;

export default function Hogares() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  const { showAlert, showConfirm } = useAlert();

  // Queries
  const { data: households = [], isLoading: loadingHouseholds } =
    useHouseholds();
  const { data: patients = [] } = useUsers({ role: 'paciente' });

  // Mutations
  const createMutation = useCreateHousehold();
  const updateMutation = useUpdateHousehold();
  const deleteMutation = useDeleteHousehold();
  const addRoomMutation = useAddRoom();

  const [openIds, setOpenIds] = useState({});

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('house'); // 'house' | 'editHouse' | 'room' | 'editRoom'
  const [editRoomOld, setEditRoomOld] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    targetHouseId: '',
    roomName: '',
    owner: '',
  });

  // filtros
  const [query, setQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState(''); // id del paciente (owner)
  const [filterRoom, setFilterRoom] = useState(''); // nombre habitación exacto
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc | name_desc | rooms_desc | rooms_asc

  /* ---------- barra de búsqueda & filtros ---------- */
  const ownerOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...patients.map((p) => ({ value: p._id, label: p.name })),
    ];
  }, [patients]);

  const roomOptions = useMemo(() => {
    const set = new Set();
    households.forEach((h) =>
      (Array.isArray(h.rooms) ? h.rooms : []).forEach((r) => r && set.add(r))
    );
    return [
      { value: '', label: 'Todas' },
      ...Array.from(set)
        .sort()
        .map((r) => ({ value: r, label: r })),
    ];
  }, [households]);

  const handleFiltersChange = (payload) => {
    // payload: { query, selects: { owner, room }, sortBy }
    setQuery(payload.query ?? '');
    setFilterOwner(payload.selects?.owner ?? '');
    setFilterRoom(payload.selects?.room ?? '');
    setSortBy(payload.sortBy ?? 'name_asc');
  };

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();

    let list = [...households];

    // texto: busca en name, address y rooms
    if (q) {
      list = list.filter((h) => {
        const name = (h.name || '').toLowerCase();
        const addr = (h.address || '').toLowerCase();
        const rooms = (Array.isArray(h.rooms) ? h.rooms : [])
          .join(' • ')
          .toLowerCase();
        return name.includes(q) || addr.includes(q) || rooms.includes(q);
      });
    }

    if (filterOwner)
      list = list.filter((h) => String(h.owner) === String(filterOwner));
    if (filterRoom)
      list = list.filter(
        (h) => Array.isArray(h.rooms) && h.rooms.includes(filterRoom)
      );

    // sort
    list.sort((a, b) => {
      if (sortBy === 'name_desc')
        return (a.name || '').localeCompare(b.name || '') * -1;
      if (sortBy === 'rooms_desc')
        return (b.rooms?.length || 0) - (a.rooms?.length || 0);
      if (sortBy === 'rooms_asc')
        return (a.rooms?.length || 0) - (b.rooms?.length || 0);
      // default name_asc
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [households, query, filterOwner, filterRoom, sortBy]);

  /* ---------- helpers UI ---------- */
  function toggleOpen(id) {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /* ---------- CRUD ---------- */
  function openNewHouse() {
    setMode('house');
    setForm({
      name: '',
      address: '',
      targetHouseId: '',
      roomName: '',
      owner: patients[0]?._id || '', // auto-selección opcional
    });
    setShowModal(true);
  }

  function openEditHouse(h) {
    setMode('editHouse');
    setForm({
      name: h.name || '',
      address: h.address || '',
      targetHouseId: h._id,
      roomName: '',
      owner: '', // no se edita el owner aquí
    });
    setShowModal(true);
  }

  function openNewRoom(h) {
    setMode('room');
    setForm((f) => ({ ...f, targetHouseId: h._id, roomName: '' }));
    setShowModal(true);
  }

  function openEditRoom(h, room) {
    setMode('editRoom');
    setEditRoomOld(room);
    setForm({
      name: '',
      address: '',
      targetHouseId: h._id,
      roomName: room,
      owner: '',
    });
    setShowModal(true);
  }

  async function deleteHouse(id) {
    const ok = await showConfirm('¿Borrar esta casa?');
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      showAlert('Casa eliminada correctamente.', 'success');
    } catch {
      showAlert('Error al borrar la casa.');
    }
  }

  async function deleteRoom(hId, room) {
    const ok = await showConfirm('¿Borrar habitación?');
    if (!ok) return;
    const h = households.find((x) => x._id === hId);
    const currentRooms = Array.isArray(h?.rooms) ? h.rooms : [];
    const newRooms = currentRooms.filter((r) => r !== room);

    try {
      await updateMutation.mutateAsync({ id: hId, rooms: newRooms });
      showAlert('Habitación eliminada correctamente.', 'success');
    } catch {
      showAlert('Error al borrar la habitación.');
    }
  }

  async function handleSave() {
    try {
      if (mode === 'house') {
        await createMutation.mutateAsync({
          name: form.name,
          address: form.address,
          owner: form.owner || undefined,
        });
        showAlert('Casa creada correctamente.', 'success');
      } else if (mode === 'editHouse') {
        await updateMutation.mutateAsync({
          id: form.targetHouseId,
          name: form.name,
          address: form.address,
        });
        showAlert('Casa actualizada correctamente.', 'success');
      } else if (mode === 'room') {
        await addRoomMutation.mutateAsync({
          id: form.targetHouseId,
          room: form.roomName,
        });
        showAlert('Habitación añadida correctamente.', 'success');
      } else if (mode === 'editRoom') {
        const h = households.find((x) => x._id === form.targetHouseId);
        const currentRooms = Array.isArray(h?.rooms) ? h.rooms : [];
        const updated = currentRooms.map((r) =>
          r === editRoomOld ? form.roomName : r
        );
        await updateMutation.mutateAsync({
          id: form.targetHouseId,
          rooms: updated,
        });
        showAlert('Habitación actualizada correctamente.', 'success');
      }

      setShowModal(false);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Error al guardar';
      showAlert(msg);
    }
  }

  /* ---------- render ---------- */
  return (
    <AppContainer>
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
          <h1>
            Hogares
            <InfoTooltip text="Hogares asignados. Cada hogar representa la vivienda física de una persona en seguimiento y contiene sus habitaciones y sensores configurados." />
          </h1>

          <div style={{ marginBottom: '1rem' }}>
            <SearchToolbar
              value={{
                query,
                selects: { owner: filterOwner, room: filterRoom },
                sortBy,
              }}
              onChange={handleFiltersChange}
              onClear={() =>
                handleFiltersChange({
                  query: '',
                  selects: { owner: '', room: '' },
                  sortBy: 'name_asc',
                })
              }
              selects={[
                {
                  key: 'owner',
                  label: 'Persona en seguimiento',
                  placeholder: 'Todos',
                  options: ownerOptions,
                },
                {
                  key: 'room',
                  label: 'Habitación',
                  placeholder: 'Todas',
                  options: roomOptions,
                },
              ]}
              sorts={[
                { value: 'name_asc', label: 'Nombre (A→Z)' },
                { value: 'name_desc', label: 'Nombre (Z→A)' },
                { value: 'rooms_desc', label: 'Más habitaciones' },
                { value: 'rooms_asc', label: 'Menos habitaciones' },
              ]}
              placeholder="Buscar por nombre, dirección o habitación…"
              style={{ marginBottom: '0.75rem' }}
            />
          </div>

          <ActionsTop>
            <Btn variant="primary" onClick={openNewHouse}>
              + Nuevo
            </Btn>
          </ActionsTop>

          {loadingHouseholds ? (
            <p>Cargando hogares...</p>
          ) : (
            <>
              {filtered.map((h) => (
                <HouseItem key={h._id}>
                  <HouseHeader>
                    <Title>{h.name}</Title>
                    <Actions>
                      <Btn variant="primary" onClick={() => openNewRoom(h)}>
                        + Habitación
                      </Btn>
                      <Btn variant="primary" onClick={() => openEditHouse(h)}>
                        <Pencil size={14} /> Editar
                      </Btn>
                      <DangerBtn
                        variant="primary"
                        onClick={() => deleteHouse(h._id)}
                      >
                        <Trash2 size={14} /> Borrar
                      </DangerBtn>
                      <ToggleButton
                        aria-label="Mostrar habitaciones"
                        onClick={() => toggleOpen(h._id)}
                      >
                        {openIds[h._id] ? '▲' : '▼'}
                      </ToggleButton>
                    </Actions>
                  </HouseHeader>

                  <div style={{ marginTop: '.25rem' }}>
                    <Small>
                      {h.address ? (
                        h.address
                      ) : (
                        <span style={{ opacity: 0.7 }}>Sin dirección</span>
                      )}
                    </Small>
                  </div>

                  {openIds[h._id] && (
                    <RoomsList>
                      {(Array.isArray(h.rooms) ? h.rooms : []).map((room) => (
                        <RoomItem key={room}>
                          {room}
                          <Actions>
                            <Btn
                              variant="primary"
                              onClick={() => openEditRoom(h, room)}
                            >
                              <Pencil size={13} />
                            </Btn>
                            <DangerBtn
                              variant="primary"
                              onClick={() => deleteRoom(h._id, room)}
                            >
                              <Trash2 size={13} />
                            </DangerBtn>
                          </Actions>
                        </RoomItem>
                      ))}
                      {(!h.rooms || h.rooms.length === 0) && (
                        <li style={{ opacity: 0.7 }}>Sin habitaciones.</li>
                      )}
                    </RoomsList>
                  )}
                </HouseItem>
              ))}

              {!filtered.length && (
                <div style={{ opacity: 0.7, marginTop: '.5rem' }}>
                  No se han encontrado hogares con los filtros actuales.
                </div>
              )}
            </>
          )}
        </Main>
      </Body>
      <Footer />

      {/* ---------- MODAL ---------- */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ marginBottom: '0.75rem' }}>
          {mode === 'house'
            ? 'Crear casa'
            : mode === 'editHouse'
              ? 'Editar casa'
              : mode === 'room'
                ? 'Añadir habitación'
                : 'Editar habitación'}
        </h2>

        {(mode === 'house' || mode === 'editHouse') && (
          <>
            {mode === 'house' && (
              <FormGroup>
                <label>Persona en seguimiento (propietaria)</label>
                <select
                  value={form.owner || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner: e.target.value }))
                  }
                >
                  <option value="">— Selecciona una persona en seguimiento —</option>
                  {(patients || []).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <small
                  style={{
                    display: 'block',
                    opacity: 0.75,
                    marginTop: '.35rem',
                  }}
                >
                  Esta persona en seguimiento quedará como propietaria del hogar.
                </small>
              </FormGroup>
            )}

            <FormGroup>
              <label>Nombre</label>
              <input
                value={form.name || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="p.ej., Casa Lucía"
              />
            </FormGroup>

            <FormGroup>
              <label>Dirección</label>
              <input
                value={form.address || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Calle, nº, piso… (opcional)"
              />
            </FormGroup>
          </>
        )}

        {(mode === 'room' || mode === 'editRoom') && (
          <FormGroup>
            <label>Nombre de la habitación</label>
            <input
              value={form.roomName || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, roomName: e.target.value }))
              }
              placeholder="p.ej., Salón, Cocina, Dormitorio…"
            />
          </FormGroup>
        )}

        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <DangerBtn onClick={() => setShowModal(false)}>Cancelar</DangerBtn>
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={
              mode === 'house'
                ? !((form.name || '').trim() && (form.owner || ''))
                : mode === 'editHouse'
                  ? !(form.name || '').trim()
                  : mode === 'room' || mode === 'editRoom'
                    ? !(form.roomName || '').trim()
                    : true
            }
          >
            Guardar
          </Btn>
        </div>
      </Modal>
    </AppContainer>
  );
}
