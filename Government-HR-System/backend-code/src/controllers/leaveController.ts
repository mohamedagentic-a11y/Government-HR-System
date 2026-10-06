import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    EmployeeID: string;
    Role: string;
  };
}

const generateMeta = () => ({
  timestamp: new Date().toISOString(),
});

export const submitLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { LeaveType, StartDate, EndDate, Comments } = req.body;
    const employeeId = req.user?.EmployeeID;

    if (!employeeId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated.',
        },
      });
    }

    if (!LeaveType || !StartDate || !EndDate) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'LeaveType, StartDate, and EndDate are required.',
        },
      });
    }

    const leave = await prisma.leave.create({
      data: {
        EmployeeID: employeeId,
        LeaveType,
        StartDate,
        EndDate,
        Comments: Comments || '',
        Status: 'Pending',
      },
    });

    return res.status(201).json({
      data: {
        LeaveID: leave.id,
        Status: leave.Status,
      },
      meta: generateMeta(),
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while submitting the leave request.',
      },
    });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { Status, Comments } = req.body;
    const role = req.user?.Role;

    if (role !== 'Manager' && role !== 'HR') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only managers can approve or reject leaves.',
        },
      });
    }

    if (!Status || !['Approved', 'Rejected'].includes(Status)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Status must be Approved or Rejected.',
        },
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        Status,
        ManagerComments: Comments || '',
      },
    });

    return res.status(200).json({
      data: {
        LeaveID: updatedLeave.id,
        Status: updatedLeave.Status,
      },
      meta: generateMeta(),
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating the leave status.',
      },
    });
  }
};

export const getLeaveBalance = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.EmployeeID;

    if (!employeeId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated.',
        },
      });
    }

    const balance = await prisma.leaveBalance.findUnique({
      where: { EmployeeID: employeeId },
    });

    return res.status(200).json({
      data: {
        AnnualBalance: balance?.AnnualBalance || 0,
        SickBalance: balance?.SickBalance || 0,
      },
      meta: generateMeta(),
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching leave balance.',
      },
    });
  }
};