import { Request, Response, NextFunction } from 'express';
import { payslipService } from '../services/payslipService';

export async function listMyPayslips(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user || !user.EmployeeID) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    const payslips = await payslipService.getPayslipsForEmployee(user.EmployeeID);

    res.status(200).json({
      data: payslips,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadPayslipPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user || !user.EmployeeID) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Payslip ID is required.',
        },
      });
      return;
    }

    const payslip = await payslipService.getPayslipById(id);

    if (!payslip) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Payslip not found.',
        },
      });
      return;
    }

    const role: string = user.Role ?? '';
    const isHRStaff = role === 'HR Staff';
    const isManager = role === 'Manager';
    const isOwner = payslip.EmployeeID === user.EmployeeID;

    if (!isOwner && !isHRStaff && !isManager) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this payslip.',
        },
      });
      return;
    }

    const pdfBuffer = await payslipService.generatePayslipPdf(payslip);

    const filename = `payslip-${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
}