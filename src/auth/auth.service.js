import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../users/users.service.js';

// توليد OTP عشوائي
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async ({ email, password, role }) => {
  // 1 - تحقق إذا الإيميل موجود مسبقاً
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // 2 - شفّر الباسورد
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3 - اعمل OTP
  const otp = generateOTP();
  const otpExpiresAt = new Date(
    Date.now() + parseInt(process.env.OTP_EXPIRES_IN_MINUTES) * 60 * 1000
  );

  // 4 - احفظ المستخدم
  const user = await createUser({
    email,
    password: hashedPassword,
    role,
    otp,
    otpExpiresAt,
  });

  return { user, otp };
};