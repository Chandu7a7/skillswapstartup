// server/src/routes/adminRoutes.js
import express from 'express';
import { getSiteStats, getUserSignupsByDay ,getSwapStatusDistribution } from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', getSiteStats);
router.get('/stats/user-signups', getUserSignupsByDay);
router.get('/stats/swap-distribution', getSwapStatusDistribution);

export default router;