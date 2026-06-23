import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Sun } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';
import Modal, { FormGroup } from '../components/Modal.jsx';
import SearchToolbar from '../components/SearchToolbar.jsx';
import {
  useRoutines,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
} from '../hooks/useRoutines';
import { useUsers, useUpdateUser } from '../hooks/useUsers';
import { useHouseholds } from '../hooks/useHouseholds';
import { useDevices } from '../hooks/useDevices';
import { useIsMobile } from '../hooks/useIsMobile';
import InfoTooltip from '../components/InfoTooltip.jsx';
import { useAlert } from '../contexts/AlertContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ---------- Layout base ---------- */
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
  overflow: auto;
`;
const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  > div {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
`;
const Btn = styled.button`
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid
    ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? '#fff' : theme.colors.text};
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
  width: 36px;
  height: 20px;
  background: ${({ active, theme }) => (active ? theme.colors.primary : '#ccc')};
  border-radius: 999px;
  transition: background 0.3s;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ active }) => (active ? '18px' : '2px')};
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: left 0.3s;
  }
`;

/* ---------- Listado ---------- */
const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const RoutineCard = styled.li`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 14px 16px;
  & + & {
    margin-top: 12px;
  }
`;
const CardTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;
const CardTitle = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  
  ${({ $type }) =>
    $type === 'vacation'
      ? `
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        `
      : `
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `}
`;
const TimePill = styled.span`
  padding: 0.2rem 0.55rem;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: #fff;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 999px;
  font-size: 0.85rem;
  white-space: nowrap;
`;
const Meta = styled.div`
  margin-top: 0.4rem;
  opacity: 0.9;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
`;
const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
`;
const Tag = styled.span`
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.hoverBg};
  font-size: 0.8rem;
  opacity: 0.9;
`;
const Muted = styled.div`
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.8;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

/* ---------- Wizard Modal ---------- */
const Wizard = styled.div`
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
`;
const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-height: min(88vh, 900px);
`;
const ModalHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${({ theme }) => theme.colors.cardBg};
  padding-bottom: 0.25rem;
`;
const ModalContent = styled.div`
  flex: 1;
  overflow: auto;
  padding-right: 0.25rem;
  min-height: 0;
  min-width: 0;
`;
const StepFooter = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: ${({ theme }) => theme.colors.cardBg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 0.75rem;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;
const StepSub = styled.div`
  opacity: 0.9;
  font-size: 0.9rem;
`;
const StepBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-weight: 700;
`;
const Progress = styled.div`
  height: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.hoverBg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;
const ProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  width: 0%;
  transition: width 0.25s ease;
`;
const CompactHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
`;

/* ---------- Cards ---------- */
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 0.75rem;
`;
const ScrollCard = styled(Card)`
  max-height: 60vh;
  overflow: auto;
  min-width: 0;
`;
const Small = styled.small`
  opacity: 0.75;
`;

/* ---------- Row device (CREAR + EDITAR) ---------- */
const DeviceRow = styled.label`
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 0.5rem;
  align-items: start;

  padding: 0.35rem 0.45rem;
  border-radius: 6px;
  cursor: pointer;

  min-width: 0;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
  }

  input {
    margin: 0;
    margin-top: 2px;
  }

  .devText {
    min-width: 0;
    line-height: 1.2;
    word-break: break-word;
  }
`;

/* ---------- Chips (DÍAS) ---------- */
const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ $active }) => ($active ? '#fff' : 'inherit')};

  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background: ${({ theme, $active }) =>
    $active ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`;
const DayBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, active }) =>
    active ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ active }) => (active ? '#fff' : 'inherit')};

  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme, active }) =>
    active ? theme.colors.primaryDark : theme.colors.hoverBg};
  }

  appearance: none;
  -webkit-appearance: none;
  outline: none;
`;

/* ---------- Constantes ---------- */
const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ES_DAYS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};
const slots48 = Array.from(
  { length: 48 },
  (_, i) =>
    `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`
);
const PRESETS_KEY = 'routine_presets_v1';
const STEP_TITLES = ['Selección', 'Dispositivos', 'Horarios', 'Resumen'];

const loadPresets = () => {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
  } catch {
    return [];
  }
};
const savePresets = (list) =>
  localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
const idxOf = (t) => slots48.indexOf(t);
const minutesBetween = (a, b) =>
  (idxOf(b) - idxOf(a) + (idxOf(b) <= idxOf(a) ? 48 : 0)) * 30;
const idEq = (a, b) => String(a ?? '') === String(b ?? '');

