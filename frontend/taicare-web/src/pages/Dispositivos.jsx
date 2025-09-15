import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header   from '../components/Header.jsx'
import Sidebar  from '../components/Sidebar.jsx'
import Footer   from '../components/Footer.jsx'
import Modal    from '../components/Modal.jsx'
import { FormGroup } from '../components/Modal.jsx'

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

const DeviceItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
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

const NewButton = styled(Btn).attrs({ variant: 'primary' })`
  margin-bottom: 1rem;
`

export default function Dispositivos() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)
  const [households, setHouseholds] = useState([])
  const [rooms,      setRooms]      = useState([])
  const [devices,    setDevices]    = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [form, setForm] = useState({
    plugmodel: '',
    household_id: '',
    room: '',
    appliance: ''
  })

  useEffect(() => {
    fetchDevices()
    fetchHouseholds()
  }, [])

  async function fetchDevices() {
    const res = await fetch(`${API}/devices`, { credentials: 'include' })
    if (!res.ok) return
    setDevices(await res.json())
  }
  async function fetchHouseholds() {
    const res = await fetch(`${API}/households`, { credentials: 'include' })
    if (!res.ok) return
    setHouseholds(await res.json())
  }

  useEffect(() => {
    const hh = households.find(h => h._id === form.household_id)
    setRooms(hh?.rooms || [])
    if (!hh?.rooms?.includes(form.room)) {
      setForm(f => ({ ...f, room: '' }))
    }
  }, [form.household_id, households])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const openNew = () => {
    setEditId(null)
    setForm({ plugmodel: '', household_id: '', room: '', appliance: '' })
    setShowModal(true)
  }
  const openEdit = d => {
    setEditId(d._id)
    setForm({
      plugmodel: d.plugmodel,
      household_id: d.household_id,
      room: d.room,
      appliance: d.appliance
    })
    setShowModal(true)
  }
  const deleteDevice = async id => {
    if (!confirm('¿Borrar este dispositivo?')) return
    const res = await fetch(`${API}/devices/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (res.ok) setDevices(ds => ds.filter(d => d._id !== id))
  }

  const handleSave = async () => {
    const payload = { ...form }
    try {
      let res
      if (editId) {
        res = await fetch(`${API}/devices/${editId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${API}/devices`, {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        })
      }
      if (!res.ok) throw new Error('Error al guardar')
      const saved = await res.json()
      if (editId) {
        setDevices(ds => ds.map(d => d._id === editId ? saved : d))
      } else {
        setDevices(ds => [...ds, saved])
      }
      setShowModal(false)
      setForm({ plugmodel: '', household_id: '', room: '', appliance: '' })
      setEditId(null)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={handleLogout} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <h1>Dispositivos</h1>
          <NewButton onClick={openNew}>+ Nuevo</NewButton>
          <ul>
            {devices.map(d => (
              <DeviceItem key={d._id}>
                <span>
                  {d.plugmodel} — {d.room} / {d.appliance}
                </span>
                <Actions>
                  <Btn variant="primary" onClick={() => openEdit(d)}>✎</Btn>
                  <Btn onClick={() => deleteDevice(d._id)}>🗑</Btn>
                </Actions>
              </DeviceItem>
            ))}
          </ul>
        </Main>
      </Body>
      <Footer />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>{editId ? 'Editar dispositivo' : 'Crear dispositivo'}</h2>
        <FormGroup>
          <label>Modelo</label>
          <input name="plugmodel" value={form.plugmodel} onChange={onChange}/>
        </FormGroup>
        <FormGroup>
          <label>Hogar</label>
          <select name="household_id" value={form.household_id} onChange={onChange}>
            <option value="">— Selecciona —</option>
            {households.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup>
          <label>Habitación</label>
          <select name="room" value={form.room} onChange={onChange} disabled={!form.household_id}>
            <option value="">— Selecciona —</option>
            {rooms.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup>
          <label>Electrodoméstico</label>
          <input name="appliance" value={form.appliance} onChange={onChange}/>
        </FormGroup>
        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={handleSave}>Guardar</Btn>
        </FormGroup>
      </Modal>
    </AppContainer>
  )
}
