import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Home from './pages/Home.jsx';
import UsersPage from './pages/UsersPage.jsx';
import Dispositivos from './pages/Dispositivos.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Landing from './pages/Landing.jsx';
import Datos from './pages/Datos.jsx';
import Hogares from './pages/Hogares.jsx';
import Configuracion from './pages/Configuracion.jsx';
import Rutinas from './pages/Rutinas.jsx';
import Alertas from './pages/Alertas.jsx';

import ReglasAlertas from './pages/ReglasAlertas.jsx';
import AlertSetupPage from './pages/AlertSetupPage.jsx';

import { AuthContext } from './contexts/AuthContext.jsx';

const CAREGIVER_ROLES = ['cuidador', 'admin'];
const SETUP_PATH = '/alertas/setup';

function Private({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  // Redirect caregivers/admins to setup if they haven't configured alerts yet
  const skipSetup = sessionStorage.getItem('skipSetup');
  const needsSetup =
    CAREGIVER_ROLES.includes(user.role) &&
    user.alert_preferences_configured === false &&
    !skipSetup &&
    location.pathname !== SETUP_PATH;

  if (needsSetup) return <Navigate to={SETUP_PATH} replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* privadas */}
      <Route
        path="/home"
        element={
          <Private>
            <Home />
          </Private>
        }
      />
      <Route
        path="/pacientes"
        element={
          <Private>
            <UsersPage />
          </Private>
        }
      />
      <Route
        path="/devices"
        element={
          <Private>
            <Dispositivos />
          </Private>
        }
      />
      <Route
        path="/routines"
        element={
          <Private>
            <Rutinas />
          </Private>
        }
      />
      <Route
        path="/data"
        element={
          <Private>
            <Datos />
          </Private>
        }
      />
      <Route
        path="/households"
        element={
          <Private>
            <Hogares />
          </Private>
        }
      />
      <Route
        path="/configuration"
        element={
          <Private>
            <Configuracion />
          </Private>
        }
      />

      {/* alertas */}
      <Route
        path="/alertas"
        element={
          <Private>
            <Alertas />
          </Private>
        }
      />

      <Route
        path="/alertas/reglas"
        element={
          <Private>
            <ReglasAlertas />
          </Private>
        }
      />
      <Route
        path="/alertas/setup"
        element={
          <Private>
            <AlertSetupPage />
          </Private>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
