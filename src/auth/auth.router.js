import { Router } from 'express';
import { register, verifyOtpController, resendOtpController } from './auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtpController);
router.post('/resend-otp', resendOtpController);

export default router;