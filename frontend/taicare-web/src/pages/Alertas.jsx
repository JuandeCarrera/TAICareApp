// src/pages/Alertas.jsx
import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header   from '../components/Header.jsx'
import Sidebar  from '../components/Sidebar.jsx'
import Footer   from '../components/Footer.jsx'

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

// Lista
const List = styled.ul`
  padding: 0;
  list-style: none;
`
const AlertItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.cardBg};
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
`
const Left = styled.div`
  display: flex;
  align-items: center;
`
const Dot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: red;
  margin-right: 0.75rem;
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

export default function Alertas() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)
  const [alerts, setAlerts]     = useState([])

  useEffect(() => {
    loadAlerts()
  }, [])

  async function loadAlerts() {
    const res = await fetch(`${API}/alerts`, { credentials:'include' })
    if (!res.ok) return
    setAlerts(await res.json())
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  async function markSeen(id) {
    await fetch(`${API}/alerts/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ seen: true })
    })
    setAlerts(as => as.map(a => a._id === id ? { ...a, seen: true } : a))
  }

  async function deleteAlert(id) {
    if (!confirm('¿Borrar esta alerta?')) return
    const res = await fetch(`${API}/alerts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (res.ok) setAlerts(as => as.filter(a => a._id !== id))
  }

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen(o => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen}/>
        <Main>
          <h1>Alertas</h1>
          <List>
            {alerts.map(a => (
              <AlertItem key={a._id}>
                <Left>
                  {!a.seen && <Dot/>}
                  <div>
                    <p><strong>{a.title || 'Alerta'}</strong></p>
                    <p>{a.message}</p>
                  </div>
                </Left>
                <Actions>
                  {!a.seen && (
                    <Btn
                      variant="primary"
                      onClick={() => markSeen(a._id)}
                    >
                      ✓
                    </Btn>
                  )}
                  <Btn onClick={() => deleteAlert(a._id)}>🗑</Btn>
                </Actions>
              </AlertItem>
            ))}
          </List>
        </Main>
      </Body>
      <Footer/>
    </AppContainer>
  )
}
