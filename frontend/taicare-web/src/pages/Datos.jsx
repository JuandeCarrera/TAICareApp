import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Main = styled.main`
  flex: 1;
  background: ${({ theme }) => theme.colors.bg};
  padding: 2rem;
  overflow-y: auto;
`;

export default function Datos() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(!isMobile);
  useEffect(() => {
    setMenuOpen(!isMobile);
  }, [isMobile]);

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <Body>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Main>
          <h1>DATOS</h1>
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  );
}
