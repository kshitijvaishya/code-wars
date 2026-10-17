import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import {
  getUserProfile,
  updateProfile,
  getRatingHistory,
  getLeaderboard,
  suspendUser,
  unsuspendUser,
} from '../controllers/user.controller';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/me/rating-history', authenticate, (req, res, next) => {
  req.params.id = req.user!.userId;
  getRatingHistory(req, res, next);
});
router.get('/:id', getUserProfile);
router.get('/:id/rating-history', getRatingHistory);
router.put('/me', authenticate, updateProfile);
router.post('/:id/suspend', authenticate, authorize('super_admin'), suspendUser);
router.post('/:id/unsuspend', authenticate, authorize('super_admin'), unsuspendUser);

export default router;
