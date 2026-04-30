import { describe, it, expect } from 'vitest';
import reportSchemas from './report.schemas.js';

const { inviteStaffSchema, updateStaffSchema } = reportSchemas;

describe('report schemas role validation', () => {
  it('accepts manager for inviteStaffSchema', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'manager@example.com',
      full_name: 'Manager User',
      role: 'manager',
    });

    expect(result.success).toBe(true);
  });

  it('accepts manager for updateStaffSchema', () => {
    const result = updateStaffSchema.safeParse({ role: 'manager' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid roles', () => {
    const result = inviteStaffSchema.safeParse({
      email: 'bad@example.com',
      full_name: 'Bad Role',
      role: 'owner',
    });

    expect(result.success).toBe(false);
  });
});
