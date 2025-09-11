import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../contexts/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { FiEye, FiEyeOff } from 'react-icons/fi'; 

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToggleWrapper = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
`;

const Card = styled.div`
  width: 100%;
  max-width: 360px;
  background: ${({ theme }) => theme.colors.cardBg};
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.fg};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.buttonBg};
  color: ${({ theme }) => theme.colors.fg};
`;

const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const EyeButton = styled.button`
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.fg};
`;

const Button = styled.button`
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const Footer = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.fg};
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
  }
`;

export default function Register() {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [error, setError]             = useState(null);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConf]    = useState(false);

  const { register } = useContext(AuthContext);
  const nav          = useNavigate();

  const validatePassword = pwd => {
    // mínimo 8, con mayúscula, minúscula y número
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.');
      return;
    }

    try {
      await register({ name, email, password, role: 'paciente' });
      nav('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Wrapper>
      <ToggleWrapper>
        <ThemeToggle />
      </ToggleWrapper>

      <Card>
        <Title>Crear cuenta</Title>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <PasswordWrapper>
            <Input
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <EyeButton type="button" onClick={() => setShowPwd(prev => !prev)}>
              {showPwd ? <FiEyeOff size={20}/> : <FiEye size={20}/>}
            </EyeButton>
          </PasswordWrapper>

          <PasswordWrapper>
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <EyeButton type="button" onClick={() => setShowConf(prev => !prev)}>
              {showConfirm ? <FiEyeOff size={20}/> : <FiEye size={20}/>}
            </EyeButton>
          </PasswordWrapper>

          <Button type="submit">Registrarse</Button>
        </Form>

        <Footer>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </Footer>
      </Card>
    </Wrapper>
  );
}
