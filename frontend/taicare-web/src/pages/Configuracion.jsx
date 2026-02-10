import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Footer from '../components/Footer.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;
const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;
const Main = styled.main`
  flex: 1;
  background: ${({ theme }) => theme.colors.bg};
  padding: 2rem;
  overflow-y: auto;
`;

const Section = styled.section`
  width: 480px;
  /* se quitó el margin: 0 auto para que no esté centrada */
  margin: 0 0 2rem 0;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 1.5rem;
  border-radius: 6px;
`;
const Field = styled.div`
  margin-bottom: 1rem;
`;
const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;
const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
`;
const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;
const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  ${({ variant, theme }) =>
    variant === 'primary'
      ? `
    background: ${theme.colors.primary};
    color: white;
  `
      : `
    background: ${theme.colors.cardBg};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};
  `}
  &:hover {
    opacity: 0.9;
  }
`;
const DangerBtn = styled(Button)`
  border: 1px solid #ef4444;
  color: #fff;
  background: #e04848;
  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;

export default function Configuracion() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    oldPassword: '',
    newPassword: '',
    confirmNew: '',
    currentPassword: '',
  });
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
  };
  const handleCancel = () => {
    setEditing(false);
    setForm({
      name: user.name,
      email: user.email,
      oldPassword: '',
      newPassword: '',
      confirmNew: '',
      currentPassword: '',
    });
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (form.newPassword) {
      if (form.newPassword !== form.confirmNew) {
        setError('Las nuevas contraseñas no coinciden');
        return;
      }
      if (!form.oldPassword) {
        setError('Introduce tu contraseña actual para cambiarla');
        return;
      }
    }
    if (!form.currentPassword) {
      setError('Introduce tu contraseña para confirmar cambios');
      return;
    }

    try {
      const res1 = await fetch(`${API}/users/${user._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      if (!res1.ok) {
        const { error } = await res1.json();
        throw new Error(error || 'Error actualizando perfil');
      }

      if (form.newPassword) {
        const res2 = await fetch(`${API}/auth/change-password`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldPassword: form.oldPassword,
            newPassword: form.newPassword,
            currentPassword: form.currentPassword,
          }),
        });
        if (!res2.ok) {
          const { error } = await res2.json();
          throw new Error(error || 'Error cambiando contraseña');
        }
      }

      setUser({ ...user, name: form.name, email: form.email });
      setEditing(false);
      setForm((f) => ({
        ...f,
        oldPassword: '',
        newPassword: '',
        confirmNew: '',
        currentPassword: '',
      }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <AppContainer>
      <Header
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onLogout={handleLogout}
      />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <h1>CONFIGURACIÓN</h1>

          <Section>
            {!editing ? (
              <>
                <p>
                  <strong>Nombre:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <Actions>
                  <Button variant="primary" onClick={handleEdit}>
                    Editar perfil
                  </Button>
                </Actions>
              </>
            ) : (
              <>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <Field>
                  <Label>Nombre</Label>
                  <Input name="name" value={form.name} onChange={onChange} />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input name="email" value={form.email} onChange={onChange} />
                </Field>
                <Field>
                  <Label>Contraseña actual</Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={onChange}
                  />
                </Field>
                <Field>
                  <Label>Nueva contraseña (opcional)</Label>
                  <Input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={onChange}
                  />
                </Field>
                {form.newPassword && (
                  <Field>
                    <Label>Confirma nueva contraseña</Label>
                    <Input
                      type="password"
                      name="confirmNew"
                      value={form.confirmNew}
                      onChange={onChange}
                    />
                  </Field>
                )}
                <Actions>
                  <DangerBtn onClick={handleCancel}>Cancelar</DangerBtn>
                  <Button variant="primary" onClick={handleSave}>
                    Guardar
                  </Button>
                </Actions>
              </>
            )}
          </Section>

          {/*
          <Section>
            <h2>Idioma</h2>
            <Field>
              <Label>Selecciona idioma</Label>
              <select>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </Field>
          </Section>
          */}
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  );
}
