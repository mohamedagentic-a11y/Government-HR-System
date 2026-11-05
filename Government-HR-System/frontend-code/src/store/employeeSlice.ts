import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get } from '../lib/apiClient';

export interface Employee {
  EmployeeID: string;
  NameArabic: string;
  NameEnglish?: string;
  DepartmentID: string;
  JobTitle?: string;
  Email?: string;
  Role?: string;
  [key: string]: unknown;
}

export interface OrgChartNode {
  EmployeeID: string;
  NameArabic: string;
  NameEnglish?: string;
  JobTitle?: string;
  DepartmentID: string;
  children?: OrgChartNode[];
  [key: string]: unknown;
}

export interface LeaveBalance {
  EmployeeID: string;
  Annual?: number;
  Sick?: number;
  Emergency?: number;
  [key: string]: unknown;
}

interface EmployeeState {
  employees: Employee[];
  orgChart: OrgChartNode | null;
  leaveBalance: LeaveBalance | null;
  searchResults: Employee[];
  loading: boolean;
  orgChartLoading: boolean;
  leaveBalanceLoading: boolean;
  searchLoading: boolean;
  error: string | null;
  orgChartError: string | null;
  leaveBalanceError: string | null;
  searchError: string | null;
}

const initialState: EmployeeState = {
  employees: [],
  orgChart: null,
  leaveBalance: null,
  searchResults: [],
  loading: false,
  orgChartLoading: false,
  leaveBalanceLoading: false,
  searchLoading: false,
  error: null,
  orgChartError: null,
  leaveBalanceError: null,
  searchError: null,
};

export const fetchEmployees = createAsyncThunk<Employee[], void, { rejectValue: string }>(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<Employee[]>('/v1/employees');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employees';
      return rejectWithValue(message);
    }
  }
);

export const fetchOrgChart = createAsyncThunk<OrgChartNode, string, { rejectValue: string }>(
  'employees/fetchOrgChart',
  async (departmentId: string, { rejectWithValue }) => {
    try {
      const data = await get<OrgChartNode>(`/v1/departments/${departmentId}/employees`);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch org chart';
      return rejectWithValue(message);
    }
  }
);

export const fetchLeaveBalance = createAsyncThunk<LeaveBalance, string, { rejectValue: string }>(
  'employees/fetchLeaveBalance',
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const data = await get<LeaveBalance>(`/v1/employees/${employeeId}/leave-balance`);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leave balance';
      return rejectWithValue(message);
    }
  }
);

export const searchEmployees = createAsyncThunk<Employee[], string, { rejectValue: string }>(
  'employees/searchEmployees',
  async (query: string, { rejectWithValue }) => {
    try {
      const data = await get<Employee[]>(`/v1/employees?search=${encodeURIComponent(query)}`);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search employees';
      return rejectWithValue(message);
    }
  }
);

export const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    clearEmployeeError(state) {
      state.error = null;
    },
    clearOrgChartError(state) {
      state.orgChartError = null;
    },
    clearLeaveBalanceError(state) {
      state.leaveBalanceError = null;
    },
    clearSearchResults(state) {
      state.searchResults = [];
      state.searchError = null;
    },
    resetLeaveBalance(state) {
      state.leaveBalance = null;
      state.leaveBalanceError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchEmployees
    builder.addCase(fetchEmployees.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEmployees.fulfilled, (state, action: PayloadAction<Employee[]>) => {
      state.loading = false;
      state.employees = action.payload;
    });
    builder.addCase(fetchEmployees.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unknown error';
    });

    // fetchOrgChart
    builder.addCase(fetchOrgChart.pending, (state) => {
      state.orgChartLoading = true;
      state.orgChartError = null;
    });
    builder.addCase(fetchOrgChart.fulfilled, (state, action: PayloadAction<OrgChartNode>) => {
      state.orgChartLoading = false;
      state.orgChart = action.payload;
    });
    builder.addCase(fetchOrgChart.rejected, (state, action) => {
      state.orgChartLoading = false;
      state.orgChartError = action.payload ?? 'Unknown error';
    });

    // fetchLeaveBalance
    builder.addCase(fetchLeaveBalance.pending, (state) => {
      state.leaveBalanceLoading = true;
      state.leaveBalanceError = null;
    });
    builder.addCase(fetchLeaveBalance.fulfilled, (state, action: PayloadAction<LeaveBalance>) => {
      state.leaveBalanceLoading = false;
      state.leaveBalance = action.payload;
    });
    builder.addCase(fetchLeaveBalance.rejected, (state, action) => {
      state.leaveBalanceLoading = false;
      state.leaveBalanceError = action.payload ?? 'Unknown error';
    });

    // searchEmployees
    builder.addCase(searchEmployees.pending, (state) => {
      state.searchLoading = true;
      state.searchError = null;
    });
    builder.addCase(searchEmployees.fulfilled, (state, action: PayloadAction<Employee[]>) => {
      state.searchLoading = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchEmployees.rejected, (state, action) => {
      state.searchLoading = false;
      state.searchError = action.payload ?? 'Unknown error';
    });
  },
});

export const {
  clearEmployeeError,
  clearOrgChartError,
  clearLeaveBalanceError,
  clearSearchResults,
  resetLeaveBalance,
} = employeeSlice.actions;

export default employeeSlice.reducer;