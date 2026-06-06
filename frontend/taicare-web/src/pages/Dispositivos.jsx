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

const GuideBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid ${({ theme, $warn }) =>
    $warn ? 'rgba(234,179,8,.35)' : 'rgba(99,102,241,.25)'};
  background: ${({ theme, $warn }) =>
    $warn ? 'rgba(234,179,8,.08)' : 'rgba(99,102,241,.08)'};
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.text};
`;
const GuideIcon = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
`;
const GuideLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  font-size: inherit;
  text-decoration: underline;
  &:hover { opacity: 0.8; }
`;

export default function Dispositivos() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  const { data: households = [], isLoading: loadingHouseholds } = useHouseholds();
  const { data: devices = [], isLoading: loadingDevices } = useDevices();

  // Prerequisitos para crear dispositivos
  const hasHouseholds = households.length > 0;
  const hasRooms = households.some((h) => h.rooms && h.rooms.length > 0);
  const canCreate = hasHouseholds && hasRooms;

  const createDeviceMutation = useCreateDevice();
  const updateDeviceMutation = useUpdateDevice();
  const deleteDeviceMutation = useDeleteDevice();

  const [rooms, setRooms] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ household_id: '', room: '', appliance: '' });
  const [formErrors, setFormErrors] = useState({});

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
    setForm({ household_id: '', room: '', appliance: '' });
    setFormErrors({});
    setShowModal(true);
  };
  const openEdit = (d) => {
    setEditId(d._id);
    setForm({
      household_id: d.household_id,
      room: d.room,
      appliance: d.appliance,
    });
    setFormErrors({});
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
    // Validación frontend
    const errors = {};
    if (!form.household_id) errors.household_id = 'Selecciona un hogar.';
    if (!form.room)         errors.room         = 'Selecciona una habitación.';
    if (!form.appliance.trim()) errors.appliance = 'Indica el electrodoméstico.';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    // plugmodel siempre es P110, el usuario no lo introduce
    const payload = { ...form, plugmodel: 'P110' };
    try {
      if (editId) {
        await updateDeviceMutation.mutateAsync({ id: editId, ...payload });
      } else {
        await createDeviceMutation.mutateAsync(payload);
      }
      setShowModal(false);
      setForm({ household_id: '', room: '', appliance: '' });
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
    { value: 'app_alpha',  label: 'Electrodoméstico (A–Z)' },
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
    } else if (sort === 'app_alpha') {
      list.sort((a, b) =>
        String(a.appliance || '').localeCompare(String(b.appliance || ''))
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

          {/* ---- Banner de guía ---- */}
          {!loadingHouseholds && !hasHouseholds && (
            <GuideBanner $warn>
              <GuideIcon>🏠</GuideIcon>
              <div>
                <strong>Antes de crear un dispositivo</strong> necesitas tener al menos un hogar
                con una habitación configurada.{' '}
                <GuideLink onClick={() => navigate('/households')}>
                  Ir a Hogares →
                </GuideLink>
              </div>
            </GuideBanner>
          )}
          {!loadingHouseholds && hasHouseholds && !hasRooms && (
            <GuideBanner $warn>
              <GuideIcon>🚪</GuideIcon>
              <div>
                Tienes hogares creados pero ninguno tiene habitaciones.
                Añade al menos una habitación en{' '}
                <GuideLink onClick={() => navigate('/households')}>
                  Hogares
                </GuideLink>
                {' '}para poder registrar dispositivos.
              </div>
            </GuideBanner>
          )}

          {/* ---- Barra de búsqueda y filtros ---- */}
          <div style={{ marginBottom: '1rem' }}>
            <SearchToolbar
              query={q}
              onQueryChange={setQ}
              placeholder="Buscar por electrodoméstico, habitación u hogar"
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
            style={{ marginBottom: '1rem', opacity: canCreate ? 1 : 0.45, cursor: canCreate ? 'pointer' : 'not-allowed' }}
            onClick={() => canCreate && openNew()}
            title={!canCreate ? 'Crea primero un hogar con habitaciones' : ''}
          >
            + Nuevo
          </Btn>

          <ul>
            {loadingDevices && <p>Cargando dispositivos...</p>}
            {!loadingDevices &&
              filteredDevices.map((d) => (
                <DeviceItem key={d._id}>
                  <span>
                    <strong>{d.appliance || '—'}</strong>
                    {' · '}
                    {d.room || 'Sin sala'}
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
          <label>Hogar</label>
          <select
            name="household_id"
            value={form.household_id}
            onChange={onChange}
            style={formErrors.household_id ? { borderColor: '#ef4444' } : {}}
          >
            <option value="">— Selecciona —</option>
            {households.map((h) => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
          {formErrors.household_id && (
            <small style={{ color: '#ef4444' }}>{formErrors.household_id}</small>
          )}
        </FormGroup>

        <FormGroup>
          <label>Habitación</label>
          <select
            name="room"
            value={form.room}
            onChange={onChange}
            disabled={!form.household_id}
            style={formErrors.room ? { borderColor: '#ef4444' } : {}}
          >
            <option value="">— Selecciona —</option>
            {rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {formErrors.room && (
            <small style={{ color: '#ef4444' }}>{formErrors.room}</small>
          )}
        </FormGroup>

        <FormGroup>
          <label>Electrodoméstico</label>
          <input
            name="appliance"
            value={form.appliance}
            onChange={onChange}
            placeholder="Ej: Televisión, Lavadora, Aire acondicionado"
            style={formErrors.appliance ? { borderColor: '#ef4444' } : {}}
          />
          {formErrors.appliance && (
            <small style={{ color: '#ef4444' }}>{formErrors.appliance}</small>
          )}
        </FormGroup>

        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={handleSave}>Guardar</Btn>
        </FormGroup>
      </Modal>
    </AppContainer>
  );
}
