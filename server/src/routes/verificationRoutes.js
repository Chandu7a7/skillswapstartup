import express from 'express';
import { generateTest, submitTest } from '../controllers/verificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/test/:skill', generateTest);
router.post('/submit/:skill', submitTest);

export default router;