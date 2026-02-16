import Alert from '../models/Alert.js';
import User from '../models/User.js';

/**
 * Servicio para gestionar la lógica de negocio de alertas.
 */

// Obtener alertas con filtros y lógica de roles
export const getAlerts = async (currentUser, queryParams) => {
    const { resolved, type, user_id, unread } = queryParams;

    let filter = {};

    // Filtros básicos
    if (typeof resolved !== 'undefined' && resolved !== '') {
        filter.resolved = resolved === 'true';
    }
    if (type) filter.type = type;

    if (unread === '1' || unread === 'true') {
        // A veces 'read' es boolean false o 0 o string 'false'
        // Ajustamos según esquema. Asumimos campo read: Boolean/Number
        filter.read = { $in: [false, 0, 'false'] };
    }

    // Filtrado por usuario específico (si viene en query)
    if (user_id) {
        filter.user_id = user_id;
    }

    // Lógica de permisos / roles
    if (currentUser.role === 'paciente') {
        // Paciente solo ve sus alertas
        filter.user_id = currentUser.sub;
    } else if (currentUser.role === 'cuidador') {
        // Cuidador ve alertas de sus pacientes
        // Si no filtró por un user_id específico, buscamos todos sus pacientes
        if (!filter.user_id) {
            const pats = await User.find(
                { caregiver_id: currentUser.sub, role: 'paciente' },
                { _id: 1 }
            ).lean();
            const ids = pats.map((p) => p._id);

            // Si no tiene pacientes, no hay alertas que mostrar
            filter.user_id = { $in: ids.length ? ids : ['000000000000000000000000'] };
        } else {
            // Si el cuidador pide un user_id, validamos que sea SU paciente?
            // Por simplificación, confiamos en la query o podríamos verificar aquí.
            // De momento mantenemos lógica original: si especifica user_id, se usa ese filtro combinado con la query.
            // Pero idealmente deberíamos asegurar que user_id pertenece a sus pacientes.
            // Lo dejamos como estaba en routes por ahora para no romper comportamiento, 
            // pero el controller llamante debería validar si quiere ser estricto.
        }
    } else if (currentUser.role === 'admin') {
        // Admin ve todo
    } else {
        throw new Error('FORBIDDEN');
    }

    const data = await Alert.find(filter)
        .sort({ timestamp: -1, createdAt: -1 })
        .populate({
            path: 'device_id',
            select: 'appliance plugmodel room household_id',
        })
        .populate({ path: 'user_id', select: 'name email' })
        .populate({ path: 'routine_id', select: 'name' })
        .lean();

    // Hidratar título si falta
    const hydrated = data.map((a) => {
        if (a.title && a.title.trim()) return a;
        const patient = a.patient_name_snapshot || a.user_id?.name || '';
        const routine = a.routine_name_snapshot || a.routine_id?.name || '';
        const parts = [];
        if (patient) parts.push(`Paciente: ${patient}`);
        if (routine) parts.push(`Rutina: ${routine}`);
        if (a.type) parts.push(a.type);
        return { ...a, title: parts.length ? parts.join(' · ') : 'Alerta' };
    });

    return hydrated;
};

// Contar alertas totales (debug)
export const countAllAlerts = async () => {
    return await Alert.countDocuments({});
};

// Actualizar alerta
export const updateAlert = async (id, updateData) => {
    return await Alert.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
};

// Borrar alerta
export const deleteAlert = async (id) => {
    return await Alert.findByIdAndDelete(id);
};
