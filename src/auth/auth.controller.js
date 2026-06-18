import { registerUser } from './auth.service.js';

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // تحقق من البيانات
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['farmer', 'buyer', 'quality_officer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const { user, otp } = await registerUser({ email, password, role });

    return res.status(201).json({
      message: 'User registered successfully. Check your email for OTP.',
      userId: user.id,
    });

  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};