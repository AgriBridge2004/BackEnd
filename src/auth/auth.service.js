import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, updateUser, findUserByResetToken, findUserById } from '../users/users.service.js';
import { sendOtpEmail, sendResetEmail } from '../config/mailer.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '../config/database.js';
import { UserEntity } from '../users/user.entity.js';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async ({ email, password, role }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(
    Date.now() + parseInt(process.env.OTP_EXPIRES_IN_MINUTES) * 60 * 1000
  );

  const user = await createUser({
    email,
    password: hashedPassword,
    role,
    otp: hashedOtp,
    otpExpiresAt,
  });

  sendOtpEmail(email, otp).catch(err => console.error('Failed to send OTP email:', err));

  return { user, otp };
};

export const verifyOtp = async (email, otp) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('User already verified');
  }

  const isOtpValid = await bcrypt.compare(otp, user.otp);
  if (!isOtpValid) {
    throw new Error('Invalid OTP');
  }

  if (new Date() > new Date(user.otpExpiresAt)) {
    throw new Error('OTP expired');
  }

  const updatedUser = await updateUser(user.id, {
    isVerified: true,
    otp: null,
    otpExpiresAt: null,
  });

  return updatedUser;
};

export const resendOtp = async (email) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('User already verified');
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(
    Date.now() + parseInt(process.env.OTP_EXPIRES_IN_MINUTES) * 60 * 1000
  );

  await updateUser(user.id, {
    otp: hashedOtp,
    otpExpiresAt,
  });

  sendOtpEmail(email, otp).catch(err => console.error('Failed to resend OTP email:', err));

 return { otp, message: 'OTP resent successfully' };
};

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.isVerified) {
    throw new Error('Email not verified');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  await updateUser(user.id, { refreshToken });
  return { user, accessToken, refreshToken };
};

export const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await updateUser(user.id, {
    resetPasswordToken: resetToken,
    resetPasswordExpiresAt,
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  sendResetEmail(email, resetUrl).catch(err => console.error('Failed to send reset email:', err));

  return { message: 'Password reset email sent' };
};

export const resetPassword = async (token, newPassword) => {
  const user = await findUserByResetToken(token);

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  if (new Date() > new Date(user.resetPasswordExpiresAt)) {
    throw new Error('Invalid or expired token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await updateUser(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpiresAt: null,
  });

  return { message: 'Password reset successfully' };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await findUserById(decoded.id);

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    if (user.refreshToken !== refreshToken) {
      throw new Error('Refresh token mismatch. Please login again.');
    }

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new Error('Invalid or expired refresh token');
    }
    throw new Error(error.message || 'Failed to refresh token');
  }
};

export const logoutUser = async (userId) => {
  await updateUser(userId, { refreshToken: null });
  return { message: 'Logged out successfully' };
};

// DELETE ACCOUNT SERVICE

export const deleteAccount = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const repo = AppDataSource.getRepository(UserEntity);
  await repo.remove(user);
  return { message: 'Account deleted successfully' };
};