import { Router } from 'express';
import * as householdController from '../controllers/householdController.js';

const router = Router();

router.post('/', householdController.create);
router.get('/', householdController.list);
router.get('/:id', householdController.get);
router.put('/:id', householdController.update);
router.delete('/:id', householdController.remove);
router.put('/:id/rooms', householdController.addRoom);

export default router;
