import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { getAuditLogs, getDashboardStats, listUsers } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('contest_admin', 'super_admin'));

router.get('/stats', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.get('/users', authorize('super_admin'), listUsers);

export default router;