export default function Rutinas() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { showAlert } = useAlert();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  // overrides locales de modo vacaciones para activar rutinas individuales
  const [vacationOverrides, setVacationOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('vacation_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleVacationOverride = (routineId) => {
    setVacationOverrides((prev) => {
      const next = { ...prev, [routineId]: !prev[routineId] };
      localStorage.setItem('vacation_overrides', JSON.stringify(next));
      return next;
    });
  };

  // --- HOOKS ---
  const { data: routines = [], isLoading: loadingRoutines } = useRoutines();
  const { data: patients = [] } = useUsers({ role: 'paciente' });
  const { data: households = [] } = useHouseholds();
  const { data: devices = [] } = useDevices();

  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();
  const deleteRoutineMutation = useDeleteRoutine();
  const updateUserMutation = useUpdateUser();

  // presets
  const [presets, setPresets] = useState(loadPresets());
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetTab, setPresetTab] = useState('create');
  const [presetForm, setPresetForm] = useState({
    name: '',
    start: '18:00',
    end: '19:00',
    days: [],
  });
  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  // modal creación
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({ name: '', user_id: '', household_id: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // paso 2/3
  const [selectedDevices, setSelectedDevices] = useState(new Set());
  const [scheduleBlocks, setScheduleBlocks] = useState({});
  const [target, setTarget] = useState('ALL');
  const [builder, setBuilder] = useState({
    start: '14:00',
    end: '15:00',
    days: [],
  });

  const [roomFilter, setRoomFilter] = useState('ALL');
  const [deviceQuery, setDeviceQuery] = useState('');

  // edición / borrado
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    user_id: '',
    household_id: '',
    occurrences: [],
  });

  /* ---------- helpers relación paciente↔casa ---------- */
  function householdHasPatient(h, patientId) {
    if (!h || !patientId) return false;
    const pid = String(patientId);

    const arrCandidates = [
      h.users,
      h.patients,
      h.members,
      h.user_ids,
      h.patient_ids,
    ].filter(Array.isArray);
    for (const arr of arrCandidates) {
      if (
        arr.some((x) =>
          idEq(typeof x === 'object' ? (x?._id ?? x?.id) : x, pid)
        )
      )
        return true;
    }
    if (h.patient_id && idEq(h.patient_id, pid)) return true;
    return false;
  }

  const availableHouseholds = useMemo(() => {
    if (!form.user_id) return [];
    return households.filter((h) => householdHasPatient(h, form.user_id));
  }, [households, form.user_id]);

  /* ---------- Paciente → Casa ---------- */
  useEffect(() => {
    if (!form.user_id) {
      setForm((f) => ({ ...f, household_id: '' }));
      return;
    }

    // si ya hay una seleccionada y sigue siendo válida, la respetamos
    if (
      form.household_id &&
      availableHouseholds.some((h) => idEq(h._id, form.household_id))
    )
      return;

    // si solo hay 1, autoselecciona; si hay varias, obligamos a elegir
    if (availableHouseholds.length === 1) {
      setForm((f) => ({ ...f, household_id: availableHouseholds[0]._id }));
    } else {
      setForm((f) => ({ ...f, household_id: '' }));
    }
  }, [form.user_id, availableHouseholds, form.household_id]);

  /* ---------- memos ---------- */
  const devicesByRoom = useMemo(() => {
    const hhId = form.household_id || '';
    const list = devices.filter((d) => idEq(d.household_id, hhId));
    const map = {};
    for (const d of list) {
      if (!map[d.room]) map[d.room] = [];
      map[d.room].push(d);
    }
    return map;
  }, [devices, form.household_id]);

  const roomNames = useMemo(() => Object.keys(devicesByRoom), [devicesByRoom]);

  const visibleDevices = useMemo(() => {
    const q = deviceQuery.trim().toLowerCase();
    const rooms = roomFilter === 'ALL' ? roomNames : [roomFilter];

    let list = [];
    for (const r of rooms) list = list.concat(devicesByRoom[r] || []);

    if (!q) return list;

    return list.filter((d) => {
      const a = (d.appliance || '').toLowerCase();
      const p = (d.plugmodel || '').toLowerCase();
      return a.includes(q) || p.includes(q);
    });
  }, [deviceQuery, roomFilter, roomNames, devicesByRoom]);

  /* ---------- helpers ---------- */
  function resetCreator() {
    setStep(1);
    setForm({ name: '', user_id: '', household_id: '' });
    setErrors({});
    setTouched({});
    setSelectedDevices(new Set());
    setScheduleBlocks({});
    setTarget('ALL');
    setBuilder({ start: '14:00', end: '15:00', days: [] });

    setRoomFilter('ALL');
    setDeviceQuery('');
  }
  function openCreator() {
    resetCreator();
    setOpen(true);
  }

  function toggleDevice(d) {
    const next = new Set(selectedDevices);
    next.has(d._id) ? next.delete(d._id) : next.add(d._id);
    setSelectedDevices(next);
    ensureBlocksFor([...next]);
  }
  function ensureBlocksFor(ids) {
    setScheduleBlocks((prev) => {
      const out = { ...prev };
      for (const id of ids) if (!out[id]) out[id] = [];
      return out;
    });
  }

  /* ---------- validación paso 1 ---------- */
  function validateStep1() {
    const e = {};

    if (!form.user_id) e.user_id = 'Selecciona una persona en seguimiento.';
    if (!availableHouseholds.length) {
      e.household_id = 'Esta persona en seguimiento no tiene casa asignada.';
    } else {
      if (!form.household_id) e.household_id = 'Selecciona una casa.';
      else if (
        !availableHouseholds.some((h) => idEq(h._id, form.household_id))
      ) {
        e.household_id =
          'La casa seleccionada no está asociada a esta persona en seguimiento.';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ---------- paso 3 builder ---------- */
  const endOptionsFor = (start) => {
    const s = idxOf(start);
    if (s < 0) return [];
    const out = [];
    for (let i = 1; i <= 48; i++) {
      const idx = (s + i) % 48;
      out.push({
        value: slots48[idx],
        label: `${slots48[idx]}${idx <= s ? ' (+1 día)' : ''}`,
      });
      if (i === 48) break;
    }
    return out;
  };
  const toggleBuilderDay = (d) =>
    setBuilder((b) => {
      const s = new Set(b.days);
      s.has(d) ? s.delete(d) : s.add(d);
      return { ...b, days: [...s] };
    });
  function applyBuilder() {
    if (!builder.start || !builder.end) { showAlert('Elige un inicio y un fin para la franja.'); return; }
    if (!builder.days?.length) { showAlert('Selecciona al menos un día.'); return; }
    if (!selectedDevices.size)
      { showAlert('Selecciona dispositivos en el paso 2.'); return; }
    if (minutesBetween(builder.start, builder.end) < 30)
      { showAlert('La duración mínima de una franja es de 30 minutos.'); return; }
    const ids = target === 'ALL' ? [...selectedDevices] : [target];
    setScheduleBlocks((prev) => {
      const out = { ...prev };
      for (const id of ids) {
        const list = out[id] ? [...out[id]] : [];
        list.push({ ...builder });
        out[id] = list;
      }
      return out;
    });
  }
  const removeBlock = (devId, i) =>
    setScheduleBlocks((prev) => ({
      ...prev,
      [devId]: prev[devId].filter((_, idx) => idx !== i),
    }));

  /* ---------- payload ---------- */
  function buildOccurrencesFromBlocks() {
    const group = new Map();
    for (const devId of selectedDevices) {
      const blocks = scheduleBlocks[devId] || [];
      for (const b of blocks) {
        const key = `${b.start}|${b.end}|${[...(b.days || [])].slice().sort().join(',')}`;
        if (!group.has(key))
          group.set(key, {
            start: b.start,
            end: b.end,
            days: [...b.days],
            device_ids: new Set(),
          });
        group.get(key).device_ids.add(devId);
      }
    }
    return [...group.values()].map((x) => ({
      start: x.start,
      end: x.end,
      days: x.days,
      device_ids: [...x.device_ids],
    }));
  }

  /* ---------- guardar ---------- */
  async function saveRoutine() {
    if (!validateStep1()) {
      setTouched({ user_id: true, household_id: true });
      return;
    }
    if (selectedDevices.size === 0)
      { showAlert('Selecciona al menos un dispositivo para la rutina.'); return; }
    const occurrences = buildOccurrencesFromBlocks();
    if (!occurrences.length)
      { showAlert('Añade al menos una franja horaria en el paso 3.'); return; }
    const householdId = form.household_id;
    const payload = {
      name: (form.name || '').trim(),
      user_id: form.user_id,
      household_id: householdId,
      occurrences,
    };
    try {
      await createRoutineMutation.mutateAsync(payload);
      setOpen(false);
    } catch (e) {
      showAlert(e.message || 'Error al guardar la rutina.');
    }
  }

  /* ---------- helpers listado ---------- */
  function normalizeRef(ref, { type }) {
    if (!ref) return { id: '', name: '' };
    if (typeof ref === 'string') return { id: ref, name: '' };
    if (ref.name && typeof ref.name === 'string')
      return { id: ref._id || ref.id || '', name: ref.name };
    if (type === 'device' && (ref.appliance || ref.plugmodel))
      return {
        id: ref._id || ref.id || '',
        name: ref.appliance || ref.plugmodel,
      };
    return { id: ref._id || ref.id || '', name: '' };
  }
  const getPatientName = useCallback(
    (userRef) => {
      const { id, name } = normalizeRef(userRef, { type: 'user' });
      if (name) return name;
      const p = patients.find((u) => idEq(u._id, id));
      return p?.name || id || '—';
    },
    [patients]
  );
  const getDeviceMeta = useCallback(
    (deviceRef, devs = devices, hhs = households) => {
      const norm = normalizeRef(deviceRef, { type: 'device' });
      const d = devs.find((x) => idEq(x?._id, norm.id));
      const isObj = deviceRef && typeof deviceRef === 'object';
      const dispName =
        norm.name || d?.appliance || d?.plugmodel || norm.id || 'Dispositivo';
      const room = d?.room || (isObj ? deviceRef.room : '') || '';
      const hhIdRaw =
        d?.household_id || (isObj ? deviceRef.household_id : '') || '';
      const home = hhs.find((h) => idEq(h?._id, hhIdRaw))?.name || '';
      return { name: dispName, room, home };
    },
    [devices, households]
  );
  function summarizeTimes(occ = []) {
    const m = new Map();
    for (const o of occ) {
      const k = `${o.start}–${o.end}`;
      m.set(k, (m.get(k) || 0) + (o.device_ids || []).length);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k);
  }
  function uniqueDevicesCount(occ = []) {
    const s = new Set();
    for (const o of occ)
      (o.device_ids || []).forEach((id) => s.add(String(id)));
    return s.size;
  }
  function daysUnion(occ = []) {
    const s = new Set();
    for (const o of occ) (o.days || []).forEach((d) => s.add(d));
    return [...s];
  }

  /* ---------- búsqueda/filtros/orden ---------- */
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState({ patientId: '', day: '' });
  const [sort, setSort] = useState('recent_desc');

  const filteredSorted = useMemo(() => {
    const qnorm = q.trim().toLowerCase();
    let arr = [...routines];

    if (flt.patientId) {
      arr = arr.filter((r) =>
        idEq(
          typeof r.user_id === 'object' ? r.user_id?._id : r.user_id,
          flt.patientId
        )
      );
    }
    if (flt.day) {
      arr = arr.filter(
        (r) =>
          Array.isArray(r.occurrences) &&
          r.occurrences.some(
            (o) => Array.isArray(o.days) && o.days.includes(flt.day)
          )
      );
    }
    if (qnorm) {
      arr = arr.filter((r) => {
        const patient = (getPatientName(r.user_id) || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        let devicesTxt = '',
          timeTxt = '';
        if (Array.isArray(r.occurrences)) {
          for (const o of r.occurrences) {
            timeTxt += ` ${o.start || ''} ${o.end || ''}`;
            for (const dRef of o.device_ids || []) {
              const meta = getDeviceMeta(dRef, devices, households);
              devicesTxt += ` ${meta.name || ''} ${meta.room || ''} ${meta.home || ''}`;
            }
          }
        }
        return `${patient} ${name} ${devicesTxt.toLowerCase()} ${timeTxt.toLowerCase()}`.includes(
          qnorm
        );
      });
    }

    if (sort === 'recent_desc' || sort === 'recent_asc') {
      arr.sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sort === 'recent_desc' ? tb - ta : ta - tb;
      });
    } else {
      arr.sort((a, b) => {
        const c1 = getPatientName(a.user_id).localeCompare(
          getPatientName(b.user_id)
        );
        if (c1 !== 0) return c1;
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    return arr;
  }, [
    q,
    flt,
    sort,
    routines,
    devices,
    households,
    getPatientName,
    getDeviceMeta,
  ]);

  /* ---------- edición (completa) ---------- */
  function openEditModal(r) {
    setEditId(r._id);
    const occs = Array.isArray(r.occurrences)
      ? r.occurrences.map((o) => ({
        start: o.start || '14:00',
        end: o.end || '15:00',
        days: Array.isArray(o.days) ? [...o.days] : [],
        device_ids: Array.isArray(o.device_ids)
          ? o.device_ids.map((d) =>
            typeof d === 'object' ? d?._id || d?.id : d
          )
          : [],
      }))
      : [];
    setEditData({
      name: r.name || '',
      user_id:
        typeof r.user_id === 'object'
          ? r.user_id?._id || r.user_id?.id || ''
          : r.user_id || '',
      household_id:
        typeof r.household_id === 'object'
          ? r.household_id?._id || r.household_id?.id || ''
          : r.household_id || '',
      occurrences: occs,
    });
    setEditOpen(true);
  }
  const updateOccurrence = (idx, patch) =>
    setEditData((ed) => {
      const next = [...ed.occurrences];
      next[idx] = { ...next[idx], ...patch };
      return { ...ed, occurrences: next };
    });
  const toggleOccDevice = (idx, deviceId) =>
    setEditData((ed) => {
      const next = [...ed.occurrences];
      const s = new Set(next[idx].device_ids);
      s.has(deviceId) ? s.delete(deviceId) : s.add(deviceId);
      next[idx] = { ...next[idx], device_ids: [...s] };
      return { ...ed, occurrences: next };
    });
  const toggleOccDay = (idx, day) =>
    setEditData((ed) => {
      const next = [...ed.occurrences];
      const s = new Set(next[idx].days || []);
      s.has(day) ? s.delete(day) : s.add(day);
      next[idx] = { ...next[idx], days: [...s] };
      return { ...ed, occurrences: next };
    });
  const addOccurrence = () =>
    setEditData((ed) => ({
      ...ed,
      occurrences: [
        ...ed.occurrences,
        { start: '14:00', end: '15:00', days: [], device_ids: [] },
      ],
    }));
  const removeOccurrence = (idx) =>
    setEditData((ed) => ({
      ...ed,
      occurrences: ed.occurrences.filter((_, i) => i !== idx),
    }));

  async function saveEdit() {
    try {
      if (!editId) return;
      if (!editData.occurrences?.length)
        { showAlert('Añade al menos una franja horaria.'); return; }
      for (const o of editData.occurrences) {
        if (!o.start || !o.end)
          { showAlert('Cada franja debe tener una hora de inicio y fin.'); return; }
        if (!o.days?.length) { showAlert('Cada franja debe tener al menos un día seleccionado.'); return; }
        if (!o.device_ids?.length)
          { showAlert('Cada franja debe tener al menos un dispositivo asignado.'); return; }
      }
      const payload = {
        name: (editData.name || '').trim(),
        occurrences: editData.occurrences.map((o) => ({
          start: o.start,
          end: o.end,
          days: o.days,
          device_ids: o.device_ids,
        })),
        id: editId,
      };

      await updateRoutineMutation.mutateAsync(payload);
      setEditOpen(false);
      setEditId(null);
    } catch (e) {
      showAlert(e.message || 'Error al editar la rutina.');
    }
  }

  function EditOccurrenceCard({
    idx,
    o,
    devices,
    slots48,
    idxOf,
    updateOccurrence,
    toggleOccDay,
    toggleOccDevice,
    removeOccurrence,
  }) {
    const endOptionsForEdit = (start) => {
      const s = idxOf(start);
      if (s < 0) return [];
      const out = [];
      for (let i = 1; i <= 48; i++) {
        const id = (s + i) % 48;
        out.push({
          value: slots48[id],
          label: `${slots48[id]}${id <= s ? ' (+1 día)' : ''}`,
        });
        if (i === 48) break;
      }
      return out;
    };

    // filtros dispositivos (por habitación + búsqueda)
    const [roomF, setRoomF] = useState('ALL');
    const [qq, setQQ] = useState('');

    const rooms = useMemo(() => {
      const set = new Set();
      for (const d of devices) if (d?.room) set.add(d.room);
      return [...set].sort((a, b) => a.localeCompare(b));
    }, [devices]);

    const visibleDevs = useMemo(() => {
      const q = qq.trim().toLowerCase();
      let list = devices;
      if (roomF !== 'ALL') list = list.filter((d) => d.room === roomF);
      if (!q) return list;
      return list.filter((d) => {
        const a = (d.appliance || '').toLowerCase();
        const p = (d.plugmodel || '').toLowerCase();
        return a.includes(q) || p.includes(q);
      });
    }, [devices, roomF, qq]);

    return (
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '.75rem',
          }}
        >
          <strong>Franja #{idx + 1}</strong>
          <Btn
            style={{
              borderColor: '#e04848',
              background: '#e04848',
              color: '#fff',
            }}
            onClick={() => removeOccurrence(idx)}
          >
            Eliminar
          </Btn>
        </div>

        {/* Inicio/Fin */}
        <FormGroup style={{ marginTop: '.5rem' }}>
          <label>Inicio / Fin</label>
          <div
            style={{
              display: 'flex',
              gap: '.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={o.start}
              onChange={(e) => {
                const start = e.target.value;
                const ends = endOptionsForEdit(start);
                const valid = ends.some((opt) => opt.value === o.end);
                updateOccurrence(idx, {
                  start,
                  end: valid ? o.end : ends[0]?.value || o.end,
                });
              }}
            >
              {slots48.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span>—</span>
            <select
              value={o.end}
              onChange={(e) => updateOccurrence(idx, { end: e.target.value })}
            >
              {endOptionsForEdit(o.start).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </FormGroup>

        {/* Días */}
        <FormGroup>
          <label>Días</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
            {DAY_NAMES.map((d, i) => (
              <DayBtn
                key={d}
                type="button"
                active={o.days.includes(d)}
                onClick={() => toggleOccDay(idx, d)}
                title={ES_DAYS[d]}
                style={{ minWidth: 44 }}
              >
                {DAY_SHORT[i]}
              </DayBtn>
            ))}
          </div>
        </FormGroup>

        {/* Dispositivos */}
        <FormGroup>
          <label>Dispositivos</label>
          {/* Filtros */}
          <Card style={{ marginTop: '.25rem' }}>
            <div
              style={{
                display: 'flex',
                gap: '.75rem',
                flexWrap: 'wrap',
                alignItems: 'end',
              }}
            >
              <div style={{ minWidth: 220 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  Habitación
                </label>
                <select
                  value={roomF}
                  onChange={(e) => setRoomF(e.target.value)}
                >
                  <option value="ALL">Todas</option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  Buscar dispositivo
                </label>
                <input
                  value={qq}
                  onChange={(e) => setQQ(e.target.value)}
                  placeholder="Buscar por electrodoméstico o modelo"
                />
              </div>

              <div style={{ display: 'flex', gap: '.5rem' }}>
                <Btn
                  variant="primary"
                  onClick={() => {
                    const s = new Set(o.device_ids);
                    for (const d of visibleDevs) s.add(d._id);
                    updateOccurrence(idx, { device_ids: [...s] });
                  }}
                  disabled={!visibleDevs.length}
                >
                  Seleccionar visibles
                </Btn>

                <Btn
                  variant="primary"
                  onClick={() => {
                    const s = new Set(o.device_ids);
                    for (const d of visibleDevs) s.delete(d._id);
                    updateOccurrence(idx, { device_ids: [...s] });
                  }}
                  disabled={!visibleDevs.length}
                >
                  Quitar visibles
                </Btn>
              </div>
            </div>
          </Card>

          {/* Lista */}
          <ScrollCard style={{ marginTop: '.75rem', maxHeight: '38vh' }}>
            <strong>Dispositivos</strong>
            <div style={{ marginTop: '.5rem' }}>
              {!visibleDevs.length && (
                <Small>No hay dispositivos que coincidan.</Small>
              )}

              {visibleDevs.map((d) => (
                <DeviceRow key={d._id}>
                  <input
                    type="checkbox"
                    checked={o.device_ids.includes(d._id)}
                    onChange={() => toggleOccDevice(idx, d._id)}
                  />
                  <span className="devText">
                    {d.appliance || 'Dispositivo'}{' '}
                    <Small>({d.plugmodel})</Small>
                    {d.room ? (
                      <Small style={{ marginLeft: 8 }}>— {d.room}</Small>
                    ) : null}
                  </span>
                </DeviceRow>
              ))}
            </div>
          </ScrollCard>
        </FormGroup>
      </Card>
    );
  }

  /* ---------- borrado ---------- */
  const openDeleteModal = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };
  async function confirmDelete() {
    try {
      if (!deleteId) return;
      await deleteRoutineMutation.mutateAsync(deleteId);
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (e) {
      showAlert(e.message || 'Error al borrar la rutina.');
    }
  }

  /* ---------- presets modal ---------- */
  const togglePresetDay = (d) =>
    setPresetForm((f) => {
      const s = new Set(f.days);
      s.has(d) ? s.delete(d) : s.add(d);
      return { ...f, days: [...s] };
    });
  const addPreset = () => {
    const { name, start, end, days } = presetForm;
    if (!name.trim() || !days.length || idxOf(start) < 0 || idxOf(end) < 0)
      { showAlert('Completa el nombre, los días y las horas de inicio y fin.'); return; }
    if (minutesBetween(start, end) < 30)
      { showAlert('El fin debe ser al menos 30 minutos después del inicio.'); return; }
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setPresets((p) => [...p, { id, name: name.trim(), start, end, days }]);
    setPresetForm({ name: '', start: '18:00', end: '19:00', days: [] });
  };
  const deletePreset = (id) => setPresets((p) => p.filter((x) => x.id !== id));

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
          <Toolbar>
            <h1>
              Rutinas
              <InfoTooltip text="Las rutinas definen cuándo se espera que la persona en seguimiento use un electrodoméstico específico. Si no se detecta consumo en esa franja horaria, el sistema crea una alerta." />
            </h1>
            <div>
              <Btn variant="primary" onClick={() => setPresetOpen(true)}>
                + Añadir preset
              </Btn>
              <Btn variant="primary" onClick={openCreator}>
                + Añadir rutina
              </Btn>
            </div>
          </Toolbar>

          {/* Filtros */}
          <div style={{ marginBottom: '1rem' }}>
            <SearchToolbar
              query={q}
              onQueryChange={setQ}
              placeholder="Buscar por nombre, persona en seguimiento, dispositivo, sala o casa"
              filters={[
                {
                  type: 'select',
                  key: 'patientId',
                  label: 'Persona en seguimiento',
                  options: [
                    { value: '', label: 'Todos' },
                    ...patients.map((p) => ({
                      value: p._id,
                      label: p.name || p._id,
                    })),
                  ],
                },
                {
                  type: 'select',
                  key: 'day',
                  label: 'Día',
                  options: [
                    { value: '', label: 'Todos' },
                    ...DAY_NAMES.map((d) => ({ value: d, label: ES_DAYS[d] })),
                  ],
                },
              ]}
              values={flt}
              onValuesChange={setFlt}
              sortOptions={[
                { value: 'recent_desc', label: 'Más recientes' },
                { value: 'recent_asc', label: 'Más antiguas' },
                { value: 'alpha', label: 'Persona / Nombre' },
              ]}
              sort={sort}
              onSortChange={setSort}
              onClear={() => {
                setQ('');
                setFlt({ patientId: '', day: '' });
                setSort('recent_desc');
              }}
            />
          </div>

          {/* Lista */}
          <List>
            {loadingRoutines && <p>Cargando rutinas...</p>}
            {!loadingRoutines &&
              filteredSorted.map((r) => {
                // r.user_id can be a populated object { _id, name, ... } or just an ID string
                const routineUserId = typeof r.user_id === 'object'
                  ? (r.user_id?._id || r.user_id?.id || '')
                  : r.user_id;
                const userObj = patients.find((p) => idEq(p._id, routineUserId));
                const isVacation = !!userObj?.vacation_mode;
                const isOverridden = !!vacationOverrides[r._id];
                const isCurrentlyActive = r.enabled !== false && (!isVacation || isOverridden);

                const patient = getPatientName(r.user_id);
                const occ = Array.isArray(r.occurrences) ? r.occurrences : [];
                const times = summarizeTimes(occ);
                const daysPretty = daysUnion(occ).map((d) => ES_DAYS[d] || d);
                const devCount = uniqueDevicesCount(occ);
                return (
                  <RoutineCard key={r._id}>
                    <CardTop>
                      <CardTitle>
                        {r.name || `Rutina ${String(r._id).slice(-6)}`}
                        {r.enabled === false && (
                          <StatusBadge $type="paused">Pausada</StatusBadge>
                        )}
                        {r.enabled !== false && isVacation && !isOverridden && (
                          <StatusBadge $type="vacation">
                            <Sun size={12} /> Modo Vacaciones
                          </StatusBadge>
                        )}
                      </CardTitle>
                      <div
                        style={{
                          display: 'flex',
                          gap: '.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <ToggleWrapper
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const willEnable = !isCurrentlyActive;
                              if (isVacation) {
                                if (willEnable) {
                                  if (r.enabled === false) {
                                    await updateRoutineMutation.mutateAsync({
                                      id: r._id,
                                      enabled: true
                                    });
                                  }
                                  toggleVacationOverride(r._id);
                                } else {
                                  if (isOverridden) {
                                    toggleVacationOverride(r._id);
                                  } else {
                                    await updateRoutineMutation.mutateAsync({
                                      id: r._id,
                                      enabled: false
                                    });
                                  }
                                }
                              } else {
                                await updateRoutineMutation.mutateAsync({
                                  id: r._id,
                                  enabled: willEnable
                                });
                              }
                            } catch (err) {
                              showAlert('Error al actualizar la rutina: ' + err.message);
                            }
                          }}
                          title={isCurrentlyActive ? "Pausar rutina" : "Activar rutina"}
                          style={{ marginRight: '.5rem' }}
                        >
                          <SwitchControl active={isCurrentlyActive} />
                        </ToggleWrapper>

                        <Btn variant="primary" onClick={() => openEditModal(r)}>
                          <Pencil size={14} /> Editar
                        </Btn>
                        <DangerBtn onClick={() => openDeleteModal(r._id)}>
                          <Trash2 size={14} /> Borrar
                        </DangerBtn>
                        {times.length > 0 && (
                          <TimePill>{times.join(' · ')}</TimePill>
                        )}
                      </div>
                    </CardTop>
                    <Meta>
                      Persona en seguimiento: <strong>{patient}</strong>
                      {' · '}
                      Ocurrencias: <strong>{occ.length}</strong>
                      {' · '}
                      Dispositivos totales: <strong>{devCount}</strong>
                    </Meta>
                    {!!daysPretty.length && (
                      <TagRow>
                        {daysPretty.map((d) => (
                          <Tag key={d}>{d}</Tag>
                        ))}
                      </TagRow>
                    )}
                  </RoutineCard>
                );
              })}
            {!loadingRoutines && !filteredSorted.length && (
              <Muted>No hay rutinas que coincidan con el filtro.</Muted>
            )}
          </List>
        </Main>
      </Body>
      <Footer />

      {/* ---------- MODAL CREAR ---------- */}
      <Modal isOpen={open} onClose={() => setOpen(false)} maxWidth="800px">
        <Wizard>
          <ModalBody>
            <ModalHeader>
              <CompactHeader>
                <div>
                  <h2>Crear rutina</h2>
                  <StepSub>
                    {' '}
                    Paso {step} de {STEP_TITLES.length} —{' '}
                    {STEP_TITLES[step - 1]}{' '}
                  </StepSub>
                </div>
                <StepBadge>
                  {step} · {STEP_TITLES[step - 1]}
                </StepBadge>
                <Progress aria-hidden="true">
                  <ProgressFill
                    style={{
                      width: `${((step - 1) / (STEP_TITLES.length - 1)) * 100}%`,
                    }}
                  />
                </Progress>
              </CompactHeader>
            </ModalHeader>

            <ModalContent>
              {/* PASO 1, 2, 3 ... (Misma lógica de renderizado, usando los estados locales y datos de hooks) */}

              {step === 1 && (
                <>
                  <FormGroup>
                    <label>
                      Nombre de la rutina (opcional)
                      <InfoTooltip text="Ejemplo: Desayuno, Encendido de TV, etc. Ayuda a identificar el hábito." />
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="p.ej. Comida"
                    />
                  </FormGroup>

                  <FormGroup>
                    <label>
                      Persona en seguimiento
                      <InfoTooltip text="Selecciona a qué persona en seguimiento pertenece esta rutina." />
                    </label>
                    <select
                      value={form.user_id}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, user_id: e.target.value }));
                        setTouched((t) => ({ ...t, user_id: true }));
                        setErrors({});
                      }}
                    >
                      <option value="">— Selecciona —</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name || p._id}
                        </option>
                      ))}
                    </select>
                    {touched.user_id && errors.user_id && (
                      <div
                        style={{
                          color: '#e04848',
                          fontSize: '.85rem',
                          marginTop: 4,
                        }}
                      >
                        {errors.user_id}
                      </div>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <label>Casa</label>
                    {!form.user_id ? (
                      <select disabled>
                        <option>— Selecciona una persona en seguimiento —</option>
                      </select>
                    ) : availableHouseholds.length === 0 ? (
                      <>
                        <select disabled>
                          <option>— Sin casa asignada —</option>
                        </select>
                        {errors.household_id && (
                          <div
                            style={{
                              color: '#e04848',
                              fontSize: '.85rem',
                              marginTop: 4,
                            }}
                          >
                            {errors.household_id}
                          </div>
                        )}
                      </>
                    ) : availableHouseholds.length === 1 ? (
                      <>
                        <input
                          value={
                            availableHouseholds[0].name ||
                            availableHouseholds[0]._id
                          }
                          readOnly
                          disabled
                        />
                        <Small>
                          La casa queda fijada a la única casa de la persona en seguimiento.
                        </Small>
                      </>
                    ) : (
                      <>
                        <select
                          value={form.household_id}
                          onChange={(e) => {
                            setForm((f) => ({
                              ...f,
                              household_id: e.target.value,
                            }));
                            setTouched((t) => ({ ...t, household_id: true }));
                            setErrors({});
                          }}
                        >
                          <option value="">— Selecciona —</option>
                          {availableHouseholds.map((h) => (
                            <option key={h._id} value={h._id}>
                              {h.name || h._id}
                            </option>
                          ))}
                        </select>
                        <Small>
                          Esta persona en seguimiento está asociada a varias casas. Elige en
                          cuál crear la rutina.
                        </Small>
                        {touched.household_id && errors.household_id && (
                          <div
                            style={{
                              color: '#e04848',
                              fontSize: '.85rem',
                              marginTop: 4,
                            }}
                          >
                            {errors.household_id}
                          </div>
                        )}
                      </>
                    )}
                  </FormGroup>

                  <StepFooter>
                    <DangerBtn onClick={() => setOpen(false)}>
                      Cancelar
                    </DangerBtn>
                    <Btn
                      variant="primary"
                      onClick={() => {
                        if (validateStep1()) setStep(2);
                      }}
                    >
                      Siguiente
                    </Btn>
                  </StepFooter>
                </>
              )}

              {step === 2 && (
                <>
                  <Card>
                    <div
                      style={{
                        display: 'flex',
                        gap: '.75rem',
                        flexWrap: 'wrap',
                        alignItems: 'end',
                      }}
                    >
                      <div style={{ minWidth: 220 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>
                          Habitación
                        </label>
                        <select
                          value={roomFilter}
                          onChange={(e) => setRoomFilter(e.target.value)}
                        >
                          <option value="ALL">Todas</option>
                          {roomNames.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>
                          Buscar dispositivo
                        </label>
                        <input
                          value={deviceQuery}
                          onChange={(e) => setDeviceQuery(e.target.value)}
                          placeholder="Buscar por electrodoméstico o modelo..."
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <DangerBtn
                          onClick={() => {
                            const next = new Set(selectedDevices);
                            for (const d of visibleDevices) next.delete(d._id);
                            setSelectedDevices(next);
                          }}
                          disabled={!visibleDevices.length}
                        >
                          Quitar visibles
                        </DangerBtn>
                        <Btn
                          variant="primary"
                          onClick={() => {
                            const next = new Set(selectedDevices);
                            for (const d of visibleDevices) next.add(d._id);
                            setSelectedDevices(next);
                            ensureBlocksFor([...next]);
                          }}
                          disabled={!visibleDevices.length}
                        >
                          Seleccionar visibles
                        </Btn>
                      </div>
                    </div>
                  </Card>
                  <ScrollCard style={{ marginTop: '.75rem' }}>
                    <strong>
                      Dispositivos
                      <InfoTooltip text="Enchufes inteligentes que la persona en seguimiento debe activar durante esta rutina." />
                    </strong>
                    <div style={{ marginTop: '.5rem' }}>
                      {!visibleDevices.length && (
                        <Small>No hay dispositivos que coincidan.</Small>
                      )}
                      {visibleDevices.map((d) => (
                        <DeviceRow key={d._id}>
                          <input
                            type="checkbox"
                            checked={selectedDevices.has(d._id)}
                            onChange={() => toggleDevice(d)}
                          />
                          <span className="devText">
                            {d.appliance || 'Dispositivo'}{' '}
                            <Small>({d.plugmodel})</Small>
                            {d.room ? (
                              <Small style={{ marginLeft: 8 }}>
                                — {d.room}
                              </Small>
                            ) : null}
                          </span>
                        </DeviceRow>
                      ))}
                    </div>
                  </ScrollCard>
                  <StepFooter>
                    <DangerBtn onClick={() => setStep(1)}>Atrás</DangerBtn>
                    <Btn
                      variant="primary"
                      onClick={() => {
                        if (selectedDevices.size) {
                          ensureBlocksFor([...selectedDevices]);
                          setStep(3);
                        }
                      }}
                      disabled={!selectedDevices.size}
                    >
                      Siguiente
                    </Btn>
                  </StepFooter>
                </>
              )}

              {step === 3 && (
                <>
                  <Card style={{ marginBottom: '1rem' }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        marginBottom: '.5rem',
                        borderBottom: '1px solid #333',
                        paddingBottom: '.25rem',
                      }}
                    >
                      Definir franja horaria
                      <InfoTooltip text="Periodo del día durante el cual se debe detectar el uso del electrodoméstico." />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '.75rem',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: 4,
                            fontSize: '.85rem',
                          }}
                        >
                          Aplicar a dispositivo(s)
                        </label>
                        <select
                          style={{
                            width: '100%',
                            padding: '.4rem',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                          }}
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                        >
                          <option value="ALL">Todos los seleccionados</option>
                          {[...selectedDevices].map((id) => {
                            const d = devices.find((x) => idEq(x._id, id));
                            return (
                              <option key={id} value={id}>
                                {d?.appliance || id} ({d?.room})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: 'block',
                              marginBottom: 4,
                              fontSize: '.85rem',
                            }}
                          >
                            Inicio
                          </label>
                          <select
                            style={{
                              padding: '.4rem',
                              borderRadius: 6,
                              border: '1px solid #ccc',
                            }}
                            value={builder.start}
                            onChange={(e) =>
                              setBuilder((b) => ({
                                ...b,
                                start: e.target.value,
                              }))
                            }
                          >
                            {slots48.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span style={{ paddingTop: 20 }}>—</span>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              marginBottom: 4,
                              fontSize: '.85rem',
                            }}
                          >
                            Fin
                          </label>
                          <select
                            style={{
                              padding: '.4rem',
                              borderRadius: 6,
                              border: '1px solid #ccc',
                            }}
                            value={builder.end}
                            onChange={(e) =>
                              setBuilder((b) => ({ ...b, end: e.target.value }))
                            }
                          >
                            {endOptionsFor(builder.start).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '.75rem' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 4,
                          fontSize: '.85rem',
                        }}
                      >
                        Días de la semana
                        <InfoTooltip text="Días específicos en los que se evaluará el cumplimiento de esta rutina." />
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          gap: '.25rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {DAY_SHORT.map((d, i) => {
                          const full = DAY_NAMES[i];
                          const active = builder.days.includes(full);
                          return (
                            <Chip
                              key={full}
                              $active={active}
                              onClick={() => toggleBuilderDay(full)}
                            >
                              {d}
                            </Chip>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                      <Btn variant="primary" onClick={applyBuilder}>
                        + Añadir franja
                      </Btn>
                    </div>
                  </Card>

                  <ScrollCard style={{ maxHeight: '40vh' }}>
                    {[...selectedDevices].map((devId) => {
                      if (target !== 'ALL' && target !== devId) return null;
                      const d = devices.find((x) => idEq(x._id, devId));
                      const blocks = scheduleBlocks[devId] || [];
                      return (
                        <div
                          key={devId}
                          style={{
                            marginBottom: '1rem',
                            borderBottom: '1px solid #eee',
                            paddingBottom: '.5rem',
                          }}
                        >
                          <strong>
                            {d?.appliance} ({d?.room})
                          </strong>
                          {!blocks.length && (
                            <div style={{ opacity: 0.6, fontSize: '.9rem' }}>
                              Sin franjas asignadas.
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '.25rem',
                              marginTop: '.25rem',
                            }}
                          >
                            {blocks.map((b, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  gap: '.5rem',
                                  alignItems: 'center',
                                  background: 'rgba(0,0,0,0.05)',
                                  padding: '.25rem .5rem',
                                  borderRadius: 4,
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>
                                  {b.start} - {b.end}
                                </span>
                                <div style={{ display: 'flex', gap: 2 }}>
                                  {b.days.map((day) => (
                                    <span
                                      key={day}
                                      style={{
                                        fontSize: '.75rem',
                                        background: 'rgba(0,0,0,0.1)',
                                        padding: '0 .3rem',
                                        borderRadius: 4,
                                      }}
                                    >
                                      {ES_DAYS[day]?.slice(0, 3)}
                                    </span>
                                  ))}
                                </div>
                                <DangerBtn
                                  style={{
                                    padding: '.1rem .3rem',
                                    fontSize: '.7rem',
                                    marginLeft: 'auto',
                                  }}
                                  onClick={() => removeBlock(devId, i)}
                                >
                                  x
                                </DangerBtn>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollCard>

                  <StepFooter>
                    <DangerBtn onClick={() => setStep(2)}>Atrás</DangerBtn>
                    <Btn variant="primary" onClick={() => setStep(4)}>
                      Siguiente
                    </Btn>
                  </StepFooter>
                </>
              )}

              {step === 4 && (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <h3>Resumen de la Rutina</h3>
                  <Card
                    style={{
                      maxWidth: 400,
                      margin: '1rem auto',
                      textAlign: 'left',
                    }}
                  >
                    <p>
                      <strong>Nombre:</strong> {form.name || '(Sin nombre)'}
                    </p>
                    <p>
                      <strong>Persona en seguimiento:</strong> {getPatientName(form.user_id)}
                    </p>
                    <p>
                      <strong>Casa:</strong>{' '}
                      {households.find((h) => idEq(h._id, form.household_id))
                        ?.name || form.household_id}
                    </p>
                    <div
                      style={{
                        marginTop: '.5rem',
                        borderTop: '1px solid #eee',
                        paddingTop: '.5rem',
                      }}
                    >
                      <strong>Dispositivos configurados:</strong>{' '}
                      {
                        Object.keys(scheduleBlocks).filter(
                          (k) => scheduleBlocks[k]?.length
                        ).length
                      }
                    </div>
                  </Card>
                  <StepFooter style={{ justifyContent: 'center' }}>
                    <DangerBtn onClick={() => setStep(3)}>Atrás</DangerBtn>
                    <Btn variant="primary" onClick={saveRoutine}>
                      Confirmar y Guardar
                    </Btn>
                  </StepFooter>
                </div>
              )}
            </ModalContent>
          </ModalBody>
        </Wizard>
      </Modal>

      {/* ---------- MODAL EDITAR ---------- */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="600px"
      >
        <h2>Editar rutina</h2>
        <FormGroup>
          <label>Nombre</label>
          <input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
        </FormGroup>
        <div style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 4 }}>
          {editData.occurrences.map((o, idx) => (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <EditOccurrenceCard
                idx={idx}
                o={o}
                devices={devices}
                slots48={slots48}
                idxOf={idxOf}
                updateOccurrence={updateOccurrence}
                toggleOccDay={toggleOccDay}
                toggleOccDevice={toggleOccDevice}
                removeOccurrence={removeOccurrence}
              />
            </div>
          ))}
          {!editData.occurrences.length && (
            <p>No hay franjas de tiempo definidas.</p>
          )}
        </div>
        <Btn
          variant="primary"
          onClick={addOccurrence}
          style={{ marginTop: '.5rem', width: '100%' }}
        >
          + Añadir franja
        </Btn>

        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <DangerBtn onClick={() => setEditOpen(false)}>Cancelar</DangerBtn>
          <Btn variant="primary" onClick={saveEdit}>
            Guardar Cambios
          </Btn>
        </div>
      </Modal>

      {/* ---------- MODAL PRESETS ---------- */}
      <Modal isOpen={presetOpen} onClose={() => setPresetOpen(false)}>
        <h2>Gestionar Presets</h2>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            borderBottom: '1px solid #eee',
          }}
        >
          <Btn
            variant={presetTab === 'create' ? 'primary' : ''}
            onClick={() => setPresetTab('create')}
            style={{ borderRadius: '4px 4px 0 0' }}
          >
            Crear nuevo
          </Btn>
          <Btn
            variant={presetTab === 'list' ? 'primary' : ''}
            onClick={() => setPresetTab('list')}
            style={{ borderRadius: '4px 4px 0 0' }}
          >
            Mis presets
          </Btn>
        </div>

        {presetTab === 'create' && (
          <>
            <FormGroup>
              <label>Nombre del preset</label>
              <input
                value={presetForm.name}
                onChange={(e) =>
                  setPresetForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="p.ej. Tarde estándar"
              />
            </FormGroup>
            <FormGroup>
              <label>Horario por defecto</label>
              <div
                style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}
              >
                <select
                  value={presetForm.start}
                  onChange={(e) =>
                    setPresetForm((f) => ({ ...f, start: e.target.value }))
                  }
                >
                  {slots48.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span>—</span>
                <select
                  value={presetForm.end}
                  onChange={(e) =>
                    setPresetForm((f) => ({ ...f, end: e.target.value }))
                  }
                >
                  {endOptionsFor(presetForm.start).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </FormGroup>
            <FormGroup>
              <label>Días por defecto</label>
              <div style={{ display: 'flex', gap: '.25rem' }}>
                {DAY_SHORT.map((d, i) => {
                  const full = DAY_NAMES[i];
                  return (
                    <Chip
                      key={full}
                      $active={presetForm.days.includes(full)}
                      onClick={() => togglePresetDay(full)}
                    >
                      {d}
                    </Chip>
                  );
                })}
              </div>
            </FormGroup>
            <Btn
              variant="primary"
              onClick={addPreset}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Guardar Preset
            </Btn>
          </>
        )}

        {presetTab === 'list' && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {presets.map((p) => (
              <li
                key={p.id}
                style={{
                  border: '1px solid #eee',
                  padding: '.5rem',
                  borderRadius: 6,
                  marginBottom: '.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '.85rem', opacity: 0.8 }}>
                    {p.start}-{p.end}, {p.days.length} días
                  </div>
                </div>
                <DangerBtn
                  style={{ fontSize: '.8rem', padding: '.2rem .5rem' }}
                  onClick={() => deletePreset(p.id)}
                >
                  Borrar
                </DangerBtn>
              </li>
            ))}
            {!presets.length && <p>No tienes presets guardados.</p>}
          </ul>
        )}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <DangerBtn onClick={() => setPresetOpen(false)}>Cerrar</DangerBtn>
        </div>
      </Modal>

      {/* ---------- MODAL DELETE ---------- */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <h2>¿Borrar rutina?</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '.5rem',
          }}
        >
          <Btn onClick={() => setDeleteOpen(false)}>Cancelar</Btn>
          <DangerBtn onClick={confirmDelete}>Sí, Borrar</DangerBtn>
        </div>
      </Modal>
    </AppContainer>
  );
}
