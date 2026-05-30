import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: ${({ open }) => (open ? 1 : 0)};
  pointer-events: ${({ open }) => (open ? 'all' : 'none')};
  transition: opacity 0.2s ease;
`;

const Nav = styled.nav`
  /* Desktop: relative, Mobile: fixed */
  position: ${({ isMobile }) => (isMobile ? 'fixed' : 'relative')};
  top: 0;
  left: 0;
  /* On desktop, fill the Body container (which excludes header+footer).
     On mobile, the sidebar is a fixed overlay that covers everything. */
  height: ${({ isMobile }) => (isMobile ? '100vh' : '100%')};
  z-index: 100;

  width: ${({ open }) => (open ? '240px' : '0')};
  transition: width 0.2s ease;
  background: ${({ theme }) => theme.colors.buttonBg};
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: ${({ isMobile, open }) =>
    isMobile && open ? '4px 0 12px rgba(0,0,0,0.3)' : 'none'};

  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
`;

const Inner = styled.div`
  width: 240px;
  padding: 2rem 1rem;
`;

const Title = styled.h3`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.fg};
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Item = styled.li`
  margin: 0.5rem 0;
`;

const MenuLink = styled(Link)`
  color: ${({ theme }) => theme.colors.fg};
  text-decoration: none;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: rgba(255, 255, 255, 0.05);
  }
`;

export default function Sidebar({ open, onClose }) {
  const isMobile = useIsMobile();

  // Si es mobile y se hace click en un link, cerrar menú
  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <>
      {isMobile && <Backdrop open={open} onClick={onClose} />}
      <Nav open={open} isMobile={isMobile}>
        <Inner open={open}>
          <Title>Menú</Title>
          <List>
            <Item>
              <MenuLink to="/" onClick={handleLinkClick}>
                Home
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/pacientes" onClick={handleLinkClick}>
                Pacientes
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/devices" onClick={handleLinkClick}>
                Dispositivos
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/routines" onClick={handleLinkClick}>
                Rutinas
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/data" onClick={handleLinkClick}>
                Datos
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/alertas" onClick={handleLinkClick}>
                Alertas
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/households" onClick={handleLinkClick}>
                Hogares
              </MenuLink>
            </Item>
            <Item>
              <MenuLink to="/configuration" onClick={handleLinkClick}>
                Configuración
              </MenuLink>
            </Item>
          </List>
        </Inner>
      </Nav>
    </>
  );
}
