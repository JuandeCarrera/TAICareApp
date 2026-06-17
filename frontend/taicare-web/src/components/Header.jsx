import React, { useContext } from 'react';
import styled from 'styled-components';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { ThemeContext } from '../ThemeContext.jsx';

/* ── Barra ──────────────────────────────────────────────────────────────── */
const Bar = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 0 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/* ── Botón hamburguesa ──────────────────────────────────────────────────── */
const ToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 0;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
    color: ${({ theme }) => theme.colors.text};
  }
`;

/* ── Toggle de tema ─────────────────────────────────────────────────────── */
const ThemeBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/* ── Avatar usuario ─────────────────────────────────────────────────────── */
const UserLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  transition: background 0.15s;
  &:hover {
    background: ${({ theme }) => theme.colors.hoverBg};
    text-decoration: none;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.accent} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  text-transform: uppercase;
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  @media (max-width: 640px) { display: none; }
`;

/* ── Logout ─────────────────────────────────────────────────────────────── */
const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: rgba(239, 68, 68, 0.08);
    border-color: #ef4444;
    color: #ef4444;
  }
  @media (max-width: 640px) {
    padding: 0.4rem;
    span { display: none; }
  }
`;

/* ── Separador ──────────────────────────────────────────────────────────── */
const Divider = styled.div`
  width: 1px;
  height: 22px;
  background: ${({ theme }) => theme.colors.border};
`;

/* ── Componente ─────────────────────────────────────────────────────────── */
export default function Header({ onToggleMenu }) {
  const { logout, user } = useContext(AuthContext);
  const { themeName, toggleTheme } = useContext(ThemeContext);

  const initials = user?.name
    ? user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('')
    : user?.email?.[0] ?? '?';

  const displayName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';

  return (
    <Bar>
      <LeftSection>
        <ToggleBtn onClick={onToggleMenu} aria-label="Abrir/cerrar menú">
          <Menu size={20} strokeWidth={2} />
        </ToggleBtn>
      </LeftSection>

      <RightSection>
        {/* Toggle tema */}
        <ThemeBtn
          onClick={toggleTheme}
          aria-label={themeName === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {themeName === 'dark'
            ? <Sun size={17} strokeWidth={2} />
            : <Moon size={17} strokeWidth={2} />
          }
        </ThemeBtn>

        <Divider />

        {/* Usuario — clickable → /configuration */}
        <UserLink to="/configuration" title="Ir a configuración">
          <Avatar>{initials}</Avatar>
          <UserName>{displayName}</UserName>
        </UserLink>

        <Divider />

        {/* Logout */}
        <LogoutBtn onClick={logout} aria-label="Cerrar sesión">
          <LogOut size={15} strokeWidth={2} />
          <span>Cerrar sesión</span>
        </LogoutBtn>
      </RightSection>
    </Bar>
  );
}
