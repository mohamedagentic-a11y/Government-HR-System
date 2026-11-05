import { Router } from 'express';
import { createChecklist, listChecklists, updateChecklistItem } from '../controllers/onboardingController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const onboardingRouter = Router();

onboardingRouter.post(
  '/checklists',
  requireAuth,
  requireRole('HR Staff'),
  createChecklist
);

onboardingRouter.get(
  '/checklists',
  requireAuth,
  requireRole('HR Staff'),
  listChecklists
);

onboardingRouter.put(
  '/checklists/:id/items/:itemId',
  requireAuth,
  requireRole('HR Staff'),
  updateChecklistItem
);

export { onboardingRouter };