import { Router } from 'express';
import * as deviceController from '../controllers/deviceController.js';

const router = Router();

router.get('/', deviceController.getDevices);
router.post('/', deviceController.createDevice);
router.get('/:id', deviceController.getDeviceById);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

export default router;
