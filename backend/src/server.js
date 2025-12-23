import express       from 'express'
import cors          from 'cors'
import dotenv        from 'dotenv'
import mongoose      from 'mongoose'
import cookieParser  from 'cookie-parser'
import jwt           from 'jsonwebtoken'

import { authRequired } from './middleware/auth.js'

import User           from './models/User.js'
import Household      from './models/Household.js'
import Device         from './models/Device.js'
import Data           from './models/Data.js'
import Alert          from './models/Alert.js'
import Routine        from './models/Routine.js'
import RoutinePreset  from './models/RoutinePreset.js'

import { getRoutinesStatusForDate } from './services/routineChecker.js'

import alertsRouter            from './routes/alerts.js'
import alertRulesRouter        from './routes/alertRules.js'
import notificationPrefsRouter from './routes/notificationPrefs.js'
import systemSettingsRouter    from './routes/systemSettings.js'
import jobsRouter              from './routes/jobs.js'

// ————— Helpers —————

// Devuelve los _id de los pacientes de un cuidador
async function getCaregiverPatientIds(caregiverId) {
  const ids = await User.find({ caregiver_id: caregiverId, role: 'paciente' }, { _id: 1 }).lean();
  return ids.map(x => x._id);
}

// Valida el owner (paciente) al crear/actualizar
async function validateAndResolveOwner(req, ownerFromBody) {
  // Admin: puede elegir cualquier paciente válido
  if (req.user?.role === 'admin') {
    if (!ownerFromBody || !isValidObjectId(ownerFromBody)) {
      throw new Error('owner inválido');
    }
    const u = await User.findOne({ _id: ownerFromBody, role: 'paciente' });
    if (!u) throw new Error('owner no es un paciente válido');
    return u._id;
  }

  // Cuidador: owner debe ser un paciente suyo
  if (req.user?.role === 'cuidador') {
    if (!ownerFromBody || !isValidObjectId(ownerFromBody)) {
      throw new Error('Debes indicar el paciente (owner) al crear el hogar');
    }
    const u = await User.findOne({ _id: ownerFromBody, role: 'paciente', caregiver_id: req.user.sub });
    if (!u) throw new Error('El owner no es un paciente tuyo');
    return u._id;
  }

  throw new Error('Rol no permitido');
}

// Comprueba si el usuario actual puede acceder a un household
async function canAccessHousehold(req, householdDocOrId) {
  let h = householdDocOrId;
  if (!h || !h.owner) {
    h = await Household.findById(householdDocOrId).lean();
    if (!h) return false;
  }
  const ownerId = h.owner.toString();

  if (req.user?.role === 'admin') return true;
  if (req.user?.role === 'cuidador') {
    const ids = await getCaregiverPatientIds(req.user.sub);
    return ids.map(String).includes(ownerId);
  }
  return false;
}

dotenv.config()
const app = express()
const { isValidObjectId, Types: { ObjectId } } = mongoose;

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

// ==== routers de alertas/sistema (protegidos) ====
app.use('/alerts', alertsRouter)
app.use('/alert-rules', alertRulesRouter)
app.use('/notification-prefs', notificationPrefsRouter)
app.use('/settings', systemSettingsRouter)
app.use('/jobs', jobsRouter)

// ————— RUTAS USERS —————

// LISTAR 
app.get('/users', async (req, res) => {
  try {
    const { role, caregiver_id } = req.query;
    const filter = {};

    if (req.user?.role === 'cuidador') {
      filter.role = 'paciente';
      filter.caregiver_id = req.user.sub;
    } else if (req.user?.role === 'admin') {
      if (role) filter.role = role;
      if (caregiver_id && isValidObjectId(caregiver_id)) {
        filter.caregiver_id = new ObjectId(caregiver_id);
      }
    } else {
      filter._id = req.user.sub;
    }

    const users = await User.find(filter).lean();
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudieron listar usuarios' });
  }
});

