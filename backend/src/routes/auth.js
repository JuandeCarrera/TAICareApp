import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

// Registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, household_id } = req.body
    await User.create({ name, email, password, role, household_id })
    res.status(201).json({ message: 'Registrado con éxito' })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Login
router.post('/login', async (req, res) => {
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
      .cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8*3600*1000 })
      .json({ user: { _id:user._id, name:user.name, email:user.email, role:user.role, household_id:user.household_id } })
  } catch (e) {
    res.status(500).json({ error: 'Error en el login' })
  }
})

export default router