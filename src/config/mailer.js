import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"AgriBridge" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'AgriBridge - Verify your account',
    html: `
      <h2>Welcome to AgriBridge 🌾</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This code expires in ${process.env.OTP_EXPIRES_IN_MINUTES} minutes.</p>
    `,
  });
};