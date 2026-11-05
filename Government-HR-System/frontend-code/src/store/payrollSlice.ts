import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post } from '../lib/apiClient';

// Types

export interface PayrollSummary {
  TotalEmployees: number;
  TotalAmount: number;
  Anomalies: number;
}

export interface PayrollPreview {
  TotalEmployees: number;
  TotalAmount: number;
  Anomalies: number;
  Details?: unknown[];
}

export interface Payslip {
  PayslipID: string;
  EmployeeID: string;
  Period: string;
  NetAmount: number;
  GrossAmount: number;
  Deductions: number;
  IssuedAt: string;
  [key: string]: unknown;
}

export interface PayrollFinalizeResult {
  FinalizedAt: string;
  TotalEmployees: number;
  TotalAmount: number;
  [key: string]: unknown;
}

interface PayrollState {
  draftSummary: PayrollSummary | null;
  payslips: Payslip[];
  finalizeResult: PayrollFinalizeResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  draftSummary: null,
  payslips: [],
  finalizeResult: null,
  loading: false,
  error: null,
};

// Async Thunks

export const runPayroll = createAsyncThunk<PayrollSummary, void, { rejectValue: string }>(
  'payroll/runPayroll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await post<PayrollSummary>('/v1/payroll/run', {});
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to run payroll';
      return rejectWithValue(message);
    }
  }
);

export const fetchPayrollPreview = createAsyncThunk<PayrollPreview, void, { rejectValue: string }>(
  'payroll/fetchPayrollPreview',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<PayrollPreview>('/v1/payroll/preview');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payroll preview';
      return rejectWithValue(message);
    }
  }
);

export const finalizePayroll = createAsyncThunk<PayrollFinalizeResult, void, { rejectValue: string }>(
  'payroll/finalizePayroll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await post<PayrollFinalizeResult>('/v1/payroll/finalize', {});
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finalize payroll';
      return rejectWithValue(message);
    }
  }
);

export const fetchMyPayslips = createAsyncThunk<Payslip[], void, { rejectValue: string }>(
  'payroll/fetchMyPayslips',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<Payslip[]>('/v1/payslips/my');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payslips';
      return rejectWithValue(message);
    }
  }
);

// Slice

export const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearPayrollError(state) {
      state.error = null;
    },
    clearDraftSummary(state) {
      state.draftSummary = null;
    },
  },
  extraReducers: (builder) => {
    // runPayroll
    builder.addCase(runPayroll.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(runPayroll.fulfilled, (state, action: PayloadAction<PayrollSummary>) => {
      state.loading = false;
      state.draftSummary = action.payload;
    });
    builder.addCase(runPayroll.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });

    // fetchPayrollPreview
    builder.addCase(fetchPayrollPreview.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPayrollPreview.fulfilled, (state, action: PayloadAction<PayrollPreview>) => {
      state.loading = false;
      state.draftSummary = {
        TotalEmployees: action.payload.TotalEmployees,
        TotalAmount: action.payload.TotalAmount,
        Anomalies: action.payload.Anomalies,
      };
    });
    builder.addCase(fetchPayrollPreview.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });

    // finalizePayroll
    builder.addCase(finalizePayroll.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(finalizePayroll.fulfilled, (state, action: PayloadAction<PayrollFinalizeResult>) => {
      state.loading = false;
      state.finalizeResult = action.payload;
      state.draftSummary = null;
    });
    builder.addCase(finalizePayroll.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });

    // fetchMyPayslips
    builder.addCase(fetchMyPayslips.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMyPayslips.fulfilled, (state, action: PayloadAction<Payslip[]>) => {
      state.loading = false;
      state.payslips = action.payload;
    });
    builder.addCase(fetchMyPayslips.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });
  },
});

export const { clearPayrollError, clearDraftSummary } = payrollSlice.actions;

export default payrollSlice.reducer;