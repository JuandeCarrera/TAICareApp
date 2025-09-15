import React, { createContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledProvider } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { GlobalStyles } from './GlobalStyles';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  const toggleTheme = () => {
    setThemeName(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme }}>
      <StyledProvider theme={theme}>
        <GlobalStyles />
        {children}
      </StyledProvider>
    </ThemeContext.Provider>
  );
}