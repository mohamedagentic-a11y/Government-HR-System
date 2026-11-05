import { Router } from 'express';
import { runPayroll, previewPayroll, finalizePayroll } from '../controllers/payrollController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const payrollRouter = Router();

payrollRouter.get(
  '/preview',
  requireAuth,
  requireRole('HR Staff'),
  previewPayroll
);

payrollRouter.post(
  '/run',
  requireAuth,
  requireRole('HR Staff'),
  runPayroll
);

payrollRouter.post(
  '/finalize',
  requireAuth,
  requireRole('HR Staff'),
  finalizePayroll
);

export { payrollRouter };