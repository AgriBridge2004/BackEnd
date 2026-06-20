import { registerUser, verifyOtp, resendOtp } from './auth.service.js';

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

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
    console.error('REGISTER ERROR:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await verifyOtp(email, otp);

    return res.status(200).json({
      message: 'Account verified successfully',
      userId: user.id,
      isVerified: user.isVerified,
    });

  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'User already verified') {
      return res.status(409).json({ message: error.message });
    }
    if (error.message === 'Invalid OTP') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'OTP expired') {
      return res.status(400).json({ message: error.message, canResend: true });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resendOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await resendOtp(email);

    return res.status(200).json({
      message: 'OTP resent successfully. Please check your email.',
    });

  } catch (error) {
    console.error('RESEND OTP ERROR:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'User already verified') {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};