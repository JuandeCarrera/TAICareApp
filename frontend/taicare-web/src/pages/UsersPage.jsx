import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import Header   from '../components/Header.jsx'
import Sidebar  from '../components/Sidebar.jsx'
import Footer   from '../components/Footer.jsx'
import Modal, { FormGroup } from '../components/Modal.jsx'
import { AuthContext } from '../contexts/AuthContext.jsx'

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
const Row = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.25rem;
  height: 100%;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  overflow: auto;
`
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
`
const PatientItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  padding: .5rem .6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ selected, theme }) => selected ? theme.colors.hoverBg : theme.colors.cardBg};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg }; }
  & + & { margin-top: .5rem; }
`
const Left = styled.span`
  display: flex;
  align-items: center;
  gap: .5rem;
  overflow: hidden;
  > strong, > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`
const Right = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
`
const Dot = styled.span`
  display: inline-block;
  width: 8px; height: 8px;
  background: #e00;
  border-radius: 999px;
  margin-left: .25rem;
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
  margin: .5rem 0 1rem;
`
const Section = styled.section`
  & + & { margin-top: 1rem; }
`
const SectionHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem;
`

export default function UsersPage() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)

  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const [unread, setUnread] = useState({}) 
  const [routines, setRoutines] = useState([])
  const [alerts, setAlerts]     = useState([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name:'', email:'', role:'paciente', household_id:'', history:'' })

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      setLoading(true)
      const res = await fetch(`${API}/users`, { credentials: 'include' })
      if (!res.ok) throw new Error('No se pudieron cargar los pacientes')
      const data = await res.json()
      setPatients(data)
      if (data?.length && !selectedId) {
        setSelectedId(data[0]._id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedId) return
    loadUnreadCount(selectedId)
    loadRoutines(selectedId)
    loadAlerts(selectedId)
  }, [selectedId])

  async function loadUnreadCount(userId) {
    try {
      let res = await fetch(`${API}/alerts/count?user_id=${userId}&unread=1`, { credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setUnread(u => ({ ...u, [userId]: d?.count ?? 0 }))
        return
      }
      res = await fetch(`${API}/alerts?user_id=${userId}&unread=1`, { credentials: 'include' })
      if (res.ok) {
        const arr = await res.json()
        setUnread(u => ({ ...u, [userId]: Array.isArray(arr) ? arr.length : 0 }))
      }
    } catch (e) {
      console.warn('No pude obtener no leídas', e)
    }
  }
  async function loadRoutines(userId) {
    try {
      const res = await fetch(`${API}/routines?user_id=${userId}`, { credentials:'include' })
      if (!res.ok) { setRoutines([]); return }
      setRoutines(await res.json())
    } catch { setRoutines([]) }
  }
  async function loadAlerts(userId) {
    try {
      const res = await fetch(`${API}/alerts?user_id=${userId}`, { credentials:'include' })
      if (!res.ok) { setAlerts([]); return }
      setAlerts(await res.json())
    } catch { setAlerts([]) }
  }

  const handleLogout = () => {
    logout(); navigate('/login')
  }

  const openNew = () => {
    setEditId(null)
    setForm({ name:'', email:'', role:'paciente', household_id:'', history:'' })
    setShowEditModal(true)
  }
  const openEditPatient = (p) => {
    setEditId(p._id)
    setForm({
      name: p.name || '',
      email: p.email || '',
      role: p.role || 'paciente',
      household_id: p.household_id || '',
      history: p.history || ''
    })
    setShowEditModal(true)
  }
  const openEditHistory = (p) => {
    setEditId(p._id)
    setForm(f => ({ ...f, history: p.history || '' }))
    setShowHistoryModal(true)
  }

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const savePatient = async () => {
    try {
      const payload = { name: form.name, email: form.email, role: form.role, household_id: form.household_id, history: form.history }
      let res
      if (editId) {
        res = await fetch(`${API}/users/${editId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${API}/users`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(payload)
        })
      }
      if (!res.ok) throw new Error('Error al guardar el paciente')
      const saved = await res.json()
      setPatients(list => {
        if (editId) return list.map(x => x._id === editId ? saved : x)
        return [...list, saved]
      })
      setShowEditModal(false)
      setEditId(null)
      if (!selectedId) setSelectedId(saved._id)
    } catch (e) {
      alert(e.message)
    }
  }

  const saveHistoryOnly = async () => {
    try {
      if (!editId) return
      const res = await fetch(`${API}/users/${editId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ history: form.history })
      })
      if (!res.ok) throw new Error('Error al guardar la historia clínica')
      const saved = await res.json()
      setPatients(list => list.map(x => x._id === editId ? saved : x))
      setShowHistoryModal(false)
      if (selectedId === editId) {
      }
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={handleLogout} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <h1>Pacientes</h1>

          <Row>
            {/* Columna izquierda: listado */}
            <Card>
              <NewButton onClick={openNew}>+ Nuevo paciente</NewButton>
              {loading ? <p>Cargando…</p> : (
                <List>
                  {patients.map(p => (
                    <PatientItem
                      key={p._id}
                      selected={p._id === selectedId}
                      onClick={() => setSelectedId(p._id)}
                    >
                      <Left>
                        <strong>{p.name || '(Sin nombre)'}</strong>
                        <span style={{ opacity:.8, fontSize:'.9rem' }}>{p.email}</span>
                        { (unread[p._id] ?? 0) > 0 && <Dot title={`${unread[p._id]} notificaciones sin leer`} /> }
                      </Left>
                      <Right>
                        <Btn onClick={(e) => { e.stopPropagation(); openEditPatient(p) }}>✎ Editar</Btn>
                        <Btn onClick={(e) => { e.stopPropagation(); openEditHistory(p) }}>📝 Historia</Btn>
                      </Right>
                    </PatientItem>
                  ))}
                  {!patients.length && <p style={{opacity:.7}}>No hay pacientes aún.</p>}
                </List>
              )}
            </Card>

            {/* Columna derecha: detalle seleccionado */}
            <Card>
              {!selectedId ? (
                <p>Selecciona un paciente del listado.</p>
              ) : (
                <>
                  <Section>
                    <SectionHeader>
                      <h3 style={{ margin: 0 }}>Rutinas</h3>
                    </SectionHeader>
                    {!routines.length ? (
                      <p style={{opacity:.7}}>Sin rutinas para este paciente.</p>
                    ) : (
                      <ul>
                        {routines.map(r => (
                          <li key={r._id}>
                            <strong>{r.name || '(Rutina)'}</strong>{' '}
                            <span style={{opacity:.8}}>
                              {r.expected_start}–{r.expected_end} · {Array.isArray(r.days) ? r.days.join(', ') : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section>
                    <SectionHeader>
                      <h3 style={{ margin: 0 }}>Notificaciones</h3>
                    </SectionHeader>
                    {!alerts.length ? (
                      <p style={{opacity:.7}}>Sin notificaciones.</p>
                    ) : (
                      <ul>
                        {alerts.map(a => (
                          <li key={a._id}>
                            <strong>{a.type || 'Alerta'}</strong>{' '}
                            <span style={{opacity:.8}}>{new Date(a.time || a.created_at || a.date).toLocaleString()}</span>
                            {a.read ? null : <Dot title="Sin leer" style={{ marginLeft: 6 }} />}
                            {a.message ? <div style={{opacity:.9}}>{a.message}</div> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                </>
              )}
            </Card>
          </Row>
        </Main>
      </Body>
      <Footer />

      {/* Modal crear/editar paciente */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2>{editId ? 'Editar paciente' : 'Nuevo paciente'}</h2>
        <FormGroup>
          <label>Nombre</label>
          <input name="name" value={form.name} onChange={onChange} />
        </FormGroup>
        <FormGroup>
          <label>Email</label>
          <input name="email" value={form.email} onChange={onChange} />
        </FormGroup>
        <FormGroup>
          <label>Rol</label>
          <select name="role" value={form.role} onChange={onChange}>
            <option value="paciente">Paciente</option>
            <option value="cuidador">Cuidador</option>
          </select>
        </FormGroup>
        <FormGroup>
          <label>Hogar (opcional)</label>
          <input name="household_id" value={form.household_id} onChange={onChange} placeholder="ObjectId del hogar" />
        </FormGroup>
        <FormGroup>
          <label>Historia clínica (opcional)</label>
          <textarea name="history" rows="4" value={form.history} onChange={onChange} />
        </FormGroup>
        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={savePatient}>Guardar</Btn>
        </FormGroup>
      </Modal>

      {/* Modal historia clínica rápida */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        <h2>Historia clínica</h2>
        <FormGroup>
          <textarea name="history" rows="8" value={form.history} onChange={onChange} />
        </FormGroup>
        <FormGroup style={{ textAlign: 'right' }}>
          <Btn variant="primary" onClick={saveHistoryOnly}>Guardar</Btn>
        </FormGroup>
      </Modal>
    </AppContainer>
  )
}
