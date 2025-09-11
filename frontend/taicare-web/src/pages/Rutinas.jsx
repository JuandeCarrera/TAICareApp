// src/pages/Rutinas.jsx
import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header  from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer  from '../components/Footer.jsx'

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

// Lista de rutinas
const List = styled.ul`
  list-style: none;
  padding: 0;
`
const RoutineItem = styled.li`
  background: ${({ theme }) => theme.colors.cardBg};
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
`
const Title = styled.strong`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
`
const Description = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

export default function Rutinas() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)
  const [routines, setRoutines] = useState([])

  useEffect(() => {
    setMenuOpen(window.innerWidth >= 768)
    loadRoutines()
  }, [])

  async function loadRoutines() {
    const res = await fetch(`${API}/routines`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    setRoutines(data)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={handleLogout}/>
      <Body>
        <Sidebar open={menuOpen}/>
        <Main>
          <h1>Rutinas</h1>
          <List>
            {routines.map(r => (
              <RoutineItem key={r._id}>
                <Title>{r.name || `Rutina ${r._id}`}</Title>
                {r.description && <Description>{r.description}</Description>}
              </RoutineItem>
            ))}
          </List>
        </Main>
      </Body>
      <Footer/>
    </AppContainer>
  )
}
