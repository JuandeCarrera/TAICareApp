import { Router } from 'express'
import Routine from '../models/Routine.js'
import Device from '../models/Device.js'
import User from '../models/User.js'
import { getRoutinesStatusForDate } from '../services/routineChecker.js'

const router = Router()

const routinePopulate = [
  { path: 'user_id', select: 'name email role' },
  { path: 'caregiver_id', select: 'name email role' },
  { path: 'household_id', select: 'name' },
  // Popular dispositivos de occurrences:
  { path: 'occurrences.device_ids', select: 'appliance plugmodel room household_id' }
]

router.get('/status/by-patient', async (req, res) => {
  try {
    const { user_id, date } = req.query
    if (!user_id || !date) return res.status(400).json({ error: 'Faltan user_id o date' })

    if (req.user?.role === 'cuidador') {
      const patient = await User.findOne({ _id:user_id, caregiver_id:req.user.sub })
      if (!patient) return res.status(403).json({ error: 'Paciente no autorizado' })
    }

    const data = await getRoutinesStatusForDate(user_id, date)
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'No se pudo obtener el estado de las rutinas' })
  }
})

//Crear
router.post('/', async (req, res) => {
  try {
    const caregiver_id = req.user.sub
    const body = { ...req.body, caregiver_id }

    // Validaciones mínimas:
    if (!body.user_id) return res.status(400).json({ error: 'user_id es obligatorio' })
    if (!body.household_id) return res.status(400).json({ error: 'household_id es obligatorio' })
    if (!Array.isArray(body.occurrences) || body.occurrences.length === 0)
      return res.status(400).json({ error: 'occurrences es obligatorio y no puede estar vacío' })

    const r = await Routine.create(body)
    await r.populate(routinePopulate)
    res.status(201).json(r)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Listar
router.get('/', async (_req, res) => {
  const data = await Routine.find().populate(routinePopulate)
  res.json(data)
})

// Obtener una
router.get('/:id', async (req, res) => {
  const r = await Routine.findById(req.params.id).populate(routinePopulate)
  if (!r) return res.sendStatus(404)
  res.json(r)
})

// Actualizar (permite modificar occurrences completo o parcial)
router.put('/:id', async (req, res) => {
  try {
    const r = await Routine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new:true, runValidators:true }
    ).populate(routinePopulate)
    if (!r) return res.sendStatus(404)
    res.json(r)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Borrar
router.delete('/:id', async (req, res) => {
  try {
    await Routine.findByIdAndDelete(req.params.id)
    res.sendStatus(204)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
