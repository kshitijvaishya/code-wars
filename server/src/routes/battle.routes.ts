import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  createPrivateBattle,
  getBattle,
  getBattleByInviteCode,
  getUserBattleHistory,
  getBattleResult,
} from '../controllers/battle.controller';

const router = Router();

router.post('/', authenticate, createPrivateBattle);
router.get('/history', authenticate, getUserBattleHistory);
router.get('/history/:userId', authenticate, getUserBattleHistory);
router.get('/join/:code', authenticate, getBattleByInviteCode);
router.get('/:id', authenticate, getBattle);
router.get('/:id/result', authenticate, getBattleResult);

export default router;
