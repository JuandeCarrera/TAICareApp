// src/pages/Rutinas.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header  from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer  from '../components/Footer.jsx'
import Modal, { FormGroup } from '../components/Modal.jsx'
import SearchToolbar from '../components/SearchToolbar.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/* ---------- Layout base ---------- */
const AppContainer = styled.div`display:flex; flex-direction:column; height:100vh; width:100vw;`
const Body = styled.div` flex:1; display:flex; overflow:hidden; `
const Main = styled.main` flex:1; background:${({theme})=>theme.colors.bg}; padding:2rem; overflow:auto;`
const Toolbar = styled.div`
  display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;
  > div { display:flex; gap:.5rem; align-items:center; }
`
const Btn = styled.button`
  font-size:.85rem; padding:.35rem .7rem; border-radius:6px; cursor:pointer;
  border:1px solid ${({theme,variant})=>variant==='primary'?theme.colors.primary:theme.colors.border};
  background:${({theme,variant})=>variant==='primary'?theme.colors.primary:theme.colors.cardBg};
  color:${({theme,variant})=>variant==='primary'?'#fff':theme.colors.text};
  transition:background .2s;
  &:hover{ background:${({theme,variant})=>variant==='primary'?theme.colors.primaryDark:theme.colors.hoverBg}; }
`
const NewButton = styled(Btn).attrs({variant:'primary'})``

/* ---------- Listado ---------- */
const List = styled.ul` list-style:none; margin:0; padding:0; `
const RoutineCard = styled.li`
  background:${({theme})=>theme.colors.cardBg};
  border:1px solid ${({theme})=>theme.colors.border};
  border-radius:10px; padding:14px 16px; &+&{margin-top:12px;}
`
const CardTop = styled.div` display:flex; align-items:center; justify-content:space-between; gap:.75rem; `
const CardTitle = styled.div` font-weight:700; font-size:1.05rem; color:${({theme})=>theme.colors.text}; `
const TimePill = styled.span`
  padding:.2rem .55rem; border:1px solid ${({theme})=>theme.colors.primary};
  color:#fff; background:${({theme})=>theme.colors.primary}; border-radius:999px; font-size:.85rem; white-space:nowrap;
`
const Meta = styled.div` margin-top:.4rem; opacity:.9; color:${({theme})=>theme.colors.text}; font-size:.9rem; `
const TagRow = styled.div` display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.6rem; `
const Tag = styled.span`
  padding:.15rem .5rem; border-radius:999px; border:1px solid ${({theme})=>theme.colors.border};
  background:${({theme})=>theme.colors.hoverBg}; font-size:.8rem; opacity:.9;
`
const Muted = styled.div` color:${({theme})=>theme.colors.text}; opacity:.8; font-size:.9rem; margin-top:.25rem; `

/* ---------- Wizard Modal ---------- */
const Wizard = styled.div` max-width: 960px; width: 100%; margin: 0 auto; box-sizing: border-box;`
const ModalBody = styled.div`
  display:flex; flex-direction:column; gap:.75rem; width:100%; max-height:min(88vh, 900px);
`
const ModalHeader = styled.div` position:sticky; top:0; z-index:1; background:${({theme})=>theme.colors.cardBg}; padding-bottom:.25rem;`
const ModalContent = styled.div` flex:1; overflow:auto; padding-right:.25rem; min-height:0; `
const StepFooter = styled.div` display:flex; justify-content:flex-end; align-items:center; gap:.5rem; margin-top:.75rem; `
const StepSub = styled.div` opacity:.9; font-size:.9rem; `
const StepBadge = styled.div`
  display:inline-flex; align-items:center; justify-content:center;
  padding:.55rem .8rem; border-radius:10px;
  border:1px solid ${({theme})=>theme.colors.border};
  background:${({theme})=>theme.colors.primary}; color:#fff; font-weight:700;
`
const Progress = styled.div`
  height:6px; border-radius:999px; background:${({theme})=>theme.colors.hoverBg};
  overflow:hidden; border:1px solid ${({theme})=>theme.colors.border};
`
const ProgressFill = styled.div` height:100%; background:${({theme})=>theme.colors.primary}; width:0%; transition:width .25s ease;`
const CompactHeader = styled.div` display:grid; grid-template-columns:1fr; gap:.5rem; `

/* ---------- Paso 2 ---------- */
const WideGrid = styled.div`
  display:grid; gap:.75rem; align-items:start;
  grid-template-columns:minmax(260px,1fr) 2fr;
  @media (max-width:1100px){ grid-template-columns:1fr; }
`
const Card = styled.div`
  background:${({theme})=>theme.colors.cardBg};
  border:1px solid ${({theme})=>theme.colors.border};
  border-radius:8px; padding:.75rem;
`
const ScrollCard = styled(Card)` max-height:60vh; overflow:auto; `
const Room = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  padding:.35rem .45rem; border-radius:6px; cursor:pointer;
  &:hover{ background:${({theme})=>theme.colors.hoverBg}; }
`
const Small = styled.small` opacity:.75; `
const DeviceRow = styled.label`
  display:flex; align-items:center; gap:.5rem; padding:.35rem .45rem; border-radius:6px; cursor:pointer;
  &:hover{ background:${({theme})=>theme.colors.hoverBg}; }
