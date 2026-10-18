import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  getAdminProblem,
  listAdminProblems,
} from '../controllers/problem.controller';
import { validate } from '../middleware/validate';
import { createProblemSchema, updateProblemSchema } from '../utils/problemValidation';

const router = Router();

// Admin routes
router.get('/admin/list', authenticate, authorize('contest_admin', 'super_admin'), listAdminProblems);
router.get('/admin/:id', authenticate, authorize('contest_admin', 'super_admin'), getAdminProblem);
router.post('/', authenticate, authorize('contest_admin', 'super_admin'), validate(createProblemSchema), createProblem);
router.put('/:id', authenticate, authorize('contest_admin', 'super_admin'), validate(updateProblemSchema), updateProblem);
router.delete('/:id', authenticate, authorize('super_admin'), deleteProblem);

// Public routes
router.get('/', listProblems);
router.get('/:id', getProblem);

export default router;
