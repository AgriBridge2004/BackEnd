import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, updateUser } from '../users/users.service.js';
import { sendOtpEmail } from '../config/mailer.js';

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

  // ابعت الإيميل فيه الـ OTP الأصلي (plain)، مش المشفر
  await sendOtpEmail(email, otp);

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

  await sendOtpEmail(email, otp);

  return { message: 'OTP resent successfully' };
};