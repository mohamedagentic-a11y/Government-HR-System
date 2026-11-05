import { Router } from 'express';
import { listMyPayslips, downloadPayslipPdf } from '../controllers/payslipController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const payslipRouter = Router();

payslipRouter.get(
  '/my',
  requireAuth(),
  requireRole('Employee'),
  listMyPayslips
);

payslipRouter.get(
  '/:id/pdf',
  requireAuth(),
  requireRole('Employee'),
  downloadPayslipPdf
);

export { payslipRouter };