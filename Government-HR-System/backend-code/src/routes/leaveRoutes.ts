import { Router } from 'express';
import { submitLeave, listPendingLeaves, updateLeaveStatus, getMyLeaves } from '../controllers/leaveController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const leaveRouter = Router();

leaveRouter.post(
  '/',
  requireAuth,
  requireRole('Employee'),
  submitLeave
);

leaveRouter.get(
  '/my',
  requireAuth,
  requireRole('Employee'),
  getMyLeaves
);

leaveRouter.get(
  '/',
  requireAuth,
  requireRole('Manager'),
  listPendingLeaves
);

leaveRouter.put(
  '/:id/status',
  requireAuth,
  requireRole('Manager'),
  updateLeaveStatus
);

export { leaveRouter };