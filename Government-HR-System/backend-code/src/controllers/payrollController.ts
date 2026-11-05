import { Request, Response } from 'express';
import { payrollService } from '../services/payrollService';

export async function runPayroll(req: Request, res: Response): Promise<void> {
  try {
    const result = await payrollService.runPayroll();
    res.status(200).json({
      data: {
        TotalEmployees: result.TotalEmployees,
        TotalAmount: result.TotalAmount,
        Anomalies: result.Anomalies,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: {
        code: 'PAYROLL_RUN_FAILED',
        message,
      },
    });
  }
}

export async function previewPayroll(req: Request, res: Response): Promise<void> {
  try {
    const result = await payrollService.previewPayroll();
    res.status(200).json({
      data: {
        TotalEmployees: result.TotalEmployees,
        TotalAmount: result.TotalAmount,
        Anomalies: result.Anomalies,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: {
        code: 'PAYROLL_PREVIEW_FAILED',
        message,
      },
    });
  }
}

export async function finalizePayroll(req: Request, res: Response): Promise<void> {
  try {
    const result = await payrollService.finalizePayroll();
    res.status(200).json({
      data: {
        TotalEmployees: result.TotalEmployees,
        TotalAmount: result.TotalAmount,
        Anomalies: result.Anomalies,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: {
        code: 'PAYROLL_FINALIZE_FAILED',
        message,
      },
    });
  }
}