
import { registerUser, verifyOtp, resendOtp, loginUser, forgotPassword, resetPassword } from './auth.service.js';

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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    if (error.message === 'Email not verified') {
      return res.status(403).json({ message: error.message });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await forgotPassword(email);

    return res.status(200).json({
      message: 'Password reset email sent. Please check your inbox.',
    });

  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    // ما بنكشف إذا الإيميل موجود أو لأ — أمان أكتر
    return res.status(200).json({
      message: 'Password reset email sent. Please check your inbox.',
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    await resetPassword(token, newPassword);

    return res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
    });

  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    if (error.message === 'Invalid or expired token') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};