// CREAR
app.post('/users', async (req, res) => {
  try {
    const body = req.body || {};

    if (req.user?.role === 'cuidador') {
      body.role = 'paciente';
      body.caregiver_id = req.user.sub;
      if (!body.password) {
        body.password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      }
    }
    const u = await User.create(body);
    res.status(201).json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// OBTENER UNO
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'id inválido' });

  const baseFilter = { _id: id };

  if (req.user?.role === 'cuidador') {
    baseFilter.caregiver_id = req.user.sub;
  } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
    return res.sendStatus(403);
  }

  const u = await User.findOne(baseFilter);
  if (!u) return res.sendStatus(404);
  res.json(u);
});

// EDITAR 
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'id inválido' });

    const allowedForAdmin = ['name','email','role','history','household_id'];
    const allowedForCaregiver = ['name','email','history','household_id']; 
    const allowedForSelf = ['name','email','history','household_id'];      

    let allowed = allowedForAdmin;
    if (req.user?.role === 'cuidador') allowed = allowedForCaregiver;
    else if (req.user?.role !== 'admin' && req.user?.sub === id) allowed = allowedForSelf;

    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    if (Object.keys(update).length === 0)
      return res.status(400).json({ error: 'Sin cambios permitidos' });

    let filter = { _id: id };
    if (req.user?.role === 'cuidador') {
      filter.caregiver_id = req.user.sub;
    } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
      return res.sendStatus(403);
    }

    const u = await User.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    if (!u) return res.sendStatus(404);
    res.json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// BORRAR 
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'id inválido' });

  let filter = { _id: id };

  if (req.user?.role === 'cuidador') {
    filter.caregiver_id = req.user.sub;
  } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
    return res.sendStatus(403);
  }

  const deleted = await User.findOneAndDelete(filter);
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(204);
});

// ————— RUTAS HOUSEHOLDS —————

// 1) Crear casa bajo el paciente (owner) correcto
app.post('/households', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'El nombre del hogar es obligatorio' });

    const owner = await validateAndResolveOwner(req, req.body?.owner);

    const h = await Household.create({
      name,
      address: (req.body?.address || '').trim(),
      rooms: [],
      users: [],
      owner
    });
    res.status(201).json(h);
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ error: 'Ya existe un hogar con ese nombre' });
    return res.status(400).json({ error: e.message || 'No se pudo crear el hogar' });
  }
});

// 2) Listar casas según rol
app.get('/households', async (req, res) => {
  try {
    let filter = {};
    if (req.user?.role === 'admin') {
      // sin filtro
    } else if (req.user?.role === 'paciente') {
      filter.owner = req.user.sub;
    } else if (req.user?.role === 'cuidador') {
      const ids = await getCaregiverPatientIds(req.user.sub);
      filter.owner = { $in: ids };
    } else {
      return res.sendStatus(403);
    }

    const list = await Household
      .find(filter)
      .populate('users', 'name email role')
      .lean();

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron listar hogares' });
  }
});

// 3) Obtener una casa (permiso por rol)
app.get('/households/:id', async (req, res) => {
  try {
    const h = await Household.findById(req.params.id).populate('users', 'name email role');
    if (!h) return res.sendStatus(404);

    if (!(await canAccessHousehold(req, h))) return res.sendStatus(403);
    res.json(h);
  } catch {
    res.sendStatus(404);
  }
});

// 4) Actualizar casa (incluye renombrado de rooms)
app.put('/households/:id', async (req, res) => {
  try {
    const prev = await Household.findById(req.params.id);
    if (!prev) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, prev))) return res.sendStatus(403);

    const h = await Household.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('users', 'name email role');

    if (!h) return res.sendStatus(404);

    // Renombrado de rooms
    if (Array.isArray(req.body.rooms)) {
      const oldRooms = Array.isArray(prev.rooms) ? prev.rooms : [];
      const newRooms = req.body.rooms;

      const len = Math.min(oldRooms.length, newRooms.length);
      for (let i = 0; i < len; i++) {
        const oldName = oldRooms[i];
        const newName = newRooms[i];
        if (oldName && newName && oldName !== newName) {
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
  try {
    const h = await Household.findById(req.params.id);
    if (!h) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, h))) return res.sendStatus(403);

    await Household.deleteOne({ _id: h._id });
    res.sendStatus(204);
  } catch {
    res.sendStatus(400);
  }
});

