import React, {
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import Modal, { FormGroup } from '../components/Modal.jsx';
import SearchToolbar from '../components/SearchToolbar.jsx';
import {
  useDevices,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
} from '../hooks/useDevices';
import { useHouseholds } from '../hooks/useHouseholds';
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
const DeviceItem = styled.li`
  display: flex;
  flex-direction: column;
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  margin-bottom: 0.5rem;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
  gap: 0.5rem;
`;
const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
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
const DangerBtn = styled(Btn)`
  border-color: #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;

export default function Dispositivos() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  const { data: households = [] } = useHouseholds();
  const { data: devices = [], isLoading: loadingDevices } = useDevices();

  const createDeviceMutation = useCreateDevice();
  const updateDeviceMutation = useUpdateDevice();
  const deleteDeviceMutation = useDeleteDevice();

  const [rooms, setRooms] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    plugmodel: '',
    household_id: '',
    room: '',
    appliance: '',
  });

  /* -------- SearchToolbar state -------- */
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState({ householdId: '', room: '' });
  const [sort, setSort] = useState('recent_desc');

  useEffect(() => {
    const hh = households.find((h) => h._id === form.household_id);
    setRooms(hh?.rooms || []);
    if (!hh?.rooms?.includes(form.room)) {
      setForm((f) => ({ ...f, room: '' }));
    }
  }, [form.household_id, households, form.room]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openNew = () => {
    setEditId(null);
    setForm({ plugmodel: '', household_id: '', room: '', appliance: '' });
    setShowModal(true);
  };
  const openEdit = (d) => {
    setEditId(d._id);
    setForm({
      plugmodel: d.plugmodel,
      household_id: d.household_id,
      room: d.room,
      appliance: d.appliance,
    });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!confirm('¿Borrar este dispositivo?')) return;
    try {
      await deleteDeviceMutation.mutateAsync(id);
    } catch (e) {
      alert(e.message || 'Error al borrar dispositivo');
    }
  };

  const handleSave = async () => {
    const payload = { ...form };
    try {
      if (editId) {
        await updateDeviceMutation.mutateAsync({ id: editId, ...payload });
      } else {
        await createDeviceMutation.mutateAsync(payload);
      }
      setShowModal(false);
      setForm({ plugmodel: '', household_id: '', room: '', appliance: '' });
      setEditId(null);
    } catch (err) {
      alert(err.message || 'Error al guardar dispositivo');
    }
  };

  /* ---------- Helpers ---------- */
  const hhName = useCallback(
    (id) => households.find((h) => h._id === id)?.name || '',
    [households]
  );

  /* ---------- Options for SearchToolbar ---------- */
  const householdOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...households.map((h) => ({ value: h._id, label: h.name })),
    ],
    [households]
  );

  const roomOptions = useMemo(() => {
    const uniqueRooms = Array.from(
      new Set(devices.map((d) => d.room).filter(Boolean))
    ).sort();
    return [
      { value: '', label: 'Todas' },
      ...uniqueRooms.map((r) => ({ value: r, label: r })),
    ];
  }, [devices]);

  const sortOptions = [
    { value: 'recent_desc', label: 'Más recientes' },
    { value: 'recent_asc', label: 'Más antiguos' },
    { value: 'model_alpha', label: 'Modelo (A–Z)' },
    { value: 'room_alpha', label: 'Habitación (A–Z)' },
  ];

  /* ---------- Filtered + Sorted devices ---------- */
  const filteredDevices = useMemo(() => {
    let list = [...devices];
    const qnorm = q.trim().toLowerCase();

    if (flt.householdId)
      list = list.filter(
        (d) => String(d.household_id) === String(flt.householdId)
      );
    if (flt.room) list = list.filter((d) => (d.room || '') === flt.room);

    if (qnorm) {
      list = list.filter((d) => {
        const model = (d.plugmodel || '').toLowerCase();
        const app = (d.appliance || '').toLowerCase();
        const room = (d.room || '').toLowerCase();
        const home = hhName(d.household_id).toLowerCase();
        return [model, app, room, home].some((t) => t.includes(qnorm));
      });
    }

    // sort
    if (sort === 'recent_desc' || sort === 'recent_asc') {
      list.sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sort === 'recent_desc' ? tb - ta : ta - tb;
      });
    } else if (sort === 'model_alpha') {
      list.sort((a, b) =>
        String(a.plugmodel || '').localeCompare(String(b.plugmodel || ''))
      );
    } else if (sort === 'room_alpha') {
      list.sort((a, b) =>
        String(a.room || '').localeCompare(String(b.room || ''))
      );
    }

    return list;
  }, [devices, q, flt, sort, hhName]);

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Main>
          <h1>Dispositivos</h1>

          {/* ---- Barra de búsqueda y filtros ---- */}
          <div style={{ marginBottom: '1rem' }}>
            <SearchToolbar
              query={q}
              onQueryChange={setQ}
              placeholder="Buscar por modelo, electrodoméstico, habitación u hogar"
              filters={[
                {
                  type: 'select',
                  key: 'householdId',
                  label: 'Hogar',
                  options: householdOptions,
                },
                {
                  type: 'select',
                  key: 'room',
                  label: 'Habitación',
                  options: roomOptions,
                },
              ]}
              values={flt}
              onValuesChange={setFlt}
              sortOptions={sortOptions}
              sort={sort}
              onSortChange={setSort}
              onClear={() => {
                setQ('');
                setFlt({ householdId: '', room: '' });
                setSort('recent_desc');
              }}
            />
          </div>

          <Btn
            variant="primary"
            style={{ marginBottom: '1rem' }}
            onClick={openNew}
          >
            + Nuevo
          </Btn>

          <ul>
            {loadingDevices && <p>Cargando dispositivos...</p>}
            {!loadingDevices &&
              filteredDevices.map((d) => (
                <DeviceItem key={d._id}>
                  <span>
                    <strong>{d.plugmodel}</strong>
                    {' — '}
                    {d.room || 'Sin sala'}
                    {' / '}
                    {d.appliance || '—'}
                    {' · '}
                    <em>{hhName(d.household_id) || 'Sin hogar'}</em>
                  </span>
                  <Actions>
                    <Btn variant="primary" onClick={() => openEdit(d)}>
                      ✎
                    </Btn>
                    <DangerBtn onClick={() => handleDelete(d._id)}>
                      🗑
                    </DangerBtn>
                  </Actions>
                </DeviceItem>
              ))}
            {!loadingDevices && !filteredDevices.length && (
              <li style={{ opacity: 0.8 }}>
                No hay dispositivos que coincidan con el filtro.
              </li>
            )}
          </ul>
        </Main>
      </Body>
      <Footer />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>{editId ? 'Editar dispositivo' : 'Crear dispositivo'}</h2>
        <FormGroup>
          <label>Modelo</label>
          <input name="plugmodel" value={form.plugmodel} onChange={onChange} />
        </FormGroup>
        <FormGroup>
          <label>Hogar</label>
          <select
            name="household_id"
            value={form.household_id}
            onChange={onChange}
          >
            <option value="">— Selecciona —</option>
            {households.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup>
          <label>Habitación</label>
          <select
            name="room"
            value={form.room}
            onChange={onChange}
            disabled={!form.household_id}
          >
            <option value="">— Selecciona —</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup>
          <label>Electrodoméstico</label>
          <input name="appliance" value={form.appliance} onChange={onChange} />
        </FormGroup>
        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={handleSave}>
            Guardar
          </Btn>
        </FormGroup>
      </Modal>
    </AppContainer>
  );
}
