import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header  from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer  from '../components/Footer.jsx'
import Modal, { FormGroup } from '../components/Modal.jsx'

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

/* ---------- Listado ---------- */
const List = styled.ul`
  list-style: none; padding: 0; margin: 0;
`

/* Tarjeta bonita para cada rutina */
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

/* ---------- Tipografías secundarias ---------- */
const Title = styled.strong`
  font-size: 1rem; color: ${({ theme }) => theme.colors.text};
`
const Muted = styled.div`
  color: ${({ theme }) => theme.colors.text}; opacity: .8; font-size: .9rem;
  margin-top: .25rem;
`

/* ---------- Paso a paso del modal ---------- */
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

/* ---------- Selector de habitaciones/dispositivos ---------- */
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
const Small = styled.small`
  opacity: .75;
`
const DeviceRow = styled.label`
  display: flex; align-items: center; gap: .5rem;
  padding: .35rem .45rem; border-radius: 6px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
`

/* ---------- Grid de horarios 7×48 ---------- */
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

/* ---------- Helpers ---------- */
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] // backend enum
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

function compressDayToRanges(slotsSet) {
  const arr = Array.from(slotsSet).sort((a,b)=>a-b);
  const out = [];
  let i = 0;
  while (i < arr.length) {
    let s = arr[i], e = s + 1; // e exclusivo
    while (i + 1 < arr.length && arr[i+1] === e) { i++; e++; }
    out.push([s, e]);
    i++;
  }
  return out;
}
function idxToTime(idx) { return slots48[idx]; }

/* ========================================================= */

export default function Rutinas() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)

  const [routines, setRoutines] = useState([])

  // datos para crear/rotular
  const [patients, setPatients] = useState([])
  const [households, setHouseholds] = useState([])
  const [devices, setDevices] = useState([])

  // modal creación
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    name: '',
    user_id: '',
    household_id: '',
  })

  // selección de dispositivos
  const [selectedDevices, setSelectedDevices] = useState(new Set())  // device._id
  const [roomOpen, setRoomOpen] = useState({}) // expand/collapse rooms

  // horarios: por dispositivo, dayIndex -> Set(slotIdx)
  const [schedule, setSchedule] = useState({ /* deviceId: { 0:Set,1:Set,...6:Set } */ })
  const [editTarget, setEditTarget] = useState('ALL') // 'ALL' o deviceId
  const isMouseDown = useRef(false)
  const paintMode = useRef(null) // 'on'|'off'

  useEffect(() => {
    setMenuOpen(window.innerWidth >= 768)
    loadInitial()
  }, [])

  async function loadInitial() {
    // rutinas existentes
    fetch(`${API}/routines`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setRoutines)
      .catch(()=>{})

    // pacientes
    fetch(`${API}/users?role=paciente`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setPatients)
      .catch(()=>{})

    // hogares
    fetch(`${API}/households`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setHouseholds)
      .catch(()=>{})

    // dispositivos
    fetch(`${API}/devices`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setDevices)
      .catch(()=>{})
  }

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

  function resetCreator() {
    setStep(1)
    setForm({ name:'', user_id:'', household_id:'' })
    setSelectedDevices(new Set())
    setSchedule({})
    setEditTarget('ALL')
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

  // Horarios (grid)
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

  // Guardar → crea múltiples documentos Routine
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
          // 👇 añade el nombre de la rutina (opcional)
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

  const selectedCount = selectedDevices.size
  const currentEditLabel = editTarget === 'ALL' ? `Todos (${selectedCount})` : `1 dispositivo`

  // ---------- Helpers de presentación del listado ----------
  function normalizeRef(ref, { type }) {
    if (!ref) return { id: '', name: '' };
    if (typeof ref === 'string') return { id: ref, name: '' };
    // si ya viene populado:
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

  function getDeviceMeta(deviceRef, devices = [], households = []) {
    const norm = normalizeRef(deviceRef, { type: 'device' });
    const d = devices.find(x => (x?._id?.toString?.() ?? x?._id) === norm.id);

    // ojo: null también es "object" en JS -> comprueba explícitamente
    const isObj = deviceRef !== null && typeof deviceRef === 'object';

    const dispName = norm.name || d?.appliance || d?.plugmodel || norm.id || 'Dispositivo';
    const room     = d?.room || (isObj ? deviceRef.room : '') || '';
    const hhIdRaw  = d?.household_id || (isObj ? deviceRef.household_id : '') || '';
    const hhId     = hhIdRaw?.toString?.() ?? hhIdRaw;
    const home     = households.find(h => (h?._id?.toString?.() ?? h?._id) === hhId)?.name || '';

    return { name: dispName, room, home };
  }

  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a,b) => {
      const au = getPatientName(a.user_id).localeCompare(getPatientName(b.user_id));
      if (au !== 0) return au;
      const ad = getDeviceMeta(a.device_id).name.localeCompare(getDeviceMeta(b.device_id).name);
      if (ad !== 0) return ad;
      return (a.expected_start||'').localeCompare(b.expected_start||'');
    });
  }, [routines, patients, devices, households]);

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={() => { logout(); navigate('/login') }} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
            <Toolbar>
              <h1>Rutinas</h1>
              <NewButton onClick={openCreator}>+ Añadir rutina</NewButton>
            </Toolbar>

            {/* ----- LISTADO BONITO ----- */}
            <List>
              {sortedRoutines.map(r => {
                const patient = getPatientName(r.user_id)
                const meta = getDeviceMeta(r.device_id)
                const daysPretty = (r.days || []).map(d => ES_DAYS[d] || d)
                return (
                  <RoutineCard key={r._id}>
                    <CardTop>
                      <CardTitle>{r.name || `Rutina ${String(r._id).slice(-6)}`}</CardTitle>
                      <TimePill>{(r.expected_start||'').replace(':', '\:')}–{(r.expected_end||'').replace(':','\:')}</TimePill>
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
              {!sortedRoutines.length && <Muted>No hay rutinas todavía.</Muted>}
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
                <select
                  value={editTarget}
                  onChange={e => setEditTarget(e.target.value)}
                >
                  <option value="ALL">Todos los seleccionados</option>
                  {[...selectedDevices].map(id => {
                    const d = devices.find(x => x._id === id)
                    return <option key={id} value={id}>{d?.appliance || id}</option>
                  })}
                </select>
                <Chip onClick={clearAll}>Limpiar</Chip>
                <Chip onClick={() => fillRangeAllDays('14:00','15:00')}>Rango rápido 14:00–15:00</Chip>
              </div>
              <Small>Objetivo actual: {currentEditLabel}</Small>
            </ScheduleToolbar>

            <Table>
              <TH>
                <THCell> </THCell>
                {slots48.map((t, i) => (
                  <THCell key={i}>{t}</THCell>
                ))}
              </TH>
              {DAY_SHORT.map((label, dIdx) => (
                <TR key={dIdx}>
                  <DayCell>{label}</DayCell>
                  {slots48.map((_, sIdx) => {
                    let on = false
                    if (targetIds.length > 0) {
                      on = targetIds.every(id => (schedule[id]?.[dIdx] || new Set()).has(sIdx))
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
    </AppContainer>
  )
}
