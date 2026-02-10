import React, { useContext } from 'react';
import styled from 'styled-components';
import { FiMenu } from 'react-icons/fi';
import { AuthContext } from '../contexts/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const Bar = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 0 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const ToggleBtn = styled.button`
  position: absolute;
  left: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.fg};
  cursor: pointer;
`;

const LogoutBtn = styled.button`
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

export default function Header({ onToggleMenu }) {
  const { logout } = useContext(AuthContext);
  return (
    <Bar>
      <ToggleBtn onClick={onToggleMenu}>
        <FiMenu />
      </ToggleBtn>
      <ThemeToggle />
      <LogoutBtn onClick={logout}>Cerrar sesión</LogoutBtn>
    </Bar>
  );
}
