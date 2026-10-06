import { Router } from 'express';
import { submitLeave, approveLeave, getLeaveBalance } from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/auth';

export const leaveRouter = Router();

// Submit a new leave request (Employee only)
leaveRouter.post('/', authenticate, authorize('Employee'), submitLeave);

// Approve or reject a leave request (Manager only)
leaveRouter.put('/:id/status', authenticate, authorize('Manager'), approveLeave);

// Retrieve leave balance
leaveRouter.get('/balance', authenticate, getLeaveBalance);