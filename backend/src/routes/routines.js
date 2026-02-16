import { Router } from 'express';
import * as routineController from '../controllers/routineController.js';

const router = Router();

router.get('/status/by-patient', routineController.getStatusByPatient);
router.get('/', routineController.getRoutines);
router.post('/', routineController.createRoutine);
router.get('/:id', routineController.getRoutineById);
router.put('/:id', routineController.updateRoutine);
router.delete('/:id', routineController.deleteRoutine);

export default router;
