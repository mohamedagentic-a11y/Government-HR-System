import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../services/leaveService';

export async function submitLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const employeeId: string = user?.employeeId || user?.EmployeeID;

    if (!employeeId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Employee identity not found in token.' }
      });
      return;
    }

    const { LeaveType, StartDate, EndDate, Comments } = req.body;

    if (!LeaveType || !StartDate || !EndDate) {
      res.status(400).json({
        error: { code: 'VALIDATION_FAILED', message: 'LeaveType, StartDate, and EndDate are required.' }
      });
      return;
    }

    const result = await leaveService.submitLeaveRequest({
      employeeId,
      leaveType: LeaveType,
      startDate: StartDate,
      endDate: EndDate,
      comments: Comments,
    });

    res.status(201).json({
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function listPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pendingLeaves = await leaveService.getPendingLeaves();

    res.status(200).json({
      data: pendingLeaves,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLeaveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const approverId: string = user?.employeeId || user?.EmployeeID;

    if (!approverId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Approver identity not found in token.' }
      });
      return;
    }

    const leaveId = req.params.id;

    if (!leaveId) {
      res.status(400).json({
        error: { code: 'VALIDATION_FAILED', message: 'Leave ID is required.' }
      });
      return;
    }

    const { Status, Comments } = req.body;

    if (!Status || (Status !== 'Approved' && Status !== 'Rejected')) {
      res.status(400).json({
        error: { code: 'VALIDATION_FAILED', message: 'Status must be "Approved" or "Rejected".' }
      });
      return;
    }

    await leaveService.updateLeaveStatus({
      leaveId,
      approverId,
      status: Status as 'Approved' | 'Rejected',
      comments: Comments,
    });

    res.status(200).json({
      data: { leaveId, status: Status },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const employeeId: string = user?.employeeId || user?.EmployeeID;

    if (!employeeId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Employee identity not found in token.' }
      });
      return;
    }

    const [leaves, balance] = await Promise.all([
      leaveService.getEmployeeLeaves(employeeId),
      leaveService.getLeaveBalance(employeeId),
    ]);

    res.status(200).json({
      data: { leaves, balance },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}