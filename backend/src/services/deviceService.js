import Device from '../models/Device.js';

/**
 * Servicio para gestionar dispositivos.
 */

// Obtener dispositivos del usuario actual
export const getDevices = async (currentUser) => {
    // Mantenemos la lógica existente: filtrar por user = currentUser.sub
    // Podríamos ampliar esto para permitir ver dispositivos de households donde soy miembro/admin
    return await Device.find({ user: currentUser.sub });
};

export const getDeviceById = async (id) => {
    return await Device.findById(id);
};

export const createDevice = async (deviceData) => {
    return await Device.create(deviceData);
};

export const updateDevice = async (id, updateData) => {
    return await Device.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
};

export const deleteDevice = async (id) => {
    return await Device.findByIdAndDelete(id);
};
