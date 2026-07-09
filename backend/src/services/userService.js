import User from '../models/User.js';
import Household from '../models/Household.js';

/**
 * Servicio para gestionar la lógica de negocio de usuarios.
 */
export const getAllUsers = async (filter) => {
  return await User.find(filter).lean();
};

export const getUserById = async (id) => {
  return await User.findById(id);
};

export const createUser = async (userData) => {
  const user = await User.create(userData);

  // Sincronizar con Hogar si se asignó
  if (user.household_id) {
    const updateObj = { $addToSet: { users: user._id } };
    if (user.role === 'paciente') {
      updateObj.$set = { owner: user._id };
    }
    await Household.findByIdAndUpdate(user.household_id, updateObj);
  }

  return user;
};

export const updateUser = async (id, updateData, filter = {}) => {
  // Obtener usuario previo para detectar cambios de hogar
  const prevUser = await User.findOne({ _id: id, ...filter });
  if (!prevUser) return null;

  const query = { _id: id, ...filter };
  const updatedUser = await User.findOneAndUpdate(query, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) return null;

  // Si cambió el household_id, actualizar referencias en Household
  if (Object.prototype.hasOwnProperty.call(updateData, 'household_id')) {
    const oldHid = prevUser.household_id?.toString();
    const newHid = updatedUser.household_id?.toString();

    if (oldHid !== newHid) {
      // Quitar del viejo
      if (oldHid) {
        await Household.findByIdAndUpdate(oldHid, {
          $pull: { users: id },
        });
      }
      // Poner en el nuevo
      if (newHid) {
        const updateObj = { $addToSet: { users: id } };
        if (updatedUser.role === 'paciente') {
          updateObj.$set = { owner: id };
        }
        await Household.findByIdAndUpdate(newHid, updateObj);
      }
    }
  }

  return updatedUser;
};

export const deleteUser = async (id, filter = {}) => {
  const query = { _id: id, ...filter };
  const deleted = await User.findOneAndDelete(query);

  if (deleted && deleted.household_id) {
    await Household.findByIdAndUpdate(deleted.household_id, {
      $pull: { users: id },
    });
  }

  return deleted;
};
