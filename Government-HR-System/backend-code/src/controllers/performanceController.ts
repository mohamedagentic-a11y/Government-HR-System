import { Request, Response, NextFunction } from 'express';
import { performanceService } from '../services/performanceService';

export async function initiateCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'name, startDate, and endDate are required.',
        },
      });
      return;
    }

    const cycle = await performanceService.createReviewCycle({ name, startDate, endDate });

    res.status(201).json({
      data: cycle,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function listCycles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cycles = await performanceService.getReviewCycles();

    res.status(200).json({
      data: cycles,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cycleId, employeeId, score, comments } = req.body;

    if (!cycleId || !employeeId || score === undefined || score === null) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'cycleId, employeeId, and score are required.',
        },
      });
      return;
    }

    const reviewerIdRaw = (req as any).user?.EmployeeID;
    if (!reviewerIdRaw) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Reviewer identity could not be determined.',
        },
      });
      return;
    }

    const cycle = await performanceService.getReviewCycleById(cycleId);
    if (!cycle) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Review cycle '${cycleId}' not found.`,
        },
      });
      return;
    }

    const review = await performanceService.recordReview({
      cycleId,
      employeeId,
      reviewerId: reviewerIdRaw,
      score,
      comments: comments ?? '',
    });

    res.status(201).json({
      data: review,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = (req as any).user?.EmployeeID;

    if (!employeeId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Employee identity could not be determined.',
        },
      });
      return;
    }

    const reviews = await performanceService.getReviewsByEmployee(employeeId);

    res.status(200).json({
      data: reviews,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}