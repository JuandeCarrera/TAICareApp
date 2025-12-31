import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home.jsx'
import UsersPage from './pages/UsersPage.jsx'
import Dispositivos from './pages/Dispositivos.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Datos from './pages/Datos.jsx'
import Hogares from './pages/Hogares.jsx'
import Configuracion from './pages/Configuracion.jsx'
import Rutinas from './pages/Rutinas.jsx'
import Alertas from './pages/Alertas.jsx'
import AjustesAlertas from './pages/AjustesAlertas.jsx'
import ReglasAlertas from './pages/ReglasAlertas.jsx'

import { AuthContext } from './contexts/AuthContext.jsx'

function Private({ children }) {
  const { user } = useContext(AuthContext)
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* privadas */}
      <Route path="/" element={<Private><Home /></Private>} />
      <Route path="/pacientes" element={<Private><UsersPage /></Private>} />
      <Route path="/devices" element={<Private><Dispositivos /></Private>} />
      <Route path="/routines" element={<Private><Rutinas /></Private>} />
      <Route path="/data" element={<Private><Datos /></Private>} />
      <Route path="/households" element={<Private><Hogares /></Private>} />
      <Route path="/configuration" element={<Private><Configuracion /></Private>} />

      {/* alertas */}
      <Route path="/alertas" element={<Private><Alertas /></Private>} />
      <Route path="/alertas/ajustes" element={<Private><AjustesAlertas /></Private>} />
      <Route path="/alertas/reglas" element={<Private><ReglasAlertas /></Private>} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
