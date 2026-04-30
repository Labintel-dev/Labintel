import { describe, it, expect, vi } from 'vitest';
import checkRole from './checkRole.js';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('checkRole middleware', () => {
  it('allows manager when administrator is required', () => {
    const req = { user: { role: 'manager' } };
    const res = makeRes();
    const next = vi.fn();

    checkRole('administrator')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows administrator when manager is required', () => {
    const req = { user: { role: 'administrator' } };
    const res = makeRes();
    const next = vi.fn();

    checkRole('manager')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks receptionist from technician-only route', () => {
    const req = { user: { role: 'receptionist' } };
    const res = makeRes();
    const next = vi.fn();

    checkRole('technician')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
  });
});
