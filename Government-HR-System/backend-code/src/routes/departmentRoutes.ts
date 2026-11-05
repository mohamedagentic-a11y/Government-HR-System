import { Router } from 'express';
import { getDepartmentTree, getDepartmentEmployees } from '../controllers/departmentController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const departmentRouter = Router();

departmentRouter.get(
  '/',
  requireAuth(),
  requireRole(['HR Staff', 'Manager', 'Employee']),
  getDepartmentTree
);

departmentRouter.get(
  '/:id/employees',
  requireAuth(),
  requireRole(['HR Staff', 'Manager', 'Employee']),
  getDepartmentEmployees
);

export { departmentRouter };