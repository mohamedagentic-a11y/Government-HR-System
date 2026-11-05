import { Router } from 'express';
import { listEmployees, getEmployee, getLeaveBalance } from '../controllers/employeeController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

export const employeeRouter = Router();

employeeRouter.get(
  '/',
  requireAuth,
  requireRole('HR Staff'),
  listEmployees
);

employeeRouter.get(
  '/:id',
  requireAuth,
  getEmployee
);

employeeRouter.get(
  '/:id/leave-balance',
  requireAuth,
  getLeaveBalance
);