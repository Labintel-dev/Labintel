'use strict';
const { z } = require('zod');

const createPatientSchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Phone must be a valid Indian mobile number in +91XXXXXXXXXX format'),
  full_name:        z.string().min(1).max(200),
  date_of_birth:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  gender:           z.enum(['male', 'female', 'other']).optional(),
  lab_patient_code: z.string().max(50).optional(),
  referred_by:      z.string().max(200).optional(),
});

const updatePatientSchema = z.object({
  full_name:     z.string().min(1).max(200).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender:        z.enum(['male', 'female', 'other']).optional(),
});

module.exports = { createPatientSchema, updatePatientSchema };
