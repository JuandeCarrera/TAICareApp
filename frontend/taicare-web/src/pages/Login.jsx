import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Activity, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';

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
  max-width: 380px;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 2.5rem 2rem;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  animation: ${fadeUp} 0.35s ease both;
`;

/* ── Cabecera de marca ──────────────────────────────────────────────────── */
const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

const LogoCircle = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
  animation: ${pulse} 3s ease infinite;
`;

const AppName = styled.h1`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text};
`;

const AppSub = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  line-height: 1.4;
`;

/* ── Formulario ─────────────────────────────────────────────────────────── */
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  padding: 0.75rem 1rem 0.75rem 2.6rem;
  border: 1px solid ${({ theme, $error }) => $error ? '#ef4444' : theme.colors.border};
  border-radius: 10px;
  font-size: 0.92rem;
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
  margin: 0;
  font-size: 0.83rem;
  color: #ef4444;
  text-align: center;
  padding: 0.6rem 0.85rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
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
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const FooterText = styled.p`
  text-align: center;
  margin: 1.25rem 0 0;
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
export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      nav('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Card>
        {/* Marca */}
        <Brand>
          <LogoCircle>
            <Activity size={24} color="#fff" strokeWidth={2.5} />
          </LogoCircle>
          <div style={{ textAlign: 'center' }}>
            <AppName>TAICare Visualizer</AppName>
            <AppSub>Plataforma de asistencia y monitorización</AppSub>
          </div>
        </Brand>

        {/* Formulario */}
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Form onSubmit={handleSubmit}>
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
              autoComplete="current-password"
            />
            <EyeBtn
              type="button"
              onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPwd
                ? <EyeOff size={16} strokeWidth={2} />
                : <Eye size={16} strokeWidth={2} />
              }
            </EyeBtn>
          </InputWrap>

          <SubmitBtn type="submit" disabled={loading}>
            <LogIn size={16} strokeWidth={2.5} />
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </SubmitBtn>
        </Form>

        <FooterText>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </FooterText>
      </Card>
    </Wrapper>
  );
}
