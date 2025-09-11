import express       from 'express'
import cors          from 'cors'
import dotenv        from 'dotenv'
import mongoose      from 'mongoose'
import cookieParser  from 'cookie-parser'
import jwt           from 'jsonwebtoken'

import { authRequired } from './middleware/auth.js'

import User      from './models/User.js'
import Household from './models/Household.js'
import Device    from './models/Device.js'
import Data      from './models/Data.js'
import Alert     from './models/Alert.js'
import Routine   from './models/Routine.js'

dotenv.config()
const app = express()

// ————— CORS + JSON + Cookies —————
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
)
app.use(express.json())
app.use(cookieParser())

// ————— Conexión a MongoDB —————
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✔ Conectado a MongoDB Atlas'))
  .catch(err => console.error('✖ Error de conexión:', err))

// ————— RUTAS PÚBLICAS —————

// Registro
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, household_id } = req.body
    await User.create({ name, email, password, role, household_id })
    res.status(201).json({ message: 'Registrado con éxito' })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' })

    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ error: 'Email o contraseña incorrectos' })

    // firmamos un JWT y lo mandamos por cookie HTTP-only
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 8 * 3600 * 1000
      })
      .json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          household_id: user.household_id
        }
      })
  } catch (e) {
    res.status(500).json({ error: 'Error en el login' })
  }
})

// ————— Middleware de protección —————
app.use(authRequired)

app.use((req, res, next) => {
  console.log(`✓ [${req.method}] ${req.originalUrl} → user ${req.user.sub}`);
  next();
});

// ————— RUTAS USERS —————
app.get('/users', async (req, res) => {
  res.json(await User.find())
})
app.post('/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body
    const u = await User.create({ name, email, role, password })
    res.status(201).json(u)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.get('/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id)
  if (!u) return res.sendStatus(404)
  res.json(u)
})
app.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true, runValidators: true }
    )
    if (!u) return res.sendStatus(404)
    res.json(u)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

// ————— RUTAS HOUSEHOLDS —————

// 1) Crear casa bajo este usuario
app.post('/households', async (req, res) => {
  try {
    const h = await Household.create({
      ...req.body,
      owner: req.user.sub
    })
    res.status(201).json(h)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 2) Listar casas de este usuario
app.get('/households', async (req, res) => {
  const list = await Household
    .find({ owner: req.user.sub })
    .populate('users', 'name email role')
  res.json(list)
})

// 3) Obtener una casa
app.get('/households/:id', async (req, res) => {
  const h = await Household
    .findOne({ _id: req.params.id, owner: req.user.sub })
    .populate('users', 'name email role')
  if (!h) return res.sendStatus(404)
  res.json(h)
})

// 4) Actualizar casa (incluye aquí también renombre de rooms)
app.put('/households/:id', async (req, res) => {
  try {
    // 1) leemos el estado previo para comparar rooms
    const prev = await Household.findById(req.params.id);
    if (!prev || prev.owner.toString() !== req.user.sub) {
      return res.sendStatus(404);
    }

    // 2) actualizamos el household
    const h = await Household.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.sub },
      req.body,
      { new: true, runValidators: true }
    ).populate('users', 'name email role');

    if (!h) return res.sendStatus(404);

    // 3) si nos llegó un array rooms en el body, propagamos renombres
    if (Array.isArray(req.body.rooms)) {
      const oldRooms = Array.isArray(prev.rooms) ? prev.rooms : [];
      const newRooms = req.body.rooms;

      // comparamos hasta la longitud mínima para detectar renombres
      const len = Math.min(oldRooms.length, newRooms.length);
      for (let i = 0; i < len; i++) {
        const oldName = oldRooms[i];
        const newName = newRooms[i];
        if (oldName && newName && oldName !== newName) {
          // por cada device que estuviera en la habitación oldName, lo renombramos
          await Device.updateMany(
            { household_id: h._id, room: oldName },
            { $set: { room: newName } }
          );
        }
      }
    }

    res.json(h);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 5) Borrar casa
app.delete('/households/:id', async (req, res) => {
  const h = await Household.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.sub
  })
  if (!h) return res.sendStatus(404)
  res.sendStatus(204)
})

// 6) Añadir una habitación a la casa
app.put('/households/:id/rooms', async (req, res) => {
  try {
    const h = await Household.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.sub },
      { $push: { rooms: req.body.room } },
      { new: true }
    ).populate('users', 'name email role');
    if (!h) return res.sendStatus(404)
    res.json(h)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ————— RUTAS DEVICES —————
app.post('/devices', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user: req.user.sub
    }
    const d = await Device.create(payload)
    res.status(201).json(d)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.get('/devices', async (req, res) => {
  res.json(await Device.find({ user: req.user.sub }))
})
app.get('/devices/:id', async (req, res) => {
  const d = await Device.findById(req.params.id)
  if (!d) return res.sendStatus(404)
  res.json(d)
})
app.put('/devices/:id', async (req, res) => {
  try {
    const d = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    res.json(d)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.delete('/devices/:id', async (req, res) => {
  await Device.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

// ————— RUTAS DATA —————
app.post('/data', async (req, res) => {
  try {
    const dt = await Data.create(req.body)
    res.status(201).json(dt)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.get('/data', async (req, res) => {
  res.json(await Data.find().sort({ time: -1 }))
})
app.get('/data/:id', async (req, res) => {
  const dt = await Data.findById(req.params.id)
  if (!dt) return res.sendStatus(404)
  res.json(dt)
})
app.put('/data/:id', async (req, res) => {
  try {
    const dt = await Data.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    res.json(dt)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.delete('/data/:id', async (req, res) => {
  await Data.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

// ————— RUTAS ALERTS —————
app.post('/alerts', async (req, res) => {
  try {
    const a = await Alert.create(req.body)
    res.status(201).json(a)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.get('/alerts', async (req, res) => {
  res.json(await Alert.find())
})
app.get('/alerts/:id', async (req, res) => {
  const a = await Alert.findById(req.params.id)
  if (!a) return res.sendStatus(404)
  res.json(a)
})
app.put('/alerts/:id', async (req, res) => {
  try {
    const a = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    res.json(a)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.delete('/alerts/:id', async (req, res) => {
  await Alert.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

// ————— RUTAS ROUTINES —————
app.post('/routines', async (req, res) => {
  try {
    const r = await Routine.create(req.body)
    res.status(201).json(r)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.get('/routines', async (req, res) => {
  res.json(await Routine.find())
})
app.get('/routines/:id', async (req, res) => {
  const r = await Routine.findById(req.params.id)
  if (!r) return res.sendStatus(404)
  res.json(r)
})
app.put('/routines/:id', async (req, res) => {
  try {
    const r = await Routine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    res.json(r)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
app.delete('/routines/:id', async (req, res) => {
  await Routine.findByIdAndDelete(req.params.id)
  res.sendStatus(204)
})

// ————— Iniciar servidor —————
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})
