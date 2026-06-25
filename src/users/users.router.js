import { Router } from 'express';
import { completeOnboardingController } from './users.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /users/onboarding/complete:
 *   patch:
 *     summary: Mark onboarding as completed
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding completed successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/onboarding/complete', authMiddleware, completeOnboardingController);

export default router;