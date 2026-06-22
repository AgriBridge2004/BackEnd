import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, verifyOtpController, resendOtpController, login } from './auth.controller.js';

const router = Router();

// Rate Limiter للـ login بس
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // أقصى 5 محاولات
  message: {
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/verify-otp', verifyOtpController);
router.post('/resend-otp', resendOtpController);
router.post('/login', loginLimiter, login);

export default router;