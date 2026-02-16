import * as routineService from '../services/routineService.js';
import User from '../models/User.js'; // Necesario para validación extra en getRoutinesStatus

export const getRoutines = async (req, res, next) => {
    try {
        const routines = await routineService.getRoutines(req.user, req.query);
        res.json(routines);
    } catch (error) {
        next(error);
    }
};

export const getRoutineById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const routine = await routineService.getRoutineById(id);
        if (!routine) return res.sendStatus(404);
        res.json(routine);
    } catch (error) {
        next(error);
    }
};

export const createRoutine = async (req, res, next) => {
    try {
        const caregiver_id = req.user.sub;
        const body = { ...req.body, caregiver_id };

        if (!body.user_id) return res.status(400).json({ error: 'user_id es obligatorio' });
        if (!body.household_id) return res.status(400).json({ error: 'household_id es obligatorio' });
        if (!Array.isArray(body.occurrences) || body.occurrences.length === 0) {
            return res.status(400).json({ error: 'occurrences es obligatorio y no puede estar vacío' });
        }

        const newRoutine = await routineService.createRoutine(body);
        res.status(201).json(newRoutine);
    } catch (error) {
        next(error);
    }
};

export const updateRoutine = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await routineService.updateRoutine(id, req.body);
        if (!updated) return res.sendStatus(404);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteRoutine = async (req, res, next) => {
    try {
        const { id } = req.params;
        await routineService.deleteRoutine(id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};

export const getStatusByPatient = async (req, res, next) => {
    try {
        const { user_id, date } = req.query;
        if (!user_id || !date) {
            return res.status(400).json({ error: 'Faltan user_id o date' });
        }

        if (req.user?.role === 'cuidador') {
            const patient = await User.findOne({
                _id: user_id,
                caregiver_id: req.user.sub,
            });
            if (!patient) {
                return res.status(403).json({ error: 'Paciente no autorizado' });
            }
        }

        const data = await routineService.getRoutinesStatusForDate(user_id, date);
        res.json(data);
    } catch (error) {
        next(error); // El error 500 se maneja en el middleware global
    }
};
