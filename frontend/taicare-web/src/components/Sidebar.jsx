import React, { useContext } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Plug,
  Clock,
  BarChart2,
  Bell,
  Home,
  Settings,
  Activity,
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

/* ── Backdrop para mobile ───────────────────────────────────────────────── */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 99;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'all' : 'none')};
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
`;

/* ── Nav ────────────────────────────────────────────────────────────────── */
const Nav = styled.nav`
  position: ${({ $isMobile }) => ($isMobile ? 'fixed' : 'relative')};
  top: 0;
  left: 0;
  height: ${({ $isMobile }) => ($isMobile ? '100vh' : '100%')};
  z-index: 100;
  width: ${({ $open }) => ($open ? '240px' : '0')};
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${({ theme }) => theme.colors.sidebarBg};
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  box-shadow: ${({ $isMobile, $open }) =>
    $isMobile && $open ? '4px 0 24px rgba(0,0,0,0.4)' : 'none'};
  border-right: 1px solid ${({ theme }) => theme.colors.sidebarBorder};

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
`;

const Inner = styled.div`
  width: 240px;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 1.5rem;
`;

/* ── Logo ───────────────────────────────────────────────────────────────── */
const LogoWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1.25rem 1.1rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.sidebarBorder};
  margin-bottom: 0.5rem;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
`;

const LogoText = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.sidebarTextActive};
  letter-spacing: -0.02em;
  white-space: nowrap;
`;

/* ── Sección de nav ─────────────────────────────────────────────────────── */
const SectionLabel = styled.div`
  padding: 0.75rem 1.1rem 0.3rem;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.55);
  white-space: nowrap;
`;

const List = styled.ul`
  list-style: none;
  padding: 0 0.6rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

/* ── Ítem de menú ───────────────────────────────────────────────────────── */
const MenuLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
  position: relative;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarTextActive : theme.colors.sidebarText};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActive : 'transparent'};

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.sidebarActive : theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.sidebarTextActive};
    text-decoration: none;
  }

  /* Barra activa izquierda */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: ${({ theme }) => theme.colors.primary};
    opacity: ${({ $active }) => ($active ? 1 : 0)};
    transition: opacity 0.15s;
  }
`;

const IconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'inherit'};
`;

/* ── Nav items config ───────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/home',         label: 'Inicio',                  Icon: LayoutDashboard },
  { to: '/pacientes',     label: 'Personas en seguimiento', Icon: Users           },
  { to: '/households',    label: 'Hogares',                 Icon: Home            },
  { to: '/alertas',       label: 'Alertas',                 Icon: Bell            },
  { to: '/routines',      label: 'Rutinas',                 Icon: Clock           },
  { to: '/data',          label: 'Estadísticas',            Icon: BarChart2       },
  { to: '/devices',       label: 'Dispositivos',            Icon: Plug            },
  { to: '/configuration', label: 'Configuración',           Icon: Settings        },
];

/* ── Componente ─────────────────────────────────────────────────────────── */
export default function Sidebar({ open, onClose }) {
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <>
      {isMobile && <Backdrop $open={open} onClick={onClose} />}
      <Nav $open={open} $isMobile={isMobile}>
        <Inner>
          {/* Logo */}
          <LogoWrap>
            <LogoIcon>
              <Activity size={17} color="#fff" strokeWidth={2.5} />
            </LogoIcon>
            <LogoText style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1 }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>TAICare</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Visualizer</span>
            </LogoText>
          </LogoWrap>

          {/* Navegación */}
          <SectionLabel>Menú</SectionLabel>
          <List>
            {NAV_ITEMS.map(({ to, label, Icon }) => {
              const isActive =
                to === '/home'
                  ? location.pathname === '/home'
                  : location.pathname.startsWith(to);
              return (
                <li key={to}>
                  <MenuLink
                    to={to}
                    $active={isActive}
                    onClick={handleLinkClick}
                  >
                    <IconWrap $active={isActive}>
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </IconWrap>
                    {label}
                  </MenuLink>
                </li>
              );
            })}
          </List>
        </Inner>
      </Nav>
    </>
  );
}
