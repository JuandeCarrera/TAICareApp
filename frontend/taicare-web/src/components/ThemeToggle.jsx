import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../ThemeContext.jsx';

const Button = styled.button`
  background: ${({ theme }) => theme.colors.buttonBg};
  color: ${({ theme }) => theme.colors.buttonFg};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
`;

export default function ThemeToggle() {
  const { themeName, toggleTheme } = useContext(ThemeContext);
  return (
    <Button onClick={toggleTheme}>
      {themeName === 'dark' ? '🌞 Claro' : '🌙 Oscuro'}
    </Button>
  );
}
