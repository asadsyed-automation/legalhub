const { z } = require('zod');
const { ALLOWED_REGISTRATION_ROLES } = require('../../constants/roles');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(128, { message: 'Password cannot exceed 128 characters' }),
  role: z
    .enum(ALLOWED_REGISTRATION_ROLES, {
      errorMap: () => ({
        message: `Role must be one of: 'client', 'lawyer', or 'law_firm'. Admin accounts cannot be created via registration.`
      })
    })
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' })
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase()
});

const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
  code: z
    .string({ required_error: 'Verification code is required' })
    .trim()
    .regex(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits' }),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(128, { message: 'Password cannot exceed 128 characters' })
});

const verifyEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
  code: z
    .string({ required_error: 'Verification code is required' })
    .trim()
    .regex(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits' })
});

const resendCodeSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase()
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendCodeSchema
};
