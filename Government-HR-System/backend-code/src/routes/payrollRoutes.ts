import { Router } from 'express';
import { runPayroll, previewPayroll } from '../controllers/payrollController';
import { authenticate, authorize } from '../middleware/auth';

export const payrollRouter = Router();

payrollRouter.post('/run', authenticate(), authorize('HR Staff'), runPayroll);
payrollRouter.get('/preview', authenticate(), authorize('HR Staff'), previewPayroll);