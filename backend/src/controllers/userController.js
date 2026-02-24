import mongoose from 'mongoose';
import * as userService from '../services/userService.js';

const {
    isValidObjectId,
    Types: { ObjectId },
} = mongoose;

/**
 * Obtener lista de usuarios con filtros según rol.
 */
export const getUsers = async (req, res, next) => {
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
            // Paciente solo se ve a sí mismo
            filter._id = req.user.sub;
        }

        const users = await userService.getAllUsers(filter);
        res.json(users);
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener un usuario por ID.
 */
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificación de permisos
        if (req.user?.role === 'cuidador') {
            if (user.caregiver_id?.toString() !== req.user.sub) {
                return res.sendStatus(403);
            }
        } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
            return res.sendStatus(403);
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * Crear un nuevo usuario.
 */
export const createUser = async (req, res, next) => {
    try {
        const body = req.body || {};

        // Lógica específica para cuidadores creando pacientes
        if (req.user?.role === 'cuidador') {
            body.role = 'paciente';
            body.caregiver_id = req.user.sub;
            if (!body.password) {
                // Generar contraseña aleatoria si no se provee
                body.password =
                    Math.random().toString(36).slice(2) +
                    Math.random().toString(36).slice(2);
            }
        }

        const newUser = await userService.createUser(body);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar un usuario existente.
 */
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        // Definir campos permitidos según rol
        const allowedForAdmin = ['name', 'email', 'role', 'history', 'household_id', 'vacation_mode', 'alert_preferences', 'alert_preferences_configured'];
        const allowedForCaregiver = ['name', 'email', 'history', 'household_id', 'vacation_mode', 'alert_preferences', 'alert_preferences_configured'];
        const allowedForSelf = ['name', 'email', 'history', 'household_id', 'alert_preferences', 'alert_preferences_configured'];

        let allowed = allowedForAdmin;
        if (req.user?.role === 'cuidador') allowed = allowedForCaregiver;
        else if (req.user?.role !== 'admin' && req.user?.sub === id) {
            allowed = allowedForSelf;
        } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
            // Si no es admin y no es self, podría ser cuidador intentando editar a alguien que no es su paciente
            // Pero eso se valida abajo con el filtro.
            // De momento asumimos que si no cae en los casos anteriores, es un acceso indebido si no es cuidador.
            if (req.user?.role !== 'cuidador') return res.sendStatus(403);
        }

        const updateData = {};
        for (const k of allowed) {
            if (k in req.body) updateData[k] = req.body[k];
        }

        if (!Object.keys(updateData).length) {
            return res.status(400).json({ error: 'Sin cambios permitidos o válidos' });
        }

        const filter = {};
        if (req.user?.role === 'cuidador') {
            filter.caregiver_id = req.user.sub;
        } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
            // Validación extra por si acaso, aunque arriba ya se filtran permisos
            return res.sendStatus(403);
        }

        // Si es self o admin, el filtro es vacio (solo ID que pasa el servicio)

        const updatedUser = await userService.updateUser(id, updateData, filter);
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado o no autorizado' });
        }

        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar un usuario.
 */
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const filter = {};
        if (req.user?.role === 'cuidador') {
            filter.caregiver_id = req.user.sub;
        } else if (req.user?.role !== 'admin' && req.user?.sub !== id) {
            return res.sendStatus(403);
        }

        const deletedUser = await userService.deleteUser(id, filter);
        if (!deletedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado o no autorizado' });
        }

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
