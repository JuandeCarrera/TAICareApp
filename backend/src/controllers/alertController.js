import mongoose from 'mongoose';
import * as alertService from '../services/alertService.js';

export const getAlerts = async (req, res, next) => {
  try {
    if (
      req.query.user_id &&
      !mongoose.Types.ObjectId.isValid(req.query.user_id)
    ) {
      return res.status(400).json({ error: 'user_id inválido' });
    }
    // req.user viene del middleware de auth
    const alerts = await alertService.getAlerts(req.user, req.query);
    res.json(alerts);
  } catch (error) {
    if (error.message === 'FORBIDDEN') {
      return res.sendStatus(403);
    }
    next(error);
  }
};

export const getDebugCount = async (req, res, next) => {
  try {
    const total = await alertService.countAllAlerts();
    res.json({ total });
  } catch (error) {
    next(error);
  }
};

export const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await alertService.updateAlert(id, req.body);
    if (!alert) return res.sendStatus(404);
    res.json(alert);
  } catch (error) {
    next(error);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Opcional: Validar propiedad (si el usuario puede borrar esta alerta)
    // El código original no tenía validación estricta de ownership en delete,
    // confiamos en que el frontend no muestre botones de borrar si no debe.
    await alertService.deleteAlert(id);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
