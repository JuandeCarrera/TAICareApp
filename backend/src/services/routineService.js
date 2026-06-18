import Routine from '../models/Routine.js';
import User from '../models/User.js';
import { getRoutinesStatusForDate } from './routineChecker.js';

export { getRoutinesStatusForDate };

const routinePopulate = [
  { path: 'user_id', select: 'name email role' },
  { path: 'caregiver_id', select: 'name email role' },
  { path: 'household_id', select: 'name' },
  {
    path: 'occurrences.device_ids',
    select: 'appliance plugmodel room household_id',
  },
];

/**
 * Servicio para gestionar rutinas.
 */

export const createRoutine = async (routineData) => {
  const r = await Routine.create(routineData);
  await r.populate(routinePopulate);
  return r;
};

export const getRoutines = async (currentUser, queryParams) => {
  const { user_id } = queryParams;
  const filter = {};

  if (user_id) {
    filter.user_id = user_id;
  }

  // Seguridad básica por roles (similar a usuarios/alertas)
  if (currentUser.role === 'paciente') {
    filter.user_id = currentUser.sub;
  } else if (currentUser.role === 'cuidador') {
    // Si no filtra por usuario, mostrar solo de sus pacientes?
    // Mantenemos comportamiento "abierto" para admin/cuidador si no especifican,
    // o restringimos al cuidador a sus pacientes.
    // Lo ideal es restringir.
    if (!user_id) {
      // Buscar Ids de sus pacientes
      // Esto puede ser pesado si tiene muchos, pero es lo seguro.
      // Si el frontend siempre manda user_id, esto no se ejecuta mucho.
      const pats = await User.find({ caregiver_id: currentUser.sub }, '_id');
      filter.user_id = { $in: pats.map((p) => p._id) };
    }
  }
  // Admin ve todo (si no hay filtro user_id)

  return await Routine.find(filter).populate(routinePopulate);
};

export const getRoutineById = async (id) => {
  return await Routine.findById(id).populate(routinePopulate);
};

export const updateRoutine = async (id, updateData) => {
  return await Routine.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate(routinePopulate);
};

export const deleteRoutine = async (id) => {
  return await Routine.findByIdAndDelete(id);
};
