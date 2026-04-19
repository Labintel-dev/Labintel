'use strict';
const { z } = require('zod');

const testValueInputSchema = z.object({
  parameter_id: z.string().uuid('parameter_id must be a valid UUID'),
  value:        z.number({ required_error: 'value is required', invalid_type_error: 'value must be a number' }),
});

const createReportSchema = z.object({
  panel_id:     z.string().uuid('panel_id must be a valid UUID'),
  patient_id:   z.string().uuid('patient_id must be a valid UUID'),
  collected_at: z.string().datetime({ offset: true }).optional(),
  values:       z.array(testValueInputSchema).min(1, 'At least one test value is required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'in_review', 'released'], {
    errorMap: () => ({ message: "Status must be 'draft', 'in_review', or 'released'" }),
  }),
});

const createParameterSchema = z.object({
  name:           z.string().min(1).max(200),
  unit:           z.string().max(50).optional(),
  ref_min_male:   z.number().optional(),
  ref_max_male:   z.number().optional(),
  ref_min_female: z.number().optional(),
  ref_max_female: z.number().optional(),
  max_plausible:  z.number().optional(),
  sort_order:     z.number().int().default(0),
});

const createPanelSchema = z.object({
  name:       z.string().min(1).max(200),
  short_code: z.string().max(20).optional(),
  price:      z.number().nonnegative().optional(),
  parameters: z.array(createParameterSchema).min(1, 'At least one parameter is required'),
});

const updatePanelSchema = z.object({
  name:       z.string().min(1).max(200).optional(),
  short_code: z.string().max(20).optional(),
  price:      z.number().nonnegative().optional(),
  is_active:  z.boolean().optional(),
  parameters: z.array(createParameterSchema).optional(),
});

const updateLabSchema = z.object({
  name:          z.string().min(1).max(200).optional(),
  phone:         z.string().max(20).optional(),
  address:       z.string().optional(),
  logo_url:      z.string().url().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color like #1A5276').optional(),
});

const inviteStaffSchema = z.object({
  email:     z.string().email(),
  full_name: z.string().min(1).max(100),
  role:      z.enum(['manager', 'receptionist', 'technician']),
});

const updateStaffSchema = z.object({
  role:      z.enum(['manager', 'receptionist', 'technician']).optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  createReportSchema,
  updateStatusSchema,
  createPanelSchema,
  updatePanelSchema,
  updateLabSchema,
  inviteStaffSchema,
  updateStaffSchema,
};
