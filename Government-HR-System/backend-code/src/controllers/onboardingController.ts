import { Request, Response, NextFunction } from 'express';
import {
  onboardingService,
  onboardingEvents,
  OnboardingChecklist,
  OnboardingChecklistItem,
  ITNotificationPayload,
} from '../services/onboardingService';

export async function createChecklist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { employeeId, items } = req.body;

    if (!employeeId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'employeeId is required.',
        },
      });
      return;
    }

    const checklist: OnboardingChecklist = await onboardingService.createChecklist(
      employeeId,
      items
    );

    // Trigger notification events for each IT item upon new hire creation
    for (const item of checklist.items) {
      if (item.category === 'IT') {
        const payload: ITNotificationPayload = {
          employeeId: checklist.employeeId,
          checklistId: checklist.checklistId,
          itemId: item.itemId,
          itemTitle: item.title,
          timestamp: new Date().toISOString(),
        };
        onboardingEvents.emit('it-notification', payload);
      }
    }

    res.status(201).json({
      data: checklist,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function listChecklists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { employeeId } = req.query;

    const checklists: OnboardingChecklist[] = await onboardingService.listChecklists(
      employeeId as string | undefined
    );

    res.status(200).json({
      data: checklists,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateChecklistItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { checklistId, itemId } = req.params;
    const { completed, completedBy } = req.body;

    if (!checklistId || !itemId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'checklistId and itemId are required.',
        },
      });
      return;
    }

    if (typeof completed !== 'boolean') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'completed must be a boolean.',
        },
      });
      return;
    }

    const updatedItem: OnboardingChecklistItem = await onboardingService.updateChecklistItem(
      checklistId,
      itemId,
      completed,
      completedBy ?? null
    );

    res.status(200).json({
      data: updatedItem,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}