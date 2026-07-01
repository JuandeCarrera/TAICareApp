import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  Activity,
  Bell,
  Clock,
  BarChart2,
  ShieldCheck,
  Users,
  ArrowRight,
  Plug,
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';

/* ── Animaciones ─────────────────────────────────────────────────────────── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Página ──────────────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: #f8fafc;
  color: #1e293b;
  font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden;
`;

/* ── Navbar ──────────────────────────────────────────────────────────────── */
const Navbar = styled.nav`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2.5rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const LogoIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoLabel = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1;
  gap: 1px;
  span:first-child {
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
  }
  span:last-child {
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: rgba(255,255,255,0.6);
  }
`;

const NavActions = styled.div`
  display: flex;
  gap: 0.6rem;
`;

const NavBtn = styled.button`
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;

  ${({ $primary }) =>
    $primary
      ? `
    background: #fff;
    color: #2563eb;
    &:hover { background: #eff6ff; }
  `
      : `
    background: rgba(255,255,255,0.18);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.35);
    &:hover { background: rgba(255,255,255,0.28); }
  `}
`;

/* ── Hero con imagen ─────────────────────────────────────────────────────── */
const Hero = styled.section`
  position: relative;
  height: 90vh;
  min-height: 560px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
`;

const HeroImg = styled.div`
  position: absolute;
  inset: 0;
  background-image: url('/hero_caregiver.png');
  background-size: cover;
  background-position: center 20%;
  filter: brightness(0.72);
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(15, 40, 90, 0.25) 0%,
    rgba(15, 40, 90, 0.72) 70%,
    rgba(15, 40, 90, 0.9) 100%
  );
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 0 2.5rem 4.5rem;
  max-width: 700px;
  animation: ${fadeUp} 0.8s ease both;
`;

const HeroTag = styled.span`
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #bfdbfe;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  margin-bottom: 1.25rem;
`;

const HeroTitle = styled.h1`
  font-size: clamp(1.9rem, 4.5vw, 3rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.18;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
`;

const HeroSub = styled.p`
  font-size: 1.05rem;
  color: rgba(255,255,255,0.78);
  line-height: 1.7;
  margin: 0 0 2.25rem;
  max-width: 520px;
`;

const HeroBtns = styled.div`
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
`;

const HeroBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.8rem 1.75rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.18s;

  ${({ $primary }) =>
    $primary
      ? `
    background: #2563eb;
    color: #fff;
    box-shadow: 0 4px 18px rgba(37,99,235,0.4);
    &:hover { background: #1d4ed8; transform: translateY(-1px); }
  `
      : `
    background: rgba(255,255,255,0.12);
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.4);
    &:hover { background: rgba(255,255,255,0.22); }
  `}
`;

/* ── Stats strip ─────────────────────────────────────────────────────────── */
const StatsStrip = styled.div`
  display: flex;
  gap: 0;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
`;

const Stat = styled.div`
  flex: 1;
  min-width: 160px;
  padding: 1.5rem 2rem;
  border-right: 1px solid #e2e8f0;
  &:last-child { border-right: none; }
`;

const StatNum = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: #2563eb;
  line-height: 1;
  margin-bottom: 0.3rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
`;

/* ── Features ────────────────────────────────────────────────────────────── */
const Section = styled.section`
  padding: 5rem 2.5rem;
  max-width: 1100px;
  margin: 0 auto;
`;

const SectionEyebrow = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
  margin: 0 0 0.6rem;
`;

const SectionHeading = styled.h2`
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem;
  letter-spacing: -0.01em;
`;

const SectionSub = styled.p`
  font-size: 1rem;
  color: #64748b;
  max-width: 520px;
  line-height: 1.7;
  margin: 0 0 3rem;
`;

const FeatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.25rem;
`;

const FeatCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.6rem;
  transition: box-shadow 0.2s, transform 0.2s;
  animation: ${fadeUp} 0.6s ease both;
  animation-delay: ${({ $d }) => $d || '0s'};

  &:hover {
    box-shadow: 0 8px 28px rgba(0,0,0,0.08);
    transform: translateY(-3px);
  }
`;

const FeatIconWrap = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const FeatTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
`;

const FeatDesc = styled.p`
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.65;
  margin: 0;
`;

/* ── CTA section ─────────────────────────────────────────────────────────── */
const CtaSection = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #0891b2 100%);
  padding: 4.5rem 2.5rem;
  text-align: center;
`;

const CtaTitle = styled.h2`
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.75rem;
`;

const CtaSub = styled.p`
  color: rgba(255,255,255,0.75);
  font-size: 1rem;
  margin: 0 0 2rem;
  line-height: 1.6;
`;

const CtaBtns = styled.div`
  display: flex;
  gap: 0.85rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const CtaBtn = styled.button`
  padding: 0.85rem 2rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.18s;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  ${({ $primary }) =>
    $primary
      ? `
    background: #fff;
    color: #2563eb;
    &:hover { background: #eff6ff; transform: translateY(-1px); }
  `
      : `
    background: transparent;
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.5);
    &:hover { background: rgba(255,255,255,0.1); }
  `}
`;

/* ── Footer ──────────────────────────────────────────────────────────────── */
const Footer = styled.footer`
  background: #0f172a;
  color: #475569;
  text-align: center;
  font-size: 0.8rem;
  padding: 1.5rem 2rem;
`;

/* ── Datos ───────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: Bell, bg: '#fef2f2', iconColor: '#ef4444',
    title: 'Alertas automáticas',
    desc: 'El sistema detecta si una rutina no se ha completado y notifica al cuidador en tiempo real, sin necesidad de revisar manualmente.',
    d: '0s',
  },
  {
    Icon: Clock, bg: '#eff6ff', iconColor: '#3b82f6',
    title: 'Rutinas personalizadas',
    desc: 'Cada persona tiene sus propios hábitos. Define los horarios esperados y deja que el sistema los monitorice por ti.',
    d: '0.1s',
  },
  {
    Icon: BarChart2, bg: '#f0fdf4', iconColor: '#22c55e',
    title: 'Histórico de actividad',
    desc: 'Consulta el consumo eléctrico de cada electrodoméstico y visualiza el comportamiento a lo largo del tiempo.',
    d: '0.2s',
  },
  {
    Icon: Plug, bg: '#fdf4ff', iconColor: '#a855f7',
    title: 'Enchufes inteligentes',
    desc: 'Tecnología no invasiva. Solo se analiza el consumo eléctrico — sin cámaras, sin micrófonos, con total privacidad.',
    d: '0.3s',
  },
  {
    Icon: Users, bg: '#fff7ed', iconColor: '#f97316',
    title: 'Varios pacientes',
    desc: 'Gestiona el seguimiento de varias personas desde un mismo panel, con vistas individuales y resumen global.',
    d: '0.4s',
  },
  {
    Icon: ShieldCheck, bg: '#f0f9ff', iconColor: '#0ea5e9',
    title: 'Acceso seguro',
    desc: 'Autenticación con JWT y cookies seguras. Los datos de cada paciente solo son visibles para su cuidador asignado.',
    d: '0.5s',
  },
];

/* ── Componente ──────────────────────────────────────────────────────────── */
export default function Landing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/home', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  return (
    <Page>
      {/* Navbar flotante sobre la imagen */}
      <Navbar>
        <Logo>
          <LogoIcon>
            <Activity size={17} color="#fff" strokeWidth={2.5} />
          </LogoIcon>
          <LogoLabel>
            <span>TAICare</span>
            <span>Visualizer</span>
          </LogoLabel>
        </Logo>
        <NavActions>
          <NavBtn onClick={() => navigate('/login')}>Iniciar sesión</NavBtn>
          <NavBtn $primary onClick={() => navigate('/register')}>Registrarse</NavBtn>
        </NavActions>
      </Navbar>

      {/* Hero con foto de fondo */}
      <Hero>
        <HeroImg />
        <HeroOverlay />
        <HeroContent>
          <HeroTag>Monitorización del hogar · No invasiva</HeroTag>
          <HeroTitle>
            Cuida a las personas mayores<br />estés donde estés
          </HeroTitle>
          <HeroSub>
            TAICare Visualizer convierte los datos de enchufes inteligentes en información
            útil para cuidadores. Sin cámaras, sin sensores complejos — solo electricidad.
          </HeroSub>
          <HeroBtns>
            <HeroBtn $primary onClick={() => navigate('/login')}>
              Empezar ahora <ArrowRight size={16} />
            </HeroBtn>
            <HeroBtn onClick={() => navigate('/register')}>
              Crear cuenta
            </HeroBtn>
          </HeroBtns>
        </HeroContent>
      </Hero>

      {/* Stats strip */}
      <StatsStrip>
        <Stat>
          <StatNum>24/7</StatNum>
          <StatLabel>Monitorización continua</StatLabel>
        </Stat>
        <Stat>
          <StatNum>0</StatNum>
          <StatLabel>Cámaras ni micrófonos</StatLabel>
        </Stat>
        <Stat>
          <StatNum>∞</StatNum>
          <StatLabel>Rutinas configurables</StatLabel>
        </Stat>
        <Stat>
          <StatNum>100%</StatNum>
          <StatLabel>Datos bajo tu control</StatLabel>
        </Stat>
      </StatsStrip>

      {/* Features */}
      <Section>
        <SectionEyebrow>Funcionalidades</SectionEyebrow>
        <SectionHeading>Todo lo que necesitas en un solo lugar</SectionHeading>
        <SectionSub>
          Diseñado para cuidadores que quieren estar informados sin agobiar a las
          personas que cuidan. Simple, discreto y eficaz.
        </SectionSub>
        <FeatGrid>
          {FEATURES.map(({ Icon, bg, iconColor, title, desc, d }) => (
            <FeatCard key={title} $d={d}>
              <FeatIconWrap $bg={bg}>
                <Icon size={19} color={iconColor} strokeWidth={2} />
              </FeatIconWrap>
              <FeatTitle>{title}</FeatTitle>
              <FeatDesc>{desc}</FeatDesc>
            </FeatCard>
          ))}
        </FeatGrid>
      </Section>

      {/* CTA final */}
      <CtaSection>
        <CtaTitle>¿Listo para empezar?</CtaTitle>
        <CtaSub>
          Configura tu cuenta en minutos y empieza a monitorizar el hogar de tus pacientes hoy mismo.
        </CtaSub>
        <CtaBtns>
          <CtaBtn $primary onClick={() => navigate('/register')}>
            Crear cuenta gratis <ArrowRight size={16} />
          </CtaBtn>
          <CtaBtn onClick={() => navigate('/login')}>
            Ya tengo cuenta
          </CtaBtn>
        </CtaBtns>
      </CtaSection>

      {/* Footer */}
      <Footer>
        TAICare Visualizer · Trabajo Fin de Grado · Universidad de Castilla-La Mancha · 2025–2026
      </Footer>
    </Page>
  );
}
