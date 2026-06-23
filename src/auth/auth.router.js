import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  verifyOtpController, 
  resendOtpController, 
  login,
  forgotPasswordController,
  resetPasswordController
} from './auth.controller.js';

const router = Router();

// Rate Limiter للـ login بس
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;