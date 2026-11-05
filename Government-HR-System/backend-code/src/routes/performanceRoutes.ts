import { Router } from 'express';
import {
  initiateCycle,
  listCycles,
  submitReview,
  getMyReviews,
} from '../controllers/performanceController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const performanceRouter = Router();

// POST /api/v1/performance/cycles — HR Staff only
performanceRouter.post(
  '/cycles',
  requireAuth,
  requireRole('HR Staff'),
  initiateCycle
);

// GET /api/v1/performance/cycles — HR Staff and Manager
performanceRouter.get(
  '/cycles',
  requireAuth,
  requireRole('HR Staff', 'Manager'),
  listCycles
);

// POST /api/v1/performance/reviews — Manager only
performanceRouter.post(
  '/reviews',
  requireAuth,
  requireRole('Manager'),
  submitReview
);

// GET /api/v1/performance/reviews/my — Employee only
performanceRouter.get(
  '/reviews/my',
  requireAuth,
  requireRole('Employee'),
  getMyReviews
);

export { performanceRouter };