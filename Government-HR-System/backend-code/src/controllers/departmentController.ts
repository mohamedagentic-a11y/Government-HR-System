import { Request, Response } from 'express';
import { departmentService } from '../services/departmentService';

export async function getDepartmentTree(req: Request, res: Response): Promise<void> {
  try {
    const tree = await departmentService.getDepartmentTree();
    res.status(200).json({
      data: tree,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    });
  }
}

export async function getDepartmentEmployees(req: Request, res: Response): Promise<void> {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Department ID is required.',
        },
      });
      return;
    }

    const employees = await departmentService.getDepartmentEmployees(departmentId);
    res.status(200).json({
      data: employees,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    });
  }
}