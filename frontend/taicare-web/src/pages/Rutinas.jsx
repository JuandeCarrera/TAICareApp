// src/pages/Rutinas.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header  from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer  from '../components/Footer.jsx'
import Modal, { FormGroup } from '../components/Modal.jsx'
import SearchToolbar from '../components/SearchToolbar.jsx'   // ← NUEVO

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/* ---------- Layout base ---------- */
const AppContainer = styled.div`
  display: flex; flex-direction: column; height: 100vh; width: 100vw;
`
const Body = styled.div`
  flex: 1; display: flex; overflow: hidden;
`
const Main = styled.main`
  flex: 1; background: ${({ theme }) => theme.colors.bg}; padding: 2rem; overflow-y: auto;
`
const Toolbar = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;
  > div { display:flex; gap:.5rem; align-items:center; }
`
const Btn = styled.button`
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid
    ${({ theme, variant }) =>
      variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? 'white' : theme.colors.text};
  cursor: pointer;
  transition: background .2s, color .2s, border-color .2s;
  &:hover {
    background: ${({ theme, variant }) =>
      variant === 'primary' ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
`
const NewButton = styled(Btn).attrs({ variant: 'primary' })``
const OutlineBtn = styled(Btn)``

/* ---------- Listado ---------- */
const List = styled.ul`
  list-style: none; padding: 0; margin: 0;
`
const RoutineCard = styled.li`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 14px 16px;
  & + & { margin-top: 12px; }
`
const CardTop = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:.75rem;
`
const CardTitle = styled.div`
  font-weight:700; font-size:1.05rem; color:${({theme})=>theme.colors.text};
`
const TimePill = styled.span`
  padding: .2rem .55rem;
  border:1px solid ${({theme})=>theme.colors.primary};
  color:#fff; background:${({theme})=>theme.colors.primary};
  border-radius:999px; font-size:.85rem; white-space:nowrap;
`
const Meta = styled.div`
  margin-top:.4rem; opacity:.9; color:${({theme})=>theme.colors.text}; font-size:.9rem;
`
const TagRow = styled.div`
  display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.6rem;
`
const Tag = styled.span`
  padding:.15rem .5rem; border-radius:999px;
  border:1px solid ${({theme})=>theme.colors.border};
  background:${({theme})=>theme.colors.hoverBg};
  font-size:.8rem; opacity:.9;
`
const Muted = styled.div`
  color: ${({ theme }) => theme.colors.text}; opacity: .8; font-size: .9rem;
  margin-top: .25rem;
`

/* ---------- Paso a paso + grid ---------- */
const Stepper = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-bottom: .75rem;
`
const Step = styled.div`
  padding: .4rem .5rem;
  border-radius: 6px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ active }) => active ? 'white' : 'inherit'};
  font-weight: 600; font-size: .85rem;
`
const Grid = styled.div`
  display: grid; grid-template-columns: 220px 1fr; gap: .75rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px; padding: .75rem;
`
const Room = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: .35rem .45rem; border-radius: 6px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
`
const Small = styled.small` opacity:.75; `
const DeviceRow = styled.label`
  display: flex; align-items: center; gap: .5rem;
  padding: .35rem .45rem; border-radius: 6px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
`
const ScheduleToolbar = styled.div`
  display: flex; gap: .5rem; align-items: center; justify-content: space-between; margin-bottom: .5rem;
  > div { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
`
const Chip = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ active }) => active ? 'white' : 'inherit'};
  border-radius: 999px; padding: .25rem .6rem; font-size: .8rem; cursor: pointer;
  &:hover { background: ${({ theme, active }) => active ? theme.colors.primaryDark : theme.colors.hoverBg}; }
`
const Table = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px; overflow: hidden;
`
const TH = styled.div`
  display: grid; grid-template-columns: 120px repeat(48, 1fr);
  background: ${({ theme }) => theme.colors.hoverBg}; border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: .75rem;
`
const THCell = styled.div`
  padding: .25rem .35rem; text-align: center; border-right: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-right: none; }
`
const TR = styled.div`
  display: grid; grid-template-columns: 120px repeat(48, 1fr);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`
const DayCell = styled.div`
  padding: .4rem .5rem; font-weight: 600; border-right: 1px solid ${({ theme }) => theme.colors.border};
`
const TD = styled.div`
  height: 22px; border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ on, theme }) => on ? theme.colors.primary : 'transparent'};
  opacity: ${({ on }) => on ? 1 : 0.15};
  cursor: pointer;
  &:hover { opacity: ${({ on }) => on ? 0.9 : 0.35}; }
  &:last-child { border-right: none; }
`
const DayBtn = styled.button`
  border: 1.5px solid
    ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, active }) =>
    active ? theme.colors.primary : theme.colors.cardBg};
  color: ${({ theme, active }) => (active ? '#fff' : theme.colors.text)};
  border-radius: 999px;
  padding: .22rem .60rem;
  font-size: .82rem;
  line-height: 1;
  font-weight: ${({ active }) => (active ? 700 : 600)};
  letter-spacing: .02em;
  cursor: pointer;
  position: relative;
  transition: background .15s, border-color .15s, color .15s, box-shadow .15s, transform .02s;
  box-shadow: ${({ theme, active }) =>
    active ? `0 0 0 3px ${theme.colors.primary}33` : 'none'};
  &:hover {
    background: ${({ theme, active }) =>
      active ? theme.colors.primaryDark : theme.colors.hoverBg};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
  ${({ active, theme }) =>
    active ? `inset 0 -2px 0 ${theme.colors.primaryDark}` : ''};
`;
const ModalScroll = styled.div`
  max-height: 70vh;
  overflow-y: auto;
  padding-right: .25rem;
`;
const PresetHeaderActions = styled.div`
  display:flex; gap:.5rem; align-items:center; margin-bottom:.5rem;
`;

/* ---------- Botones tarjeta ---------- */
const RowInline = styled.div` display:flex; gap:.5rem; align-items:center; `
const ActionBtn = styled(Btn)` padding:.25rem .55rem; `
const DangerBtn = styled(ActionBtn)`
  border-color: #e04848; color:#fff; background:#e04848;
  &:hover { background:#c53f3f; }
`

/* ---------- Constantes / helpers ---------- */
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

const ES_DAYS = {
  Monday:'Lunes', Tuesday:'Martes', Wednesday:'Miércoles',
  Thursday:'Jueves', Friday:'Viernes', Saturday:'Sábado', Sunday:'Domingo'
}
const slots48 = Array.from({ length: 48 }, (_, i) => {
  const hh = String(Math.floor(i / 2)).padStart(2,'0');
  const mm = i % 2 === 0 ? '00' : '30';
  return `${hh}:${mm}`;
});
const rangeLabel = (startIdx, endIdx) => `${slots48[startIdx]}–${slots48[endIdx]}`
const PRESETS_KEY = 'routine_presets_v1'
const loadPresets = () => { try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]') } catch { return [] } }
const savePresets = (list) => localStorage.setItem(PRESETS_KEY, JSON.stringify(list))
function compressDayToRanges(slotsSet) {
  const arr = Array.from(slotsSet).sort((a,b)=>a-b);
  const out = []; let i = 0;
  while (i < arr.length) {
    let s = arr[i], e = s + 1;
    while (i + 1 < arr.length && arr[i+1] === e) { i++; e++; }
    out.push([s, e]); i++;
  }
  return out;
}
function idxToTime(idx) { return slots48[idx]; }
const idxOf = (t) => slots48.indexOf(t)

/* ========================================================= */

