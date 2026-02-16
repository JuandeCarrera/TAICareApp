import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

// Definición de rutas delegando al controlador
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
