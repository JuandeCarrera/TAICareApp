import React, { useContext } from 'react';
import styled from 'styled-components';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../ThemeContext.jsx';

const Button = styled.button`
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

export default function ThemeToggle() {
  const { themeName, toggleTheme } = useContext(ThemeContext);
  return (
    <Button
      onClick={toggleTheme}
      aria-label={themeName === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {themeName === 'dark'
        ? <Sun size={17} strokeWidth={2} />
        : <Moon size={17} strokeWidth={2} />
      }
    </Button>
  );
}