export default function Rutinas() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)

  const [routines, setRoutines] = useState([])

  // datos para crear
  const [patients, setPatients] = useState([])
  const [households, setHouseholds] = useState([])
  const [devices, setDevices] = useState([])

  // presets
  const [presets, setPresets] = useState(loadPresets())
  useEffect(() => { savePresets(presets) }, [presets])

  // modal creación
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [applyPresetId, setApplyPresetId] = useState('')

  const [form, setForm] = useState({ name: '', user_id: '', household_id: '' })

  // selección de dispositivos
  const [selectedDevices, setSelectedDevices] = useState(new Set())  // device._id
  const [roomOpen, setRoomOpen] = useState({})

  // horarios
  const [schedule, setSchedule] = useState({})
  const [editTarget, setEditTarget] = useState('ALL')
  const isMouseDown = useRef(false)
  const paintMode = useRef(null)

  // edición / borrado
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editStep, setEditStep] = useState(1)
  const [editForm, setEditForm] = useState({
    name:'', user_id:'', device_id:'', expected_start:'14:00', expected_end:'15:00', days:[]
  });
  const [deleteId, setDeleteId] = useState(null);

  // gestor de presets
  const [presetOpen, setPresetOpen] = useState(false)
  const [presetForm, setPresetForm] = useState({ name:'', start:'18:00', end:'19:00', days:[] })
  const [presetTab, setPresetTab] = useState('create')

  /* ---------- filtros / búsqueda (Toolbar) ---------- */
  const [q, setQ] = useState('')
  const [flt, setFlt] = useState({ patientId:'', day:'' })
  const [sort, setSort] = useState('recent_desc') // por defecto

  /* ---------- data fetch ---------- */
  useEffect(() => {
    setMenuOpen(window.innerWidth >= 768)
    loadInitial()
  }, [])

  async function loadInitial() {
    fetch(`${API}/routines`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setRoutines).catch(()=>{})

    fetch(`${API}/users?role=paciente`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setPatients).catch(()=>{})

    fetch(`${API}/households`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setHouseholds).catch(()=>{})

    fetch(`${API}/devices`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setDevices).catch(()=>{})
  }

  /* ---------- memos ---------- */
  const patientHousehold = useMemo(() => {
    const p = patients.find(x => x._id === form.user_id)
    if (!p?.household_id) return null
    return households.find(h => h._id === (p.household_id || '')) || null
  }, [form.user_id, patients, households])

  const devicesByRoom = useMemo(() => {
    const hhId = form.household_id || patientHousehold?._id || ''
    const list = devices.filter(d => d.household_id === hhId)
    const map = {}
    for (const d of list) {
      if (!map[d.room]) map[d.room] = []
      map[d.room].push(d)
    }
    return map
  }, [devices, form.household_id, patientHousehold])

  /* ---------- creator helpers ---------- */
  function resetCreator() {
    setStep(1)
    setForm({ name:'', user_id:'', household_id:'' })
    setSelectedDevices(new Set())
    setSchedule({})
    setEditTarget('ALL')
    setApplyPresetId('')
  }
  function openCreator() { resetCreator(); setOpen(true) }

  function toggleRoom(room) {
    setRoomOpen(prev => ({ ...prev, [room]: !prev[room] }))
  }
  function selectWholeRoom(room) {
    const list = devicesByRoom[room] || []
    const next = new Set(selectedDevices)
    for (const d of list) next.add(d._id)
    setSelectedDevices(next)
    ensureScheduleFor([...next])
  }
  function ensureScheduleFor(deviceIds) {
    setSchedule(prev => {
      const out = { ...prev }
      for (const id of deviceIds) {
        if (!out[id]) out[id] = { 0:new Set(),1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set() }
      }
      return out
    })
  }
  function toggleDevice(d) {
    const next = new Set(selectedDevices)
    if (next.has(d._id)) next.delete(d._id)
    else next.add(d._id)
    setSelectedDevices(next)
    ensureScheduleFor([...next])
  }

  // grid painting
  const targetIds = useMemo(() => {
    if (editTarget === 'ALL') return [...selectedDevices]
    return [editTarget].filter(Boolean)
  }, [editTarget, selectedDevices])

  function setCell(dayIdx, slotIdx, on) {
    setSchedule(prev => {
      const copy = { ...prev }
      for (const devId of targetIds) {
        const dev = copy[devId] || { 0:new Set(),1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set() }
        const set = new Set(dev[dayIdx] || [])
        if (on) set.add(slotIdx); else set.delete(slotIdx)
        dev[dayIdx] = set
        copy[devId] = dev
      }
      return copy
    })
  }
  function handleMouseDown(dayIdx, slotIdx, currentOn) {
    isMouseDown.current = true
    paintMode.current = currentOn ? 'off' : 'on'
    setCell(dayIdx, slotIdx, paintMode.current === 'on')
  }
  function handleMouseEnter(dayIdx, slotIdx) {
    if (!isMouseDown.current) return
    setCell(dayIdx, slotIdx, paintMode.current === 'on')
  }
  useEffect(() => {
    const up = () => { isMouseDown.current = false; paintMode.current = null }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  function clearAll() {
    setSchedule(prev => {
      const copy = { ...prev }
      for (const devId of targetIds) {
        copy[devId] = { 0:new Set(),1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set() }
      }
      return copy
    })
  }
  function fillRangeAllDays(start = '14:00', end = '15:00') {
    const sIdx = slots48.indexOf(start)
    const eIdx = slots48.indexOf(end)
    if (sIdx < 0 || eIdx < 0 || eIdx <= sIdx) return
    setSchedule(prev => {
      const copy = { ...prev }
      for (const devId of targetIds) {
        const dev = copy[devId] || { 0:new Set(),1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set() }
        for (let d = 0; d < 7; d++) {
          const set = new Set(dev[d] || [])
          for (let i = sIdx; i < eIdx; i++) set.add(i)
          dev[d] = set
        }
        copy[devId] = dev
      }
      return copy
    })
  }

  /* ---------- aplicar preset al grid ---------- */
  function applyPresetToGrid(preset) {
    if (!preset) return
    const s = idxOf(preset.start), e = idxOf(preset.end)
    if (s < 0 || e < 0) return
    const wrap = e <= s
    setSchedule(prev => {
      const copy = { ...prev }
      for (const devId of targetIds) {
        const dev = copy[devId] || { 0:new Set(),1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set() }
        for (const dayName of preset.days) {
          const dIdx = DAY_NAMES.indexOf(dayName)
          if (dIdx < 0) continue
          const setToday = new Set(dev[dIdx] || [])
          const endToday = wrap ? 48 : e
          for (let i = s; i < endToday; i++) setToday.add(i)
          dev[dIdx] = setToday
          if (wrap) {
            const next = (dIdx + 1) % 7
            const setNext = new Set(dev[next] || [])
            for (let i = 0; i < e; i++) setNext.add(i)
            dev[next] = setNext
          }
        }
        copy[devId] = dev
      }
      return copy
    })
  }

  /* ---------- guardar creadas ---------- */
  async function saveRoutine() {
    if (!form.user_id) return alert('Selecciona un paciente')
    const householdId = form.household_id || patientHousehold?._id || ''
    if (!householdId) return alert('Selecciona una casa')
    if (selectedDevices.size === 0) return alert('Selecciona al menos un dispositivo')

    const payloads = []
    for (const devId of selectedDevices) {
      const perDay = schedule[devId] || {}
      const byRange = {}
      for (let d = 0; d < 7; d++) {
        const set = perDay[d] || new Set()
        const ranges = compressDayToRanges(set)
        for (const [sIdx, eIdx] of ranges) {
          const key = `${idxToTime(sIdx)}|${idxToTime(eIdx)}`
          if (!byRange[key]) byRange[key] = []
          byRange[key].push(DAY_NAMES[d])
        }
      }
      for (const key of Object.keys(byRange)) {
        const [start, end] = key.split('|');
        payloads.push({
          name: (form.name || '').trim(),
          user_id: form.user_id,
          device_id: devId,
          expected_start: start,
          expected_end: end,
          days: byRange[key]
        });
      }
    }

    if (!payloads.length) return alert('No hay franjas horarias seleccionadas')

    try {
      for (const r of payloads) {
        const res = await fetch(`${API}/routines`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r)
        })
        if (!res.ok) {
          const err = await res.json().catch(()=>({}))
          throw new Error(err.error || 'No se pudo guardar una rutina')
        }
      }
      const res = await fetch(`${API}/routines`, { credentials:'include' })
      const data = res.ok ? await res.json() : []
      setRoutines(data)
      setOpen(false)
    } catch (e) {
      alert(e.message)
    }
  }

  /* ---------- listado helpers ---------- */
  function normalizeRef(ref, { type }) {
    if (!ref) return { id: '', name: '' };
    if (typeof ref === 'string') return { id: ref, name: '' };
    if (ref.name && typeof ref.name === 'string') return { id: ref._id || ref.id || '', name: ref.name };
    if (type === 'device' && (ref.appliance || ref.plugmodel)) {
      return { id: ref._id || ref.id || '', name: ref.appliance || ref.plugmodel };
    }
    return { id: ref._id || ref.id || '', name: '' };
  }
  function getPatientName(userRef) {
    const { id, name } = normalizeRef(userRef, { type: 'user' });
    if (name) return name;
    const p = patients.find(u => (u._id?.toString?.() ?? u._id) === id);
    return p?.name || id || '—';
  }
  function getDeviceMeta(deviceRef, devs = devices, hhs = households) {
    const norm = normalizeRef(deviceRef, { type: 'device' });
    const d = devs.find(x => (x?._id?.toString?.() ?? x?._id) === norm.id);
    const isObj = deviceRef !== null && typeof deviceRef === 'object';
    const dispName = norm.name || d?.appliance || d?.plugmodel || norm.id || 'Dispositivo';
    const room     = d?.room || (isObj ? deviceRef.room : '') || '';
    const hhIdRaw  = d?.household_id || (isObj ? deviceRef.household_id : '') || '';
    const hhId     = hhIdRaw?.toString?.() ?? hhIdRaw;
    const home     = hhs.find(h => (h?._id?.toString?.() ?? h?._id) === hhId)?.name || '';
    return { name: dispName, room, home };
  }

  /* ---------- LISTA: búsqueda + filtros + orden ---------- */

  // Opciones de filtros
  const patientOptions = useMemo(() => ([
    { value: '', label: 'Todos' },
    ...patients.map(p => ({ value: p._id, label: p.name || p._id }))
  ]), [patients])

  const dayOptions = useMemo(() => ([
    { value: '', label: 'Todos' },
    ...DAY_NAMES.map(d => ({ value: d, label: ES_DAYS[d] }))
  ]), [])

  const sortOptions = [
    { value: 'recent_desc', label: 'Más recientes' },
    { value: 'recent_asc',  label: 'Más antiguas' },
    { value: 'start_time',  label: 'Hora (inicio)' },
    { value: 'alpha',       label: 'Paciente / Nombre' },
  ]

  // Resultado filtrado y ordenado
  const filteredSorted = useMemo(() => {
    const qnorm = q.trim().toLowerCase()
    let arr = [...routines]

    // filtro por paciente
    if (flt.patientId) {
      arr = arr.filter(r => {
        const id = typeof r.user_id === 'object' ? r.user_id?._id : r.user_id
        return String(id) === String(flt.patientId)
      })
    }

    // filtro por día de la semana
    if (flt.day) {
      arr = arr.filter(r => Array.isArray(r.days) && r.days.includes(flt.day))
    }

    // filtro por búsqueda libre
    if (qnorm) {
      arr = arr.filter(r => {
        const patient = getPatientName(r.user_id)?.toLowerCase?.() || ''
        const devMeta = getDeviceMeta(r.device_id)
        const dev = (devMeta.name || '').toLowerCase()
        const room = (devMeta.room || '').toLowerCase()
        const home = (devMeta.home || '').toLowerCase()
        const name = (r.name || '').toLowerCase()
        const hours = `${r.expected_start || ''} ${r.expected_end || ''}`.toLowerCase()
        return [patient, dev, room, home, name, hours].some(t => t.includes(qnorm))
      })
    }

    // orden
    if (sort === 'recent_desc' || sort === 'recent_asc') {
      arr.sort((a,b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return sort === 'recent_desc' ? (tb - ta) : (ta - tb)
      })
    } else if (sort === 'start_time') {
      arr.sort((a,b) => String(a.expected_start || '').localeCompare(String(b.expected_start || '')))
    } else { // alpha
      arr.sort((a,b) => {
        const ap = getPatientName(a.user_id)
        const bp = getPatientName(b.user_id)
        const c1 = ap.localeCompare(bp)
        if (c1 !== 0) return c1
        const ad = (a.name || getDeviceMeta(a.device_id).name || '')
        const bd = (b.name || getDeviceMeta(b.device_id).name || '')
        return ad.localeCompare(bd)
      })
    }

    return arr
  }, [q, flt, sort, routines, patients, devices, households])

  /* ---------- edición ---------- */
  const HALF_HOURS = slots48

  function openEditModal(r) {
    setEditId(r._id);
    setEditForm({
      name: r.name || '',
      user_id: (typeof r.user_id === 'object' ? r.user_id?._id : r.user_id) || '',
      device_id: (typeof r.device_id === 'object' ? r.device_id?._id : r.device_id) || '',
      expected_start: r.expected_start || '14:00',
      expected_end:   r.expected_end   || '15:00',
      days: Array.isArray(r.days) ? [...r.days] : []
    });
    setEditStep(1)
    setEditOpen(true);
  }
  function toggleEditDay(backendDayName) {
    setEditForm(f => {
      const s = new Set(f.days);
      if (s.has(backendDayName)) s.delete(backendDayName);
      else s.add(backendDayName);
      return { ...f, days: Array.from(s) };
    });
  }
  const editPatientHouse = useMemo(() => {
    const p = patients.find(u => u._id === editForm.user_id);
    if (!p?.household_id) return null;
    return households.find(h => h._id === p.household_id) || null;
  }, [editForm.user_id, patients, households]);
  const devicesForEdit = useMemo(() => {
    if (!editPatientHouse) return devices;
    return devices.filter(d => d.household_id === editPatientHouse._id);
  }, [devices, editPatientHouse]);

  const minutesBetween = (a,b) => (idxOf(b) - idxOf(a) + (idxOf(b) <= idxOf(a) ? 48 : 0)) * 30
  const endOptionsFor = (start) => {
    const startIdx = idxOf(start)
    if (startIdx < 0) return []
    const opts = []
    for (let i = 1; i <= 48; i++) {
      const idx = (startIdx + i) % 48
      const label = `${slots48[idx]}${i<=48 && idx<=startIdx ? ' (+1 día)' : ''}`
      opts.push({ value: slots48[idx], label })
      if (i === 48) break
    }
    return opts
  }

  async function saveEdit() {
    try {
      if (!editId) return;
      const payload = {
        name: (editForm.name || '').trim(),
        user_id: editForm.user_id,
        device_id: editForm.device_id,
        expected_start: editForm.expected_start,
        expected_end: editForm.expected_end,
        days: editForm.days
      };
      const res = await fetch(`${API}/routines/${editId}`, {
        method:'PUT',
        credentials:'include',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || 'No se pudo editar la rutina');
      }
      const r = await fetch(`${API}/routines`, { credentials:'include' });
      setRoutines(r.ok ? await r.json() : []);
      setEditOpen(false);
      setEditId(null);
    } catch (e) {
      alert(e.message);
    }
  }

  function openDeleteModal(id) { setDeleteId(id); setDeleteOpen(true); }
  async function confirmDelete() {
    try {
      if (!deleteId) return;
      const res = await fetch(`${API}/routines/${deleteId}`, {
        method:'DELETE',
        credentials:'include'
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || 'No se pudo borrar la rutina');
      }
      const r = await fetch(`${API}/routines`, { credentials:'include' });
      setRoutines(r.ok ? await r.json() : []);
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (e) {
      alert(e.message);
    }
  }

  /* ---------- gestor de presets (modal aparte) ---------- */
  const togglePresetDay = (d) =>
    setPresetForm(f => {
      const s = new Set(f.days); s.has(d) ? s.delete(d) : s.add(d);
      return { ...f, days: Array.from(s) }
    })
  const addPreset = () => {
    const { name, start, end, days } = presetForm
    if (!name.trim() || !days.length || idxOf(start) < 0 || idxOf(end) < 0)
      return alert('Completa nombre, días e inicio/fin')
    if (minutesBetween(start, end) < 30) return alert('El fin debe ser al menos +30 min')
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    setPresets(p => [...p, { id, name: name.trim(), start, end, days }])
    setPresetForm({ name:'', start:'18:00', end:'19:00', days:[] })
  }
  const deletePreset = (id) => setPresets(p => p.filter(x => x.id !== id))

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={() => { logout(); navigate('/login') }} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <Toolbar>
            <h1>Rutinas</h1>
            <div>
              <OutlineBtn variant="primary" onClick={()=>{ setPresetTab('list'); setPresetOpen(true); }}>
                Ver presets
              </OutlineBtn>
              <NewButton onClick={openCreator}>+ Añadir rutina</NewButton>
            </div>
          </Toolbar>

          {/* ---------- BARRA DE BÚSQUEDA / FILTROS ---------- */}
          <div style={{ marginBottom: '1rem' }}>
            <SearchToolbar
              query={q}
              onQueryChange={setQ}
              placeholder="Buscar por nombre, paciente, dispositivo, sala o casa"
              filters={[
                { type:'select', key:'patientId', label:'Paciente', options: patientOptions },
                { type:'select', key:'day',       label:'Día',      options: dayOptions },
              ]}
              values={flt}
              onValuesChange={setFlt}
              sortOptions={sortOptions}
              sort={sort}
              onSortChange={setSort}
              onClear={() => { setQ(''); setFlt({ patientId:'', day:'' }); setSort('recent_desc'); }}
            />
          </div>

          {/* ----- LISTADO ----- */}
          <List>
            {filteredSorted.map(r => {
              const patient = getPatientName(r.user_id)
              const meta = getDeviceMeta(r.device_id)
              const daysPretty = (r.days || []).map(d => ES_DAYS[d] || d)
              return (
                <RoutineCard key={r._id}>
                  <CardTop>
                    <CardTitle>{r.name || `Rutina ${String(r._id).slice(-6)}`}</CardTitle>
                    <RowInline>
                      <ActionBtn variant="primary" onClick={() => openEditModal(r)}>✎ Editar</ActionBtn>
                      <DangerBtn onClick={() => openDeleteModal(r._id)}>🗑 Borrar</DangerBtn>
                      <TimePill>
                        {(r.expected_start||'').replace(':','\:')}–{(r.expected_end||'').replace(':','\:')}
                      </TimePill>
                    </RowInline>
                  </CardTop>

                  <Meta>
                    Paciente: <strong>{patient}</strong>{' · '}
                    Dispositivo: <strong>{meta.name}</strong>
                    {meta.room ? ` — ${meta.room}` : ''}{meta.home ? ` / ${meta.home}` : ''}
                  </Meta>

                  {!!daysPretty.length && (
                    <TagRow>
                      {daysPretty.map(d => (<Tag key={d}>{d}</Tag>))}
                    </TagRow>
                  )}
                </RoutineCard>
              )
            })}
            {!filteredSorted.length && <Muted>No hay rutinas que coincidan con el filtro.</Muted>}
          </List>
        </Main>
      </Body>
      <Footer />

      {/* ---------------- MODAL CREAR RUTINA ---------------- */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2>Crear rutina</h2>
        <Stepper>
          <Step active={step===1}>1 · Selección</Step>
          <Step active={step===2}>2 · Dispositivos</Step>
          <Step active={step===3}>3 · Horarios</Step>
          <Step active={step===4}>4 · Resumen</Step>
        </Stepper>

        {step === 1 && (
          <>
            <FormGroup>
              <label>Nombre de la rutina (opcional)</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="p.ej. Comida"
              />
            </FormGroup>
            <FormGroup>
              <label>Paciente</label>
              <select
                value={form.user_id}
                onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
              >
                <option value="">— Selecciona —</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </FormGroup>
            <FormGroup>
              <label>Casa</label>
              <select
                value={form.household_id || (patientHousehold?._id || '')}
                onChange={e => setForm(f => ({ ...f, household_id: e.target.value }))}
                disabled={!households.length}
              >
                <option value="">— Selecciona —</option>
                {households.map(h => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
              {patientHousehold && !form.household_id && (
                <Small>Se ha preseleccionado la casa del paciente.</Small>
              )}
            </FormGroup>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem' }}>
              <Btn onClick={() => setOpen(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={() => setStep(2)} disabled={!form.user_id || !(form.household_id || patientHousehold?._id)}>Siguiente</Btn>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Grid>
              <Card>
                <strong>Habitaciones</strong>
                <div style={{ marginTop:'.5rem' }}>
                  {Object.keys(devicesByRoom).length === 0 && (
                    <Small>No hay dispositivos para la casa seleccionada.</Small>
                  )}
                  {Object.entries(devicesByRoom).map(([room, list]) => (
                    <div key={room} style={{ marginBottom: '.35rem' }}>
                      <Room onClick={() => toggleRoom(room)}>
                        <span>{room}</span>
                        <div style={{ display:'flex', gap:'.35rem', alignItems:'center' }}>
                          <Small>{list.length} disp.</Small>
                          <Btn onClick={(e)=>{ e.stopPropagation(); selectWholeRoom(room) }}>Seleccionar sala</Btn>
                        </div>
                      </Room>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <strong>Dispositivos</strong>
                <div style={{ marginTop:'.5rem' }}>
                  {Object.entries(devicesByRoom).map(([room, list]) => (
                    <div key={room} style={{ marginBottom:'.5rem' }}>
                      <div style={{ opacity:.75, fontWeight:600, marginBottom:'.25rem' }}>{room}</div>
                      {list.map(d => (
                        <DeviceRow key={d._id}>
                          <input
                            type="checkbox"
                            checked={selectedDevices.has(d._id)}
                            onChange={() => toggleDevice(d)}
                          />
                          <span>{d.appliance} <Small>({d.plugmodel})</Small></span>
                        </DeviceRow>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </Grid>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'.75rem' }}>
              <Small>Seleccionados: {selectedDevices.size}</Small>
              <div style={{ display:'flex', gap:'.5rem' }}>
                <Btn onClick={() => setStep(1)}>Atrás</Btn>
                <Btn variant="primary" onClick={() => { if(selectedDevices.size) { ensureScheduleFor([...selectedDevices]); setStep(3) } }} disabled={!selectedDevices.size}>Siguiente</Btn>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <ScheduleToolbar>
              <div>
                <strong>Editar</strong>
                <select value={editTarget} onChange={e => setEditTarget(e.target.value)}>
                  <option value="ALL">Todos los seleccionados</option>
                  {[...selectedDevices].map(id => {
                    const d = devices.find(x => x._id === id)
                    return <option key={id} value={id}>{d?.appliance || id}</option>
                  })}
                </select>
                <Chip onClick={clearAll}>Limpiar</Chip>
                <Chip onClick={() => fillRangeAllDays('14:00','15:00')}>Rápido 14:00–15:00</Chip>
              </div>
              <Small>actual: {editTarget === 'ALL' ? `Todos (${selectedDevices.size})` : '1'}</Small>
            </ScheduleToolbar>

            {/* Presets: aplicar rápido */}
            <Card style={{ marginBottom: '.75rem' }}>
              <strong>Usar preset</strong>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'center', marginTop:'.5rem', flexWrap:'wrap' }}>
                <select style={{ minWidth: 260 }} value={applyPresetId} onChange={e=>setApplyPresetId(e.target.value)}>
                  <option value="">— Selecciona un preset —</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.start}–{p.end}, {p.days.map(d=>ES_DAYS[d]).join(', ')})
                    </option>
                  ))}
                </select>
                <Btn variant="primary" onClick={() => applyPresetToGrid(presets.find(p=>p.id===applyPresetId))} disabled={!applyPresetId}>Aplicar al grid</Btn>
                <Small>¿No ves el tuyo? Usa “+ Añadir preset” arriba.</Small>
              </div>
            </Card>

            <Table>
              <TH>
                <THCell> </THCell>
                {slots48.map((t, i) => (<THCell key={i}>{t}</THCell>))}
              </TH>
              {DAY_SHORT.map((label, dIdx) => (
                <TR key={dIdx}>
                  <DayCell>{label}</DayCell>
                  {slots48.map((_, sIdx) => {
                    let on = false
                    const targets = editTarget === 'ALL' ? [...selectedDevices] : [editTarget]
                    if (targets.length > 0) {
                      on = targets.every(id => (schedule[id]?.[dIdx] || new Set()).has(sIdx))
                    }
                    return (
                      <TD
                        key={sIdx}
                        on={on}
                        onMouseDown={() => handleMouseDown(dIdx, sIdx, on)}
                        onMouseEnter={() => handleMouseEnter(dIdx, sIdx)}
                      />
                    )
                  })}
                </TR>
              ))}
            </Table>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem', marginTop:'.75rem' }}>
              <Btn onClick={() => setStep(2)}>Atrás</Btn>
              <Btn variant="primary" onClick={() => setStep(4)}>Siguiente</Btn>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ marginBottom: '.75rem' }}>
              <strong>Resumen</strong>
              <div style={{ marginTop: '.5rem' }}>
                <div><Small>Nombre:</Small> {form.name || <em>(sin nombre)</em>}</div>
                <div><Small>Paciente:</Small> {patients.find(p => p._id === form.user_id)?.name || form.user_id}</div>
                <div><Small>Casa:</Small> {households.find(h => h._id === (form.household_id || patientHousehold?._id))?.name || '(ninguna)'}</div>
                <div style={{ marginTop: '.5rem' }}>
                  <Small>Dispositivos:</Small>
                  <ul style={{ margin: '.35rem 0 0 .85rem' }}>
                    {[...selectedDevices].map(id => {
                      const d = devices.find(x => x._id === id)
                      const perDay = schedule[id] || {}
                      const example = (() => {
                        for (let d = 0; d < 7; d++) {
                          const sets = perDay[d]
                          if (sets && sets.size) {
                            const r = compressDayToRanges(sets)[0]
                            if (r) return rangeLabel(r[0], r[1])
                          }
                        }
                        return '—'
                      })()
                      return <li key={id}>{d?.appliance || id} <Small>({example}…)</Small></li>
                    })}
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Btn onClick={() => setStep(3)}>Atrás</Btn>
              <div style={{ display:'flex', gap:'.5rem' }}>
                <Btn onClick={() => setOpen(false)}>Cancelar</Btn>
                <Btn variant="primary" onClick={saveRoutine}>Guardar</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ---------- MODAL EDITAR (4 pasos) ---------- */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)}>
        <h2>Editar rutina</h2>
        <Stepper>
          <Step active={editStep===1}>1 · Selección</Step>
          <Step active={editStep===2}>2 · Dispositivo</Step>
          <Step active={editStep===3}>3 · Horario</Step>
          <Step active={editStep===4}>4 · Resumen</Step>
        </Stepper>

        {editStep === 1 && (
          <>
            <FormGroup>
              <label>Nombre (opcional)</label>
              <input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="p.ej. Comida"
              />
            </FormGroup>

            <FormGroup>
              <label>Paciente</label>
              <select
                value={editForm.user_id}
                onChange={e => setEditForm(f => ({ ...f, user_id: e.target.value, device_id:'' }))}
              >
                <option value="">— Selecciona —</option>
                {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {editPatientHouse && <Small>Casa: {editPatientHouse.name}</Small>}
            </FormGroup>

            <div style={{display:'flex', justifyContent:'flex-end', gap:'.5rem'}}>
              <Btn onClick={() => setEditOpen(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={() => setEditStep(2)} disabled={!editForm.user_id}>Siguiente</Btn>
            </div>
          </>
        )}

        {editStep === 2 && (
          <>
            <FormGroup>
              <label>Dispositivo</label>
              <select
                value={editForm.device_id}
                onChange={e => setEditForm(f => ({ ...f, device_id: e.target.value }))}
              >
                <option value="">— Selecciona —</option>
                {devicesForEdit.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.appliance || d.plugmodel} {d.room ? `— ${d.room}` : ''}
                  </option>
                ))}
              </select>
            </FormGroup>

            <div style={{display:'flex', justifyContent:'space-between', gap:'.5rem'}}>
              <Btn onClick={() => setEditStep(1)}>Atrás</Btn>
              <Btn variant="primary" onClick={() => setEditStep(3)} disabled={!editForm.device_id}>Siguiente</Btn>
            </div>
          </>
        )}

        {editStep === 3 && (
          <>
            {/* Usar preset para rellenar horario+días */}
            <Card style={{ marginBottom: '.75rem' }}>
              <strong>Usar preset</strong>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'center', marginTop:'.5rem', flexWrap:'wrap' }}>
                <select
                  style={{ minWidth: 260 }}
                  onChange={(e)=> {
                    const p = presets.find(x => x.id === e.target.value)
                    if (!p) return
                    // adapta fin según restricción
                    const ends = endOptionsFor(p.start)
                    const valid = ends.some(o => o.value === p.end)
                    setEditForm(f => ({
                      ...f,
                      expected_start: p.start,
                      expected_end: valid ? p.end : (ends[0]?.value || f.expected_end),
                      days: [...p.days]
                    }))
                  }}
                >
                  <option value="">— Selecciona un preset —</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.start}–{p.end}, {p.days.map(d=>ES_DAYS[d]).join(', ')})
                    </option>
                  ))}
                </select>
                <Small>Gestiona presets con “+ Añadir preset”.</Small>
              </div>
            </Card>

            <FormGroup>
              <label>Horario</label>
              <RowInline>
                <select
                  value={editForm.expected_start}
                  onChange={e => {
                    const start = e.target.value;
                    const ends = endOptionsFor(start);
                    const valid = ends.some(o => o.value === editForm.expected_end);
                    setEditForm(f => ({ ...f, expected_start: start, expected_end: valid ? f.expected_end : (ends[0]?.value || f.expected_end) }));
                  }}
                >
                  {slots48.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span>—</span>
                <select
                  value={editForm.expected_end}
                  onChange={e => setEditForm(f => ({ ...f, expected_end: e.target.value }))}
                >
                  {endOptionsFor(editForm.expected_start).map(opt => (
                    <option key={`${opt.value}-${opt.label}`} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </RowInline>
              <Small>El fin debe ser ≥ +30 min y ≤ el mismo horario del día siguiente.</Small>
            </FormGroup>

            <FormGroup>
              <label>Días</label>
              <TagRow>
                {DAY_NAMES.map((d, idx) => (
                  <Chip
                    key={d}
                    active={editForm.days.includes(d)}
                    onClick={() => toggleEditDay(d)}
                    title={ES_DAYS[d]}
                  >
                    {DAY_SHORT[idx]}
                  </Chip>
                ))}
              </TagRow>
            </FormGroup>

            <div style={{display:'flex', justifyContent:'space-between', gap:'.5rem'}}>
              <Btn onClick={() => setEditStep(2)}>Atrás</Btn>
              <Btn variant="primary" onClick={() => setEditStep(4)} disabled={!editForm.days.length}>Siguiente</Btn>
            </div>
          </>
        )}

        {editStep === 4 && (
          <>
            <div style={{ marginBottom: '.75rem' }}>
              <strong>Resumen</strong>
              <div style={{ marginTop: '.5rem' }}>
                <div><Small>Nombre:</Small> {editForm.name || <em>(sin nombre)</em>}</div>
                <div><Small>Paciente:</Small> {getPatientName(editForm.user_id)}</div>
                <div><Small>Dispositivo:</Small> {getDeviceMeta(editForm.device_id, devices, households).name}</div>
                <div><Small>Horario:</Small> {editForm.expected_start} — {editForm.expected_end}{idxOf(editForm.expected_end) <= idxOf(editForm.expected_start) ? ' (+1)' : ''}</div>
                <div style={{ marginTop: '.35rem' }}>
                  <Small>Días:</Small>{' '}
                  {editForm.days.map(d => ES_DAYS[d]).join(', ')}
                </div>
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', gap:'.5rem'}}>
              <Btn onClick={() => setEditStep(3)}>Atrás</Btn>
              <div style={{display:'flex', gap:'.5rem'}}>
                <Btn onClick={() => setEditOpen(false)}>Cancelar</Btn>
                <Btn
                  variant="primary"
                  onClick={saveEdit}
                  disabled={!editForm.user_id || !editForm.device_id || !editForm.expected_start || !editForm.expected_end || !editForm.days.length}
                >
                  Guardar cambios
                </Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ---------- MODAL PRESET ---------- */}
      <Modal isOpen={presetOpen} onClose={() => setPresetOpen(false)}>
        <h2>Presets de horario</h2>

        <PresetHeaderActions>
          <Chip active={presetTab==='create'} onClick={()=>setPresetTab('create')}>Nuevo preset</Chip>
          <Chip active={presetTab==='list'} onClick={()=>setPresetTab('list')}>Mis presets</Chip>
        </PresetHeaderActions>

        <ModalScroll>
          {presetTab === 'create' && (
            <>
              <Card style={{ marginBottom: '.75rem' }}>
                <strong>Nuevo preset</strong>

                <FormGroup style={{ marginTop: '.5rem' }}>
                  <label>Nombre</label>
                  <input
                    value={presetForm.name}
                    onChange={e => setPresetForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="p.ej. Deporte"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Inicio / Fin</label>
                  <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                    <select
                      value={presetForm.start}
                      onChange={e => {
                        const start = e.target.value
                        const ends = endOptionsFor(start)
                        const valid = ends.some(o => o.value === presetForm.end)
                        setPresetForm(f => ({ ...f, start, end: valid ? f.end : (ends[0]?.value || f.end) }))
                      }}
                    >
                      {slots48.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span>—</span>
                    <select
                      value={presetForm.end}
                      onChange={e => setPresetForm(f => ({ ...f, end: e.target.value }))}
                    >
                      {endOptionsFor(presetForm.start).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Small>El fin debe ser ≥ +30 min y ≤ el mismo horario del día siguiente.</Small>
                </FormGroup>

                <FormGroup>
                  <label>Días</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'.35rem',marginTop:'.25rem'}}>
                    {DAY_NAMES.map((d, idx) => (
                      <DayBtn
                        key={d}
                        $active={presetForm.days.includes(d)}
                        onClick={() =>
                          setPresetForm(f => {
                            const s = new Set(f.days);
                            s.has(d) ? s.delete(d) : s.add(d);
                            return { ...f, days: Array.from(s) };
                          })
                        }
                      >
                        {DAY_SHORT[idx]}
                      </DayBtn>
                    ))}
                  </div>
                </FormGroup>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <Btn variant="primary" onClick={addPreset}>Guardar preset</Btn>
                </div>
              </Card>
            </>
          )}

          {presetTab === 'list' && (
            <Card>
              <strong>Mis presets</strong>
              <div style={{ marginTop: '.5rem' }}>
                {presets.length === 0 && <Muted>Aún no has creado presets.</Muted>}
                {presets.map(p => (
                  <div
                    key={p.id}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      padding:'.35rem .5rem',
                      border:'1px solid var(--border)',
                      borderRadius:6,
                      marginBottom:'.35rem'
                    }}
                  >
                    <div>
                      <strong>{p.name}</strong>{' '}
                      <Small>({p.start}–{p.end}, {p.days.map(d=>ES_DAYS[d]).join(', ')})</Small>
                    </div>
                    <DangerBtn onClick={()=>deletePreset(p.id)}>Borrar</DangerBtn>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </ModalScroll>
      </Modal>
      
      {/* ---------- MODAL BORRAR ---------- */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <h2>Eliminar rutina</h2>
        <p>¿Seguro que quieres borrar esta rutina? Esta acción no se puede deshacer.</p>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem', marginTop:'.75rem' }}>
          <Btn variant="primary" onClick={() => setDeleteOpen(false)}>Cancelar</Btn>
          <DangerBtn onClick={confirmDelete}>Borrar</DangerBtn>
        </div>
      </Modal>
    </AppContainer>
  )
}
