import { useState, useContext } from 'react';
import { useNavigate, Link }     from 'react-router-dom';
import styled                    from 'styled-components';
import { AuthContext }           from '../contexts/AuthContext.jsx';
import ThemeToggle               from '../components/ThemeToggle.jsx';

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bg};
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
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.buttonBg};
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
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
  }
`;

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const { login }               = useContext(AuthContext);
  const nav                     = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
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
        <Title>Iniciar sesión</Title>
        {error && <p style={{ color:'red', textAlign:'center' }}>{error}</p>}
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Button type="submit">Entrar</Button>
        </Form>
        <Footer>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </Footer>
      </Card>
    </Wrapper>
  );
}
