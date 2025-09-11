// src/GlobalStyles.jsx
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  html {
    box-sizing: border-box;
    font-family: system-ui, sans-serif;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  body {
    margin: 0;
    background-color: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.fg};
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  button {
    font-family: inherit;
  }
`;
