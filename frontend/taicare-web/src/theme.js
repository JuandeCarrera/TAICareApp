// ─── TAICare Design System — Paleta azul/teal médica ─────────────────────────
// Sustituye la paleta genérica de Vite (#646cff) por colores con identidad propia.
// El sidebar usa siempre fondo oscuro (#0f172a) independientemente del modo.

export const lightTheme = {
  isDark: false,
  colors: {
    // Backgrounds
    bg:              '#f0f4f8',   // Gris azulado suave (no blanco puro)
    cardBg:          '#ffffff',
    surface:         '#e8eef4',   // Superficie ligeramente más oscura que bg

    // Texto
    text:            '#0f172a',   // Slate-900
    textSecondary:   '#475569',   // Slate-600
    fg:              '#0f172a',

    // Marca
    primary:         '#0ea5e9',   // Sky-500 — azul médico
    primaryDark:     '#0284c7',   // Sky-600 — hover
    primaryLight:    '#e0f2fe',   // Sky-100 — fondos sutiles
    accent:          '#14b8a6',   // Teal-500 — complemento

    // Estado
    success:         '#10b981',
    warning:         '#f59e0b',
    error:           '#ef4444',

    // UI
    border:          '#cbd5e1',   // Slate-300
    hoverBg:         '#e2e8f0',
    buttonBg:        '#ffffff',
    buttonFg:        '#0f172a',

    // Sidebar — modo claro: fondo claro
    sidebarBg:       '#ffffff',
    sidebarText:     '#475569',
    sidebarTextActive:'#0f172a',
    sidebarHover:    'rgba(0,0,0,0.04)',
    sidebarActive:   'rgba(14,165,233,0.1)',
    sidebarBorder:   '#e2e8f0',
  },
};

export const darkTheme = {
  isDark: true,
  colors: {
    // Backgrounds
    bg:              '#0f172a',   // Slate-900
    cardBg:          '#1e293b',   // Slate-800
    surface:         '#334155',   // Slate-700

    // Texto
    text:            '#f1f5f9',   // Slate-100
    textSecondary:   '#94a3b8',   // Slate-400
    fg:              '#f1f5f9',

    // Marca
    primary:         '#38bdf8',   // Sky-400 — más brillante sobre oscuro
    primaryDark:     '#0ea5e9',   // Sky-500
    primaryLight:    'rgba(56,189,248,0.12)',
    accent:          '#2dd4bf',   // Teal-400

    // Estado
    success:         '#34d399',
    warning:         '#fbbf24',
    error:           '#f87171',

    // UI
    border:          '#334155',   // Slate-700
    hoverBg:         '#1e293b',
    buttonBg:        '#1e293b',
    buttonFg:        '#f1f5f9',

    // Sidebar — también oscuro (igual que el bg general en dark)
    sidebarBg:       '#0a1120',   // Ligeramente más oscuro que bg
    sidebarText:     '#94a3b8',
    sidebarTextActive:'#ffffff',
    sidebarHover:    'rgba(255,255,255,0.06)',
    sidebarActive:   'rgba(56,189,248,0.15)',
    sidebarBorder:   'rgba(255,255,255,0.06)',
  },
};
