import * as deviceService from '../services/deviceService.js';

export const getDevices = async (req, res, next) => {
    try {
        const devices = await deviceService.getDevices(req.user);
        res.json(devices);
    } catch (error) {
        next(error);
    }
};

export const getDeviceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const device = await deviceService.getDeviceById(id);
        if (!device) return res.sendStatus(404);
        res.json(device);
    } catch (error) {
        next(error);
    }
};

export const createDevice = async (req, res, next) => {
    try {
        const payload = { ...req.body, user: req.user.sub };
        const newDevice = await deviceService.createDevice(payload);
        res.status(201).json(newDevice);
    } catch (error) {
        // Manejo básico de error de validación
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

export const updateDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await deviceService.updateDevice(id, req.body);
        if (!updated) return res.sendStatus(404);
        res.json(updated);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

export const deleteDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deviceService.deleteDevice(id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
