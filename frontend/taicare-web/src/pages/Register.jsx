import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Activity, User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { ROLES } from '../constants/index.js';

/* ── Animaciones ────────────────────────────────────────────────────────── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`;

/* ── Layout ─────────────────────────────────────────────────────────────── */
const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) =>
    theme.isDark
      ? theme.colors.bg
      : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #e6fffa 100%)'};
  padding: 1.5rem;
`;

/* ── Card ───────────────────────────────────────────────────────────────── */
const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 2.25rem 2rem;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  animation: ${fadeUp} 0.35s ease both;
`;

/* ── Cabecera ───────────────────────────────────────────────────────────── */
const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
`;

const LogoCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
  animation: ${pulse} 3s ease infinite;
`;

const AppName = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text};
`;

const AppSub = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

/* ── Formulario ─────────────────────────────────────────────────────────── */
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 0.85rem;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.72rem 1rem 0.72rem 2.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 0.9rem;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.7;
  }
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight};
  }
`;

const EyeBtn = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

const ErrorMsg = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.83rem;
  color: #ef4444;
  text-align: center;
  padding: 0.6rem 0.85rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
`;

const HintText = styled.p`
  margin: 0;
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 0 0.25rem;
`;

const SubmitBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.accent} 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: opacity 0.15s, transform 0.15s;
  &:hover { opacity: 0.92; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
`;

const FooterText = styled.p`
  text-align: center;
  margin: 1.1rem 0 0;
  font-size: 0.86rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

/* ── Componente ─────────────────────────────────────────────────────────── */
export default function Register() {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [showCfm, setShowCfm]       = useState(false);
  const [error, setError]           = useState(null);

  const { register } = useContext(AuthContext);
  const nav = useNavigate();

  const validatePassword = (pwd) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden'); return; }
    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.');
      return;
    }
    try {
      await register({ name, email, password, role: ROLES.CAREGIVER });
      nav('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Wrapper>
      <Card>
        <Brand>
          <LogoCircle>
            <Activity size={22} color="#fff" strokeWidth={2.5} />
          </LogoCircle>
          <div style={{ textAlign: 'center' }}>
            <AppName>TAICare</AppName>
            <AppSub>Crear una nueva cuenta</AppSub>
          </div>
        </Brand>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Form onSubmit={handleSubmit}>
          <InputWrap>
            <InputIcon><User size={16} strokeWidth={2} /></InputIcon>
            <Input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </InputWrap>

          <InputWrap>
            <InputIcon><Mail size={16} strokeWidth={2} /></InputIcon>
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </InputWrap>

          <InputWrap>
            <InputIcon><Lock size={16} strokeWidth={2} /></InputIcon>
            <Input
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <EyeBtn type="button" onClick={() => setShowPwd(v => !v)}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </EyeBtn>
          </InputWrap>
          <HintText>Mínimo 8 caracteres, con mayúsculas, minúsculas y números.</HintText>

          <InputWrap>
            <InputIcon><Lock size={16} strokeWidth={2} /></InputIcon>
            <Input
              type={showCfm ? 'text' : 'password'}
              placeholder="Repetir contraseña"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              autoComplete="new-password"
            />
            <EyeBtn type="button" onClick={() => setShowCfm(v => !v)}>
              {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
            </EyeBtn>
          </InputWrap>

          <SubmitBtn type="submit">
            <UserPlus size={16} strokeWidth={2.5} />
            Crear cuenta
          </SubmitBtn>
        </Form>

        <FooterText>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </FooterText>
      </Card>
    </Wrapper>
  );
}
