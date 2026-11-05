import { Request, Response, NextFunction } from 'express';
import { employeeService } from '../services/employeeService';

export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employees = await employeeService.getAllEmployees();
    res.status(200).json({
      data: employees,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Employee ID is required.',
        },
      });
      return;
    }

    const employee = await employeeService.getEmployeeById(id);
    if (!employee) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Employee not found.',
        },
      });
      return;
    }

    res.status(200).json({
      data: employee,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Employee ID is required.',
        },
      });
      return;
    }

    const leaveBalance = await employeeService.getLeaveBalance(id);
    if (!leaveBalance) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Leave balance not found for this employee.',
        },
      });
      return;
    }

    res.status(200).json({
      data: leaveBalance,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
}