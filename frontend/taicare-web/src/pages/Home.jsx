import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer from '../components/Footer.jsx'

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

export default function Home() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)

  useEffect(() => {
    setMenuOpen(window.innerWidth >= 768)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <section style={{
            background: theme => theme.colors.cardBg,
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h2>Hola, {user.name}</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rol:</strong> {user.role}</p>
          </section>

          <h1>¡Bienvenido a TAICareApp!</h1>
          <p>Esta es la página de inicio.</p>
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  )
}