`

/* ---------- Paso 3 ---------- */
const Chip = styled.button`
  border:1px solid ${({theme})=>theme.colors.border};
  background:${({theme,active})=>active?theme.colors.primary:theme.colors.cardBg};
  color:${({active})=>active?'#fff':'inherit'};
  border-radius:999px; padding:.25rem .6rem; font-size:.8rem; cursor:pointer;
  &:hover{ background:${({theme,active})=>active?theme.colors.primaryDark:theme.colors.hoverBg}; }
`
const DayBtn = styled(Chip)``

/* ---------- Constantes ---------- */
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const ES_DAYS = { Monday:'Lunes', Tuesday:'Martes', Wednesday:'Miércoles', Thursday:'Jueves', Friday:'Viernes', Saturday:'Sábado', Sunday:'Domingo' }
const slots48 = Array.from({length:48},(_,i)=>`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2===0?'00':'30'}`)
const PRESETS_KEY = 'routine_presets_v1'
const STEP_TITLES = ['Selección', 'Dispositivos', 'Horarios', 'Resumen']
const loadPresets = () => { try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]') } catch { return [] } }
const savePresets = (list) => localStorage.setItem(PRESETS_KEY, JSON.stringify(list))
const idxOf = (t)=>slots48.indexOf(t)
const minutesBetween = (a,b)=>(idxOf(b)-idxOf(a)+(idxOf(b)<=idxOf(a)?48:0))*30
const idEq = (a,b) => String(a ?? '') === String(b ?? '')

/* ========================================================= */
export default function Rutinas(){
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth>=768)

  const [routines,setRoutines] = useState([])

  // data
  const [patients,setPatients] = useState([])
  const [households,setHouseholds] = useState([])
  const [devices,setDevices] = useState([])

  // presets
  const [presets,setPresets] = useState(loadPresets())
  const [presetOpen,setPresetOpen] = useState(false)
  const [presetTab,setPresetTab] = useState('create')
  const [presetForm,setPresetForm] = useState({ name:'', start:'18:00', end:'19:00', days:[] })
  useEffect(()=>{ savePresets(presets) },[presets])

  // modal creación
  const [open,setOpen] = useState(false)
  const [step,setStep] = useState(1)

  const [form,setForm] = useState({ name:'', user_id:'', household_id:'' })
  const [errors,setErrors] = useState({})
  const [touched,setTouched] = useState({})

  // paso 2/3
  const [selectedDevices,setSelectedDevices] = useState(new Set())
  const [roomOpen,setRoomOpen] = useState({})
  const [scheduleBlocks,setScheduleBlocks] = useState({}) // { deviceId: [{start,end,days[]}] }
  const [target,setTarget] = useState('ALL')
  const [builder,setBuilder] = useState({ start:'14:00', end:'15:00', days:[] })
  const [builderPresetId,setBuilderPresetId] = useState('')

  // edición / borrado
  const [deleteOpen,setDeleteOpen] = useState(false)
  const [deleteId,setDeleteId] = useState(null)
  const [editOpen,setEditOpen] = useState(false)
  const [editId,setEditId] = useState(null)
  const [editData,setEditData] = useState({ name:'', user_id:'', household_id:'', occurrences:[] })

  /* ---------- fetch ---------- */
  useEffect(()=>{ setMenuOpen(window.innerWidth>=768); loadInitial() },[])
  async function loadInitial(){
    fetch(`${API}/routines`, {credentials:'include'}).then(r=>r.ok?r.json():[]).then(setRoutines).catch(()=>{})
    fetch(`${API}/users?role=paciente`, {credentials:'include'}).then(r=>r.ok?r.json():[]).then(setPatients).catch(()=>{})
    fetch(`${API}/households`, {credentials:'include'}).then(r=>r.ok?r.json():[]).then(setHouseholds).catch(()=>{})
    fetch(`${API}/devices`, {credentials:'include'}).then(r=>r.ok?r.json():[]).then(setDevices).catch(()=>{})
  }

  /* ---------- Paciente → Casa ---------- */
  useEffect(() => {
    if (!form.user_id) return
    const p = patients.find(x => idEq(x._id, form.user_id))
    const phId = p?.household_id ?? ''
    setForm(f => ({ ...f, household_id: phId || '' }))
  }, [form.user_id, patients])

  /* ---------- memos ---------- */
  const patientHouse = useMemo(()=>{
    if(!form.user_id) return null
    const p = patients.find(x=>idEq(x._id, form.user_id))
    if(!p?.household_id) return null
    const phId = (p.household_id?._id ?? p.household_id)
    return households.find(h=>idEq(h._id, phId)) || null
  },[form.user_id, patients, households])

  const devicesByRoom = useMemo(() => {
    const hhId = patientHouse?._id || form.household_id || ''
    const list = devices.filter(d => idEq(d.household_id, hhId))
    const map = {}
    for (const d of list) {
      if (!map[d.room]) map[d.room] = []
      map[d.room].push(d)
    }
    return map
  }, [devices, form.household_id, patientHouse])

  /* ---------- helpers ---------- */
  function resetCreator(){
    setStep(1)
    setForm({name:'', user_id:'', household_id:''})
    setErrors({}); setTouched({})
    setSelectedDevices(new Set())
    setScheduleBlocks({})
    setTarget('ALL')
    setBuilder({ start:'14:00', end:'15:00', days:[] })
    setBuilderPresetId('')
  }
  function openCreator(){ resetCreator(); setOpen(true) }

  function toggleRoom(room){ setRoomOpen(prev=>({...prev, [room]:!prev[room]})) }
  function selectWholeRoom(room){
    const list = devicesByRoom[room] || []
    const next = new Set(selectedDevices); for(const d of list) next.add(d._id)
    setSelectedDevices(next); ensureBlocksFor([...next])
  }
  function toggleDevice(d){
    const next = new Set(selectedDevices); next.has(d._id)?next.delete(d._id):next.add(d._id)
    setSelectedDevices(next); ensureBlocksFor([...next])
  }
  function ensureBlocksFor(ids){
    setScheduleBlocks(prev=>{ const out={...prev}; for(const id of ids) if(!out[id]) out[id]=[]; return out })
  }

  /* ---------- validación paso 1 ---------- */
  function validateStep1() {
    const e = {}
    if (!form.user_id) e.user_id = 'Selecciona un paciente.'
    const p = patients.find(x => idEq(x._id, form.user_id))
    const mustHouse = p?.household_id ?? ''
    if (!mustHouse) e.household_id = 'Este paciente no tiene casa asignada.'
    else if (form.household_id && !idEq(form.household_id, mustHouse)) {
      e.household_id = 'La casa debe ser la del paciente.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ---------- paso 3 builder ---------- */
  const endOptionsFor = (start)=>{
    const s = idxOf(start); if(s<0) return []
    const out=[]; for(let i=1;i<=48;i++){ const idx=(s+i)%48; out.push({value:slots48[idx], label:`${slots48[idx]}${idx<=s?' (+1 día)':''}`}); if(i===48) break }
    return out
  }
  const toggleBuilderDay = (d)=> setBuilder(b=>{const s=new Set(b.days); s.has(d)?s.delete(d):s.add(d); return {...b, days:[...s]} })
  function applyBuilder(){
    if(!builder.start||!builder.end) return alert('Elige inicio y fin')
    if(!builder.days?.length) return alert('Selecciona al menos un día')
    if(!selectedDevices.size) return alert('Selecciona dispositivos en el paso 2')
    if(minutesBetween(builder.start,builder.end)<30) return alert('Duración mínima: 30 min')
    const ids = target==='ALL' ? [...selectedDevices] : [target]
    setScheduleBlocks(prev=>{
      const out={...prev}
      for(const id of ids){ const list=out[id]?[...out[id]]:[]; list.push({...builder}); out[id]=list }
      return out
    })
  }
  const removeBlock = (devId, i)=> setScheduleBlocks(prev=>({...prev,[devId]:prev[devId].filter((_,idx)=>idx!==i)}))

  /* ---------- payload ---------- */
  function buildOccurrencesFromBlocks(){
    const group=new Map()
    for(const devId of selectedDevices){
      const blocks=scheduleBlocks[devId]||[]
      for(const b of blocks){
        const key = `${b.start}|${b.end}|${[...(b.days||[])].slice().sort().join(',')}`
        if(!group.has(key)) group.set(key,{start:b.start,end:b.end,days:[...b.days],device_ids:new Set()})
        group.get(key).device_ids.add(devId)
      }
    }
    return [...group.values()].map(x=>({start:x.start,end:x.end,days:x.days,device_ids:[...x.device_ids]}))
  }

  /* ---------- guardar ---------- */
  async function saveRoutine(){
    if(!validateStep1()){ setTouched({user_id:true, household_id:true}); return }
    if(selectedDevices.size===0) return alert('Selecciona al menos un dispositivo')
    const occurrences=buildOccurrencesFromBlocks()
    if(!occurrences.length) return alert('Añade al menos una franja en el paso 3')
    const householdId=form.household_id || patientHouse?._id || ''
    const payload={ name:(form.name||'').trim(), user_id:form.user_id, household_id:householdId, occurrences }
    try{
      const res=await fetch(`${API}/routines`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err.error||'No se pudo guardar la rutina') }
      const list=await fetch(`${API}/routines`,{credentials:'include'})
      setRoutines(list.ok?await list.json():[]); setOpen(false)
    }catch(e){ alert(e.message) }
  }

  /* ---------- helpers listado ---------- */
  function normalizeRef(ref,{type}){ if(!ref) return {id:'',name:''}; if(typeof ref==='string') return {id:ref,name:''}; if(ref.name&&typeof ref.name==='string') return {id:ref._id||ref.id||'',name:ref.name}; if(type==='device'&&(ref.appliance||ref.plugmodel)) return {id:ref._id||ref.id||'',name:ref.appliance||ref.plugmodel}; return {id:ref._id||ref.id||'',name:''}; }
  function getPatientName(userRef){ const {id,name}=normalizeRef(userRef,{type:'user'}); if (name) return name; const p=patients.find(u=>idEq(u._id,id)); return p?.name||id||'—' }
  function getDeviceMeta(deviceRef,devs=devices,hhs=households){
    const norm=normalizeRef(deviceRef,{type:'device'}); const d=devs.find(x=>idEq(x?._id,norm.id)); const isObj= deviceRef && typeof deviceRef==='object'
    const dispName=norm.name||d?.appliance||d?.plugmodel||norm.id||'Dispositivo'
    const room=d?.room||(isObj?deviceRef.room:'')||''; const hhIdRaw=d?.household_id||(isObj?deviceRef.household_id:'')||''; const home=hhs.find(h=>idEq(h?._id, hhIdRaw))?.name||''
    return {name:dispName, room, home}
  }
  function summarizeTimes(occ=[]){ const m=new Map(); for(const o of occ){ const k=`${o.start}–${o.end}`; m.set(k,(m.get(k)||0)+((o.device_ids||[]).length)) } return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k) }
  function uniqueDevicesCount(occ=[]){ const s=new Set(); for(const o of occ)(o.device_ids||[]).forEach(id=>s.add(String(id))); return s.size }
  function daysUnion(occ=[]){ const s=new Set(); for(const o of occ)(o.days||[]).forEach(d=>s.add(d)); return [...s] }

  /* ---------- búsqueda/filtros/orden ---------- */
  const [q,setQ] = useState('')
  const [flt,setFlt]=useState({patientId:'',day:''})
  const [sort,setSort]=useState('recent_desc')

  const filteredSorted = useMemo(()=>{
    const qnorm=q.trim().toLowerCase(); let arr=[...routines]
    if(flt.patientId){ arr=arr.filter(r=>idEq((typeof r.user_id==='object'?r.user_id?._id:r.user_id), flt.patientId)) }
    if(flt.day){ arr=arr.filter(r=>Array.isArray(r.occurrences)&&r.occurrences.some(o=>Array.isArray(o.days)&&o.days.includes(flt.day))) }
    if(qnorm){
      arr=arr.filter(r=>{
        const patient=(getPatientName(r.user_id)||'').toLowerCase()
        const name=(r.name||'').toLowerCase()
        let devicesTxt='', timeTxt=''
        if(Array.isArray(r.occurrences)){
          for(const o of r.occurrences){ timeTxt+=` ${o.start||''} ${o.end||''}`
            for(const dRef of (o.device_ids||[])){ const meta=getDeviceMeta(dRef,devices,households); devicesTxt+=` ${meta.name||''} ${meta.room||''} ${meta.home||''}` }
          }
        }
        return `${patient} ${name} ${devicesTxt.toLowerCase()} ${timeTxt.toLowerCase()}`.includes(qnorm)
      })
    }
    if(sort==='recent_desc'||sort==='recent_asc'){
      arr.sort((a,b)=>{ const ta=new Date(a.updatedAt||a.createdAt||0).getTime(), tb=new Date(b.updatedAt||b.createdAt||0).getTime(); return sort==='recent_desc'?(tb-ta):(ta-tb) })
    }else{
      arr.sort((a,b)=>{ const c1=getPatientName(a.user_id).localeCompare(getPatientName(b.user_id)); if(c1!==0) return c1; return (a.name||'').localeCompare(b.name||'') })
    }
    return arr
  },[q,flt,sort,routines,patients,devices,households])

  /* ---------- edición (completa) ---------- */
  function openEditModal(r){
    setEditId(r._id)
    const occs=Array.isArray(r.occurrences)?r.occurrences.map(o=>({
      start:o.start||'14:00', end:o.end||'15:00',
      days:Array.isArray(o.days)?[...o.days]:[],
      device_ids:Array.isArray(o.device_ids)?o.device_ids.map(d=> (typeof d==='object'?(d?._id||d?.id):d) ):[]
    })):[]
    setEditData({
      name:r.name||'',
      user_id: typeof r.user_id==='object' ? (r.user_id?._id||r.user_id?.id||'') : (r.user_id||''),
      household_id: typeof r.household_id==='object' ? (r.household_id?._id||r.household_id?.id||'') : (r.household_id||''),
      occurrences:occs
    })
    setEditOpen(true)
  }
  const updateOccurrence=(idx,patch)=> setEditData(ed=>{const next=[...ed.occurrences]; next[idx]={...next[idx],...patch}; return {...ed,occurrences:next}})
  const toggleOccDevice=(idx,deviceId)=> setEditData(ed=>{const next=[...ed.occurrences]; const s=new Set(next[idx].device_ids); s.has(deviceId)?s.delete(deviceId):s.add(deviceId); next[idx]={...next[idx],device_ids:[...s]}; return {...ed,occurrences:next}})
  const toggleOccDay=(idx,day)=> setEditData(ed=>{const next=[...ed.occurrences]; const s=new Set(next[idx].days||[]); s.has(day)?s.delete(day):s.add(day); next[idx]={...next[idx],days:[...s]}; return {...ed,occurrences:next}})
  const addOccurrence=()=> setEditData(ed=>({...ed,occurrences:[...ed.occurrences,{start:'14:00',end:'15:00',days:[],device_ids:[]}] }))
  const removeOccurrence=(idx)=> setEditData(ed=>({...ed,occurrences:ed.occurrences.filter((_,i)=>i!==idx)}))
  async function saveEdit(){
    try{
      if(!editId) return
      if(!editData.occurrences?.length) return alert('Añade al menos una franja')
      for(const o of editData.occurrences){
        if(!o.start||!o.end) return alert('Cada franja debe tener inicio y fin')
        if(!o.days?.length) return alert('Cada franja debe tener días')
        if(!o.device_ids?.length) return alert('Cada franja debe tener dispositivos')
      }
      const payload={ name:(editData.name||'').trim(), occurrences:editData.occurrences.map(o=>({start:o.start,end:o.end,days:o.days,device_ids:o.device_ids})) }
      const res=await fetch(`${API}/routines/${editId}`,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err.error||'No se pudo editar la rutina') }
      const r=await fetch(`${API}/routines`,{credentials:'include'}); setRoutines(r.ok?await r.json():[])
      setEditOpen(false); setEditId(null)
    }catch(e){ alert(e.message) }
  }

  /* ---------- borrado ---------- */
  const openDeleteModal=(id)=>{ setDeleteId(id); setDeleteOpen(true) }
  async function confirmDelete(){
    try{
      if(!deleteId) return
      const res=await fetch(`${API}/routines/${deleteId}`,{method:'DELETE',credentials:'include'})
      if(!res.ok && res.status!==204){ const err=await res.json().catch(()=>({})); throw new Error(err.error||'No se pudo borrar la rutina') }
      const r=await fetch(`${API}/routines`,{credentials:'include'}); setRoutines(r.ok?await r.json():[])
      setDeleteOpen(false); setDeleteId(null)
    }catch(e){ alert(e.message) }
  }

  /* ---------- presets modal ---------- */
  const togglePresetDay=(d)=> setPresetForm(f=>{const s=new Set(f.days); s.has(d)?s.delete(d):s.add(d); return {...f, days:[...s]} })
  const addPreset=()=>{
    const {name,start,end,days}=presetForm
    if(!name.trim()||!days.length||idxOf(start)<0||idxOf(end)<0) return alert('Completa nombre, días e inicio/fin')
    if(minutesBetween(start,end)<30) return alert('El fin debe ser ≥ +30 min')
    const id=crypto.randomUUID?crypto.randomUUID():String(Date.now())
    setPresets(p=>[...p,{id,name:name.trim(),start,end,days}])
    setPresetForm({name:'',start:'18:00',end:'19:00',days:[]})
  }
  const deletePreset=(id)=> setPresets(p=>p.filter(x=>x.id!==id))

  return (
    <AppContainer>
      <Header onToggleMenu={()=>setMenuOpen(o=>!o)} onLogout={()=>{logout();navigate('/login')}} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <Toolbar>
            <h1>Rutinas</h1>
            <div>
              <Btn onClick={()=>setPresetOpen(true)}>+ Añadir preset</Btn>
              <NewButton onClick={openCreator}>+ Añadir rutina</NewButton>
            </div>
          </Toolbar>

          {/* Filtros */}
          <div style={{marginBottom:'1rem'}}>
            <SearchToolbar
              query={q}
              onQueryChange={setQ}
              placeholder="Buscar por nombre, paciente, dispositivo, sala o casa"
              filters={[
                { type:'select', key:'patientId', label:'Paciente', options:[{value:'',label:'Todos'}, ...patients.map(p=>({value:p._id,label:p.name||p._id}))] },
                { type:'select', key:'day', label:'Día', options:[{value:'',label:'Todos'}, ...DAY_NAMES.map(d=>({value:d,label:ES_DAYS[d]}))] },
              ]}
              values={flt}
              onValuesChange={setFlt}
              sortOptions={[{value:'recent_desc',label:'Más recientes'},{value:'recent_asc',label:'Más antiguas'},{value:'alpha',label:'Paciente / Nombre'}]}
              sort={sort}
              onSortChange={setSort}
              onClear={()=>{ setQ(''); setFlt({patientId:'', day:''}); setSort('recent_desc') }}
            />
          </div>

          {/* Lista */}
          <List>
            {filteredSorted.map(r=>{
              const patient=getPatientName(r.user_id)
              const occ=Array.isArray(r.occurrences)?r.occurrences:[]
              const times=summarizeTimes(occ)
              const daysPretty=daysUnion(occ).map(d=>ES_DAYS[d]||d)
              const devCount=uniqueDevicesCount(occ)
              return (
                <RoutineCard key={r._id}>
                  <CardTop>
                    <CardTitle>{r.name || `Rutina ${String(r._id).slice(-6)}`}</CardTitle>
                    <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                      <Btn onClick={()=>openEditModal(r)}>✎ Editar</Btn>
                      <Btn style={{borderColor:'#e04848',background:'#e04848',color:'#fff'}} onClick={()=>openDeleteModal(r._id)}>🗑 Borrar</Btn>
                      {times.length>0 && <TimePill>{times.join(' · ')}</TimePill>}
                    </div>
                  </CardTop>
                  <Meta>
                    Paciente: <strong>{patient}</strong>{' · '}
                    Ocurrencias: <strong>{occ.length}</strong>{' · '}
                    Dispositivos totales: <strong>{devCount}</strong>
                  </Meta>
                  {!!daysPretty.length && (
                    <TagRow>{daysPretty.map(d=><Tag key={d}>{d}</Tag>)}</TagRow>
                  )}
                </RoutineCard>
              )
            })}
            {!filteredSorted.length && <Muted>No hay rutinas que coincidan con el filtro.</Muted>}
          </List>
        </Main>
      </Body>
      <Footer />

      {/* ---------- MODAL CREAR ---------- */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <Wizard>
          <ModalBody>
            <ModalHeader>
              <CompactHeader>
                <div>
                  <h2>Crear rutina</h2>
                  <StepSub> Paso {step} de {STEP_TITLES.length} — {STEP_TITLES[step-1]} </StepSub>
                </div>
                <StepBadge>{step} · {STEP_TITLES[step-1]}</StepBadge>
                <Progress aria-hidden="true">
                  <ProgressFill style={{ width: `${(step-1)/(STEP_TITLES.length-1)*100}%` }} />
                </Progress>
              </CompactHeader>
            </ModalHeader>

            <ModalContent>
              {/* PASO 1 */}
              {step === 1 && (
                <>
                  <FormGroup>
                    <label>Nombre de la rutina (opcional)</label>
                    <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} placeholder="p.ej. Comida" />
                  </FormGroup>

                  <FormGroup>
                    <label>Paciente</label>
                    <select
                      value={form.user_id}
                      onChange={e => { setForm(f => ({ ...f, user_id: e.target.value })); setTouched(t => ({ ...t, user_id: true })); setErrors({}); }}
                    >
                      <option value="">— Selecciona —</option>
                      {patients.map(p => <option key={p._id} value={p._id}>{p.name || p._id}</option>)}
                    </select>
                    {touched.user_id && errors.user_id && <div style={{color:'#e04848', fontSize:'.85rem', marginTop:4}}>{errors.user_id}</div>}
                  </FormGroup>

                  <FormGroup>
                    <label>Casa</label>
                    {patientHouse ? (
                      <>
                        <input value={patientHouse.name} readOnly disabled />
                        <Small>La casa queda fijada a la del paciente.</Small>
                      </>
                    ) : (
                      <>
                        <select disabled><option>— Selecciona un paciente con casa —</option></select>
                        {errors.household_id && <div style={{color:'#e04848', fontSize:'.85rem', marginTop:4}}>{errors.household_id}</div>}
                      </>
                    )}
                  </FormGroup>

                  <StepFooter>
                    <Btn onClick={()=>setOpen(false)}>Cancelar</Btn>
                    <Btn variant="primary" onClick={()=>{ if(validateStep1()) setStep(2) }}>Siguiente</Btn>
                  </StepFooter>
                </>
              )}

              {/* PASO 2 */}
              {step === 2 && (
                <>
                  <WideGrid>
                    <ScrollCard>
                      <strong>Habitaciones</strong>
                      <div style={{ marginTop:'.5rem' }}>
                        {Object.keys(devicesByRoom).length === 0 && <Small>No hay dispositivos para la casa del paciente.</Small>}
                        {Object.entries(devicesByRoom).map(([room, list]) => (
                          <div key={room} style={{ marginBottom: '.35rem' }}>
                            <Room onClick={() => null}>
                              <span>{room}</span>
                              <div style={{ display:'flex', gap:'.35rem', alignItems:'center' }}>
                                <Small>{list.length} disp.</Small>
                                <Btn onClick={(e)=>{ e.stopPropagation(); selectWholeRoom(room) }}>Seleccionar sala</Btn>
                              </div>
                            </Room>
                          </div>
                        ))}
                      </div>
                    </ScrollCard>

                    <ScrollCard>
                      <strong>Dispositivos</strong>
                      <div style={{ marginTop:'.5rem' }}>
                        {Object.entries(devicesByRoom).map(([room, list]) => (
                          <div key={room} style={{ marginBottom:'.5rem' }}>
                            <div style={{ opacity:.75, fontWeight:600, marginBottom:'.25rem' }}>{room}</div>
                            {list.map(d => (
                              <DeviceRow key={d._id}>
                                <input type="checkbox" checked={selectedDevices.has(d._id)} onChange={() => toggleDevice(d)} />
                                <span>{d.appliance} <Small>({d.plugmodel})</Small></span>
                              </DeviceRow>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollCard>
                  </WideGrid>

                  <StepFooter>
                    <Btn onClick={() => setStep(1)}>Atrás</Btn>
                    <Btn variant="primary" onClick={() => { if(selectedDevices.size){ ensureBlocksFor([...selectedDevices]); setStep(3); } }} disabled={!selectedDevices.size}>Siguiente</Btn>
                  </StepFooter>
                </>
              )}

              {/* PASO 3 */}
              {step === 3 && (
                <>
                  <Card>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'.75rem',alignItems:'center'}}>
                      <div><strong>Aplicar a</strong></div>
                      <select value={target} onChange={e=>setTarget(e.target.value)}>
                        <option value="ALL">Todos los seleccionados</option>
                        {[...selectedDevices].map(id=>{
                          const d=devices.find(x=>idEq(x._id,id))
                          return <option key={id} value={id}>{d?.appliance || d?.plugmodel || id}</option>
                        })}
                      </select>

                      <span style={{opacity:.75}}>·</span>

                      <div><strong>Preset</strong></div>
                      <select style={{minWidth:220}} value={builderPresetId} onChange={e=>setBuilderPresetId(e.target.value)}>
                        <option value="">— Selecciona —</option>
                        {presets.map(p=>(
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.start}–{p.end}, {p.days.map(d=>ES_DAYS[d]).join(', ')})
                          </option>
                        ))}
                      </select>
                      <Btn onClick={()=>{ const p=presets.find(x=>x.id===builderPresetId); if(p) setBuilder({start:p.start,end:p.end,days:[...p.days]}) }} disabled={!builderPresetId}>
                        Cargar preset
                      </Btn>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginTop:'.75rem'}}>
                      <div>
                        <label style={{display:'block',marginBottom:6}}>Inicio / Fin</label>
                        <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                          <select
                            value={builder.start}
                            onChange={e=>{
                              const start=e.target.value
                              const ends=endOptionsFor(start)
                              const valid=ends.some(o=>o.value===builder.end)
                              setBuilder(b=>({...b,start,end:valid?b.end:(ends[0]?.value||b.end)}))
                            }}
                          >
                            {slots48.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                          <span>—</span>
                          <select value={builder.end} onChange={e=>setBuilder(b=>({...b,end:e.target.value}))}>
                            {endOptionsFor(builder.start).map(opt=>(
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <Small>El fin debe ser ≥ +30 min y puede cruzar medianoche.</Small>
                      </div>

                      <div>
                        <label style={{display:'block',marginBottom:6}}>Días</label>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'.35rem'}}>
                          {DAY_NAMES.map((d,idx)=>(
                            <DayBtn key={d} active={builder.days.includes(d)} onClick={()=>toggleBuilderDay(d)}>
                              {DAY_SHORT[idx]}
                            </DayBtn>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{display:'flex',justifyContent:'flex-end',marginTop:'.75rem'}}>
                      <Btn variant="primary" onClick={applyBuilder}>Añadir franja a la selección</Btn>
                    </div>
                  </Card>

                  {/* Bloques por dispositivo */}
                  <ScrollCard style={{marginTop:'.75rem'}}>
                    <strong>Horarios por dispositivo</strong>
                    <div style={{display:'grid',gap:'.5rem',marginTop:'.5rem'}}>
                      {[...selectedDevices].map(id=>{
                        const dev=devices.find(x=>idEq(x._id,id))
                        const blocks=scheduleBlocks[id]||[]
                        return (
                          <Card key={id}>
                            <div style={{fontWeight:600, marginBottom:'.35rem'}}>{dev?.appliance||dev?.plugmodel||id}</div>
                            {!blocks.length && <Small>— sin franjas —</Small>}
                            {blocks.map((b,i)=>(
                              <div key={`${id}-${i}`} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                                <TimePill>{b.start}–{b.end}{idxOf(b.end)<=idxOf(b.start)?' (+1)':''}</TimePill>
                                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                  {(b.days||[]).map(dn=><Tag key={`${id}-${i}-${dn}`}>{ES_DAYS[dn]}</Tag>)}
                                </div>
                                <Btn style={{borderColor:'#e04848',background:'#e04848',color:'#fff'}} onClick={()=>removeBlock(id,i)}>Eliminar</Btn>
                              </div>
                            ))}
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollCard>

                  <StepFooter>
                    <Btn onClick={() => setStep(2)}>Atrás</Btn>
                    <Btn variant="primary" onClick={() => setStep(4)}>Siguiente</Btn>
                  </StepFooter>
                </>
              )}

              {/* PASO 4 */}
              {step===4 && (
                <>
                  <div style={{marginBottom:'.75rem'}}>
                    <strong>Resumen</strong>
                    <div style={{marginTop:'.5rem'}}>
                      <div><Small>Nombre:</Small> {form.name || <em>(sin nombre)</em>}</div>
                      <div><Small>Paciente:</Small> {patients.find(p=>idEq(p._id,form.user_id))?.name || form.user_id}</div>
                      <div><Small>Casa:</Small> {patientHouse?.name || '(ninguna)'}</div>

                      <div style={{marginTop:'.75rem'}}>
                        <Small>Horarios por dispositivo</Small>
                        <div style={{display:'grid',gap:'.5rem',marginTop:'.35rem'}}>
                          {[...selectedDevices].map(id=>{
                            const dev=devices.find(x=>idEq(x._id,id))
                            const blocks=scheduleBlocks[id]||[]
                            return (
                              <Card key={id}>
                                <div style={{fontWeight:600, marginBottom:'.35rem'}}>{dev?.appliance||dev?.plugmodel||id}</div>
                                {!blocks.length && <Small>— sin franjas —</Small>}
                                {blocks.map((b,i)=>(
                                  <div key={`${id}-sum-${i}`} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                                    <TimePill>{b.start}–{b.end}{idxOf(b.end)<=idxOf(b.start)?' (+1)':''}</TimePill>
                                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{(b.days||[]).map(dn=><Tag key={`${id}-sum-${i}-${dn}`}>{ES_DAYS[dn]}</Tag>)}</div>
                                  </div>
                                ))}
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <StepFooter>
                    <Btn onClick={()=>setStep(3)}>Atrás</Btn>
                    <div style={{display:'flex',gap:'.5rem'}}>
                      <Btn onClick={()=>setOpen(false)}>Cancelar</Btn>
                      <Btn variant="primary" onClick={saveRoutine}>Guardar</Btn>
                    </div>
                  </StepFooter>
                </>
              )}
            </ModalContent>
          </ModalBody>
        </Wizard>
      </Modal>

      {/* ---------- MODAL EDITAR ---------- */}
      <Modal isOpen={editOpen} onClose={()=>setEditOpen(false)}>
        <h2>Editar rutina</h2>

        <FormGroup>
          <label>Nombre (opcional)</label>
          <input value={editData.name} onChange={e=>setEditData(ed=>({...ed, name:e.target.value}))} placeholder="p.ej. Comida" />
        </FormGroup>

        <div style={{marginTop:'.75rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <strong>Franjas (occurrences)</strong>
          <Btn onClick={addOccurrence}>+ Añadir franja</Btn>
        </div>

        {editData.occurrences.map((o,idx)=>{
          const hhId=editData.household_id||''; const devs=hhId?devices.filter(d=>idEq(d.household_id,hhId)):devices
          const endOptionsForEdit=(start)=>{ const s=idxOf(start); if(s<0) return []; const out=[]; for(let i=1;i<=48;i++){ const id=(s+i)%48; out.push({value:slots48[id], label:`${slots48[id]}${id<=s?' (+1 día)':''}`}); if(i===48)break } return out }
          return (
            <Card key={idx} style={{marginTop:'.6rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.4rem'}}>
                <strong>Franja #{idx+1}</strong>
                <Btn style={{borderColor:'#e04848',background:'#e04848',color:'#fff'}} onClick={()=>removeOccurrence(idx)}>Eliminar</Btn>
              </div>

              <FormGroup>
                <label>Inicio / Fin</label>
                <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                  <select value={o.start} onChange={e=>{ const start=e.target.value; const ends=endOptionsForEdit(start); const valid=ends.some(opt=>opt.value===o.end); updateOccurrence(idx,{start,end:valid?o.end:(ends[0]?.value||o.end)}) }}>
                    {slots48.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <span>—</span>
                  <select value={o.end} onChange={e=>updateOccurrence(idx,{end:e.target.value})}>
                    {endOptionsForEdit(o.start).map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </FormGroup>

              <FormGroup>
                <label>Días</label>
                <TagRow>
                  {DAY_NAMES.map((d,i)=>(
                    <Chip key={d} active={o.days.includes(d)} onClick={()=>toggleOccDay(idx,d)} title={ES_DAYS[d]}>
                      {DAY_SHORT[i]}
                    </Chip>
                  ))}
                </TagRow>
              </FormGroup>

              <FormGroup>
                <label>Dispositivos</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'.35rem'}}>
                  {devs.map(d=>(
                    <label key={d._id} style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                      <input type="checkbox" checked={o.device_ids.includes(d._id)} onChange={()=>toggleOccDevice(idx,d._id)} />
                      <span>{d.appliance||d.plugmodel}{d.room?` — ${d.room}`:''}</span>
                    </label>
                  ))}
                  {!devs.length && <Small>No hay dispositivos disponibles para esta casa.</Small>}
                </div>
              </FormGroup>
            </Card>
          )
        })}

        <div style={{display:'flex',justifyContent:'flex-end',gap:'.5rem',marginTop:'.75rem'}}>
          <Btn onClick={()=>setEditOpen(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEdit}>Guardar cambios</Btn>
        </div>
      </Modal>

      {/* ---------- MODAL PRESET ---------- */}
      <Modal isOpen={presetOpen} onClose={()=>setPresetOpen(false)}>
        <h2>Presets de horario</h2>

        <div style={{display:'flex',gap:'.5rem',alignItems:'center',marginBottom:'.5rem'}}>
          <Chip active={presetTab==='create'} onClick={()=>setPresetTab('create')}>Nuevo preset</Chip>
          <Chip active={presetTab==='list'} onClick={()=>setPresetTab('list')}>Mis presets</Chip>
        </div>

        {presetTab==='create' && (
          <Card style={{marginBottom:'.75rem'}}>
            <strong>Nuevo preset</strong>

            <FormGroup style={{marginTop:'.5rem'}}>
              <label>Nombre</label>
              <input value={presetForm.name} onChange={e=>setPresetForm(f=>({...f,name:e.target.value}))} placeholder="p.ej. Deporte" />
            </FormGroup>

            <FormGroup>
              <label>Inicio / Fin</label>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                <select value={presetForm.start} onChange={e=>{ const start=e.target.value; const ends=endOptionsFor(start); const valid=ends.some(o=>o.value===presetForm.end); setPresetForm(f=>({...f,start,end:valid?f.end:(ends[0]?.value||f.end)})) }}>
                  {slots48.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <span>—</span>
                <select value={presetForm.end} onChange={e=>setPresetForm(f=>({...f,end:e.target.value}))}>
                  {endOptionsFor(presetForm.start).map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <Small>El fin debe ser ≥ +30 min y ≤ el mismo horario del día siguiente.</Small>
            </FormGroup>

            <FormGroup>
              <label>Días</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:'.35rem',marginTop:'.25rem'}}>
                {DAY_NAMES.map((d,idx)=>(
                  <DayBtn key={d} active={presetForm.days.includes(d)} onClick={()=>togglePresetDay(d)}>{DAY_SHORT[idx]}</DayBtn>
                ))}
              </div>
            </FormGroup>

            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <Btn variant="primary" onClick={addPreset}>Guardar preset</Btn>
            </div>
          </Card>
        )}

        {presetTab==='list' && (
          <Card>
            <strong>Mis presets</strong>
            <div style={{marginTop:'.5rem'}}>
              {presets.length===0 && <Muted>Aún no has creado presets.</Muted>}
              {presets.map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.35rem .5rem',border:'1px solid var(--border)',borderRadius:6,marginBottom:'.35rem'}}>
                  <div><strong>{p.name}</strong> <Small>({p.start}–{p.end}, {p.days.map(d=>ES_DAYS[d]).join(', ')})</Small></div>
                  <Btn style={{borderColor:'#e04848',background:'#e04848',color:'#fff'}} onClick={()=>deletePreset(p.id)}>Borrar</Btn>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Modal>

      {/* ---------- MODAL BORRAR ---------- */}
      <Modal isOpen={deleteOpen} onClose={()=>setDeleteOpen(false)}>
        <h2>Eliminar rutina</h2>
        <p>¿Seguro que quieres borrar esta rutina? Esta acción no se puede deshacer.</p>
        <div style={{display:'flex',justifyContent:'flex-end',gap:'.5rem',marginTop:'.75rem'}}>
          <Btn variant="primary" onClick={()=>setDeleteOpen(false)}>Cancelar</Btn>
          <Btn style={{borderColor:'#e04848',background:'#e04848',color:'#fff'}} onClick={confirmDelete}>Borrar</Btn>
        </div>
      </Modal>
    </AppContainer>
  )
}