// 6) Añadir una habitación a la casa
app.put('/households/:id/rooms', async (req, res) => {
  try {
    const hPrev = await Household.findById(req.params.id);
    if (!hPrev) return res.sendStatus(404);
    if (!(await canAccessHousehold(req, hPrev))) return res.sendStatus(403);

    const h = await Household.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { rooms: req.body.room } },
      { new: true }
    ).populate('users', 'name email role');

    if (!h) return res.sendStatus(404);
    res.json(h);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

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

// ————— RUTAS ROUTINES —————
const routinePopulate = [
  { path: 'user_id', select: 'name email role' },
  { path: 'caregiver_id', select: 'name email role' },
  { path: 'household_id', select: 'name' },
  { path: 'device_id', select: 'appliance plugmodel room household_id' }
];

// Crear
app.post('/routines', async (req, res) => {
  try {
    const { device_id, household_id } = req.body;
    const caregiver_id = req.user.sub;

    let hhId = household_id;
    if (!hhId && device_id) {
      const dev = await Device.findById(device_id).lean();
      hhId = dev?.household_id;
    }

    const r = await Routine.create({
      ...req.body,
      caregiver_id,
      household_id: hhId
    });

    await r.populate(routinePopulate);
    res.status(201).json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Listar
app.get('/routines', async (_req, res) => {
  const data = await Routine.find().populate(routinePopulate);
  res.json(data);
});

// Obtener una
app.get('/routines/:id', async (req, res) => {
  const r = await Routine.findById(req.params.id).populate(routinePopulate);
  if (!r) return res.sendStatus(404);
  res.json(r);
});

// Actualizar
app.put('/routines/:id', async (req, res) => {
  try {
    const r = await Routine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(routinePopulate);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// BORRAR
app.delete('/routines/:id', async (req, res) => {
  try {
    await Routine.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ————— RUTINAS: ESTADO POR PACIENTE Y DÍA —————
app.get('/routines/status', async (req, res) => {
  try {
    const { user_id, date } = req.query;
    if (!user_id || !date) {
      return res.status(400).json({ error: 'Faltan user_id o date' });
    }

    if (req.user?.role === 'cuidador') {
      const patient = await User.findOne({ _id: user_id, caregiver_id: req.user.sub });
      if (!patient) return res.status(403).json({ error: 'Paciente no autorizado' });
    }

    const data = await getRoutinesStatusForDate(user_id, date);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener el estado de las rutinas' });
  }
});

// ----- ROUTINE PRESETS -----
app.post('/routine-presets', async (req, res) => {
  try {
    const { name, expected_start, expected_end, days, description } = req.body || {};
    if (!name || !expected_start || !expected_end || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const p = await RoutinePreset.create({
      owner: req.user.sub,
      name: name.trim(),
      expected_start,
      expected_end,
      days,
      description: (description || '').trim()
    });
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/routine-presets', async (req, res) => {
  const list = await RoutinePreset.find({ owner: req.user.sub }).sort({ createdAt: -1 });
  res.json(list);
});

app.get('/routine-presets/:id', async (req, res) => {
  const p = await RoutinePreset.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!p) return res.sendStatus(404);
  res.json(p);
});

app.put('/routine-presets/:id', async (req, res) => {
  try {
    const upd = await RoutinePreset.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.sub },
      req.body,
      { new: true, runValidators: true }
    );
    if (!upd) return res.sendStatus(404);
    res.json(upd);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/routine-presets/:id', async (req, res) => {
  const del = await RoutinePreset.findOneAndDelete({ _id: req.params.id, owner: req.user.sub });
  if (!del) return res.sendStatus(404);
  res.sendStatus(204);
});

// ————— Iniciar servidor —————
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})
