import { Router } from 'express';
import * as alertController from '../controllers/alertController.js';

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/debug/count', alertController.getDebugCount);
router.put('/:id', alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);

export default router;
