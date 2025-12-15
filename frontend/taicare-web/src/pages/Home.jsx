import React, { useContext, useEffect, useState } from 'react'
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
  padding: 1.5rem;
  overflow-y: auto;
`

/* ---------- Layout del dashboard ---------- */
const Shell = styled.div`
  /* contenedor con borde redondeado como en el mockup */
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  padding: 1rem;
`

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Card = styled.section`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 1rem;
  min-height: 160px;
  display: flex;
  flex-direction: column;
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .5rem;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.text};
  }
`

const AddBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s ease;

  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
`

const CardBody = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
  opacity: .85;
  text-align: center;
`

const ChartsBand = styled.section`
  margin-top: 1rem;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 1rem;
  min-height: 240px;
`

const ChartsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .5rem;

  h3 {
    margin: 0;
    font-size: 1.05rem;
  }
`

export default function Home() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const onResize = () => setMenuOpen(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={handleLogout} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <Shell>
            <TopGrid>
              {/* Próximas rutinas */}
              <Card>
                <CardHeader>
                  <h3>Próximas rutinas</h3>
                  <AddBtn title="Añadir rutina">＋</AddBtn>
                </CardHeader>
                <CardBody>
                  {/* Placeholder: más adelante listaremos las próximas rutinas */}
                  <span>Aquí verás las rutinas próximas de tus pacientes.</span>
                </CardBody>
              </Card>

              {/* Alertas */}
              <Card>
                <CardHeader>
                  <h3>Alertas</h3>
                  <AddBtn title="Crear alerta manual">＋</AddBtn>
                </CardHeader>
                <CardBody>
                  {/* Placeholder: KPIs/listado compacto de alertas */}
                  <span>Resumen de alertas pendientes y recientes.</span>
                </CardBody>
              </Card>
            </TopGrid>

            {/* Charts (vacío por ahora) */}
            <ChartsBand>
              <ChartsHeader>
                <h3>Charts</h3>
                <AddBtn title="Añadir chart">＋</AddBtn>
              </ChartsHeader>
              <div style={{
                height: '180px',
                border: `1px dashed rgba(0,0,0,.2)`,
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                opacity: .6
              }}>
                (aquí insertaremos los charts de MongoDB Charts)
              </div>
            </ChartsBand>
          </Shell>
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  )
}
