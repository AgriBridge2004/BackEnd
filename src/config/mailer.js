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

export const sendResetEmail = async (toEmail, resetUrl) => {
  await transporter.sendMail({
    from: `"AgriBridge" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'AgriBridge - Reset Your Password',
    html: `
      <h2>Password Reset Request 🔐</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
      ">Reset Password</a>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
};

export const sendListingExpiredEmail = async (toEmail, listingName) => {
  await transporter.sendMail({
    from: `"AgriBridge" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'AgriBridge - Your Listing Has Expired',
    html: `
      <h2>Listing Expired 🌾</h2>
      <p>Your listing <strong>${listingName}</strong> has expired and is no longer visible in the Marketplace.</p>
      <p>You can create a new listing or reactivate it from your dashboard.</p>
      <p>Thank you for using AgriBridge!</p>
    `,
  });
};