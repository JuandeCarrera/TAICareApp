import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { toTitleCase, formatEmail } from '../utils/formatters.js';

const router = Router();

// Registro
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, household_id } = req.body;

    // Validaciones de seguridad
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: 'Formato de correo electrónico inválido' });
    }

    if (name) name = toTitleCase(name);
    if (email) email = formatEmail(email);

    await User.create({ name, email, password, role, household_id });
    res.status(201).json({ message: 'Registrado con éxito' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        maxAge: 8 * 3600 * 1000,
      })
      .json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          household_id: user.household_id,
          alert_preferences_configured: user.alert_preferences_configured,
        },
      });
  } catch (e) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

// Recuperar sesión desde cookie (usado al recargar la página)
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Sesión expirada' });
    }

    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar sesión' });
  }
});

// Logout: borra la cookie del servidor también
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
  res.json({ message: 'Sesión cerrada' });
});

export default router;
