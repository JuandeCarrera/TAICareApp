import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer from '../components/Footer.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`
const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`
const Main = styled.main`
  flex: 1;
  background: ${({ theme }) => theme.colors.bg};
  padding: 2rem;
  overflow-y: auto;
`
const HouseItem = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border-radius: 6px;
  margin-bottom: 1rem;
  padding: 1rem;
`
const HouseHeader = styled.div`
  display: flex;
  align-items: center;
`
const Title = styled.strong`
  flex: 1;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`
const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`
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
      variant === 'primary'
        ? theme.colors.primaryDark
        : theme.colors.hoverBg};
  }
`
const ToggleButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text};
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`
const RoomsList = styled.ul`
  margin-top: 0.75rem;
  padding-left: 1.5rem;
  list-style: disc;
`
const RoomItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`
const NewButton = styled(Btn).attrs({ variant: 'primary' })`
  margin-bottom: 1rem;
`

export default function Hogares() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const [households, setHouseholds] = useState([])
  const [openIds, setOpenIds]       = useState({})
  const [mode, setMode]             = useState('house')
  const [form, setForm] = useState({
    name: '',
    address: '',
    targetHouseId: '',
    roomName: '',
    owner: ''
  })
  const [editRoomOld, setEditRoomOld] = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [patients, setPatients] = useState([])

  // ------- CARGA INICIAL -------
  useEffect(() => {
    fetchHouseholds()
    fetch(`${API}/users?role=paciente`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : []))
      .then(setPatients)
      .catch(() => {})
  }, [])

  // ------- FETCH HOGARES -------
  async function fetchHouseholds() {
    try {
      const res = await fetch(`${API}/households`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setHouseholds(Array.isArray(data) ? data : [])
    } catch (e) {
      // opcional: mostrar toast/alert
      console.error('Error cargando hogares:', e)
    }
  }

  function toggleOpen(id) {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function openNewHouse() {
    setMode('house')
    setForm({
      name: '',
      address: '',
      targetHouseId: '',
      roomName: '',
      owner: patients[0]?._id || '' // autoselección opcional
    })
    setShowModal(true)
  }

  function openEditHouse(h) {
    setMode('editHouse')
    setForm({
      name: h.name || '',
      address: h.address || '',
      targetHouseId: h._id,
      roomName: '',
      owner: '' // no se edita el owner aquí
    })
    setShowModal(true)
  }

  function openNewRoom(h) {
    setMode('room')
    setForm(f => ({ ...f, targetHouseId: h._id, roomName: '' }))
    setShowModal(true)
  }

  function openEditRoom(h, room) {
    setMode('editRoom')
    setEditRoomOld(room)
    setForm({
      name: '',
      address: '',
      targetHouseId: h._id,
      roomName: room,
      owner: ''
    })
    setShowModal(true)
  }

  async function deleteHouse(id) {
    if (!confirm('¿Borrar esta casa?')) return
    const res = await fetch(`${API}/households/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (res.ok) fetchHouseholds()
  }

  async function deleteRoom(hId, room) {
    if (!confirm('¿Borrar habitación?')) return
    const h = households.find(x => x._id === hId)
    const currentRooms = Array.isArray(h?.rooms) ? h.rooms : []
    const newRooms = currentRooms.filter(r => r !== room)
    await fetch(`${API}/households/${hId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rooms: newRooms })
    })
    fetchHouseholds()
  }

  async function handleSave() {
    try {
      let res
      if (mode === 'house') {
        res = await fetch(`${API}/households`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            address: form.address,
            rooms: [],
            owner: form.owner
          })
        })
      } else if (mode === 'editHouse') {
        res = await fetch(`${API}/households/${form.targetHouseId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            address: form.address
          })
        })
      } else if (mode === 'room') {
        res = await fetch(`${API}/households/${form.targetHouseId}/rooms`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: form.roomName })
        })
      } else if (mode === 'editRoom') {
        const h = households.find(x => x._id === form.targetHouseId)
        const currentRooms = Array.isArray(h?.rooms) ? h.rooms : []
        const updated = currentRooms.map(r => (r === editRoomOld ? form.roomName : r))
        res = await fetch(`${API}/households/${form.targetHouseId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rooms: updated })
        })
      }

      if (res?.ok) {
        setShowModal(false)
        fetchHouseholds()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Error al guardar')
      }
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => {}}
        onLogout={() => {
          logout()
          navigate('/login')
        }}
      />
      <Body>
        <Sidebar open />
        <Main>
          <h1>Hogares</h1>
          <NewButton onClick={openNewHouse}>+ Nuevo</NewButton>

          {households.map(h => (
            <HouseItem key={h._id}>
              <HouseHeader>
                <Title>{h.name}</Title>
                <Actions>
                  <Btn variant="primary" onClick={() => openNewRoom(h)}>+ Habitación</Btn>
                  <Btn variant="primary" onClick={() => openEditHouse(h)}>✎ Editar</Btn>
                  <Btn variant="primary" onClick={() => deleteHouse(h._id)}>🗑 Borrar</Btn>
                  <ToggleButton
                    aria-label="Mostrar habitaciones"
                    onClick={() => toggleOpen(h._id)}
                  >
                    {openIds[h._id] ? '▲' : '▼'}
                  </ToggleButton>
                </Actions>
              </HouseHeader>

              {openIds[h._id] && (
                <RoomsList>
                  {(Array.isArray(h.rooms) ? h.rooms : []).map(room => (
                    <RoomItem key={room}>
                      {room}
                      <Actions>
                        <Btn variant="primary" onClick={() => openEditRoom(h, room)}>✎</Btn>
                        <Btn variant="primary" onClick={() => deleteRoom(h._id, room)}>🗑</Btn>
                      </Actions>
                    </RoomItem>
                  ))}
                </RoomsList>
              )}
            </HouseItem>
          ))}
        </Main>
      </Body>

      <Footer />

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
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '.35rem' }}>
                  Paciente (propietario)
                </label>
                <select
                  value={form.owner || ''}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  style={{ width: '100%', padding: '.5rem' }}
                >
                  <option value="">— Selecciona un paciente —</option>
                  {(patients || []).map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <small style={{ display: 'block', opacity: .75, marginTop: '.35rem' }}>
                  Este paciente quedará como propietario del hogar.
                </small>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '.35rem' }}>
                Nombre
              </label>
              <input
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="p.ej., Casa Lucía"
                style={{ width: '100%', padding: '.5rem' }}
              />
            </div>

            <div style={{ marginBottom: '0.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '.35rem' }}>
                Dirección
              </label>
              <input
                value={form.address || ''}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Calle, nº, piso… (opcional)"
                style={{ width: '100%', padding: '.5rem' }}
              />
            </div>
          </>
        )}

        {(mode === 'room' || mode === 'editRoom') && (
          <div style={{ marginTop: '.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '.35rem' }}>
              Nombre de la habitación
            </label>
            <input
              value={form.roomName || ''}
              onChange={e => setForm(f => ({ ...f, roomName: e.target.value }))}
              placeholder="p.ej., Salón, Cocina, Dormitorio…"
              style={{ width: '100%', padding: '.5rem' }}
            />
          </div>
        )}

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '.5rem' }}>
          <Btn onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={
              mode === 'house'
                ? !( (form.name || '').trim() && (form.owner || '') )
                : mode === 'editHouse'
                ? !(form.name || '').trim()
                : (mode === 'room' || mode === 'editRoom')
                ? !(form.roomName || '').trim()
                : true
            }
          >
            Guardar
          </Btn>
        </div>
      </Modal>
    </AppContainer>
  )
}