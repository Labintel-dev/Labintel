'use strict';
const { z } = require('zod');

const staffLoginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  slug:     z.string().min(1).max(50).nullable().optional(),
  role:     z.enum(['manager', 'receptionist', 'technician']).optional(),
});

const sendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Phone must be a valid Indian mobile number in +91XXXXXXXXXX format'),
});

const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Phone must be a valid Indian mobile number in +91XXXXXXXXXX format'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

module.exports = { staffLoginSchema, sendOtpSchema, verifyOtpSchema };
