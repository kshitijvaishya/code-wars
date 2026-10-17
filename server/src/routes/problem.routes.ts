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

const router = Router();

// Public routes
router.get('/', listProblems);
router.get('/:id', getProblem);

// Admin routes
router.get('/admin/list', authenticate, authorize('contest_admin', 'super_admin'), listAdminProblems);
router.get('/admin/:id', authenticate, authorize('contest_admin', 'super_admin'), getAdminProblem);
router.post('/', authenticate, authorize('contest_admin', 'super_admin'), createProblem);
router.put('/:id', authenticate, authorize('contest_admin', 'super_admin'), updateProblem);
router.delete('/:id', authenticate, authorize('super_admin'), deleteProblem);

export default router;
