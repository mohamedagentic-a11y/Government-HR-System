import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post, put } from '../lib/apiClient';

export interface Leave {
  LeaveID: string;
  LeaveType: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  Comments?: string;
  EmployeeID?: string;
  EmployeeName?: string;
  CreatedAt?: string;
}

export interface LeaveBalance {
  Annual: number;
  Sick: number;
  Emergency: number;
  [key: string]: number;
}

export interface SubmitLeavePayload {
  LeaveType: string;
  StartDate: string;
  EndDate: string;
  Comments?: string;
}

export interface UpdateLeaveStatusPayload {
  id: string;
  Status: 'Approved' | 'Rejected';
  Comments?: string;
}

export interface LeaveState {
  myLeaves: Leave[];
  pendingLeaves: Leave[];
  leaveBalance: LeaveBalance | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  myLeaves: [],
  pendingLeaves: [],
  leaveBalance: null,
  loading: false,
  error: null,
};

export const fetchMyLeaves = createAsyncThunk<Leave[], void, { rejectValue: string }>(
  'leave/fetchMyLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<Leave[]>('/leaves/my');
      return data;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to fetch my leaves');
    }
  }
);

export const fetchPendingLeaves = createAsyncThunk<Leave[], void, { rejectValue: string }>(
  'leave/fetchPendingLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<Leave[]>('/leaves');
      const pending = data.filter((leave: Leave) => leave.Status === 'Pending');
      return pending;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to fetch pending leaves');
    }
  }
);

export const submitLeave = createAsyncThunk<Leave, SubmitLeavePayload, { rejectValue: string }>(
  'leave/submitLeave',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await post<Leave>('/leaves', payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to submit leave');
    }
  }
);

export const updateLeaveStatus = createAsyncThunk<
  Leave,
  UpdateLeaveStatusPayload,
  { rejectValue: string }
>(
  'leave/updateLeaveStatus',
  async ({ id, Status, Comments }, { rejectWithValue }) => {
    try {
      const data = await put<Leave>(`/leaves/${id}/status`, { Status, Comments });
      return data;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to update leave status');
    }
  }
);

export const fetchLeaveBalance = createAsyncThunk<
  LeaveBalance,
  string,
  { rejectValue: string }
>(
  'leave/fetchLeaveBalance',
  async (employeeId, { rejectWithValue }) => {
    try {
      const data = await get<LeaveBalance>(`/employees/${employeeId}/leave-balance`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to fetch leave balance');
    }
  }
);

export const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeaveError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchMyLeaves
    builder
      .addCase(fetchMyLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });

    // fetchPendingLeaves
    builder
      .addCase(fetchPendingLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingLeaves.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.loading = false;
        state.pendingLeaves = action.payload;
      })
      .addCase(fetchPendingLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });

    // submitLeave
    builder
      .addCase(submitLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        state.loading = false;
        state.myLeaves.unshift(action.payload);
      })
      .addCase(submitLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });

    // updateLeaveStatus
    builder
      .addCase(updateLeaveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action: PayloadAction<Leave>) => {
        state.loading = false;
        const updated = action.payload;

        const pendingIdx = state.pendingLeaves.findIndex(
          (l) => l.LeaveID === updated.LeaveID
        );
        if (pendingIdx !== -1) {
          state.pendingLeaves.splice(pendingIdx, 1);
        }

        const myIdx = state.myLeaves.findIndex((l) => l.LeaveID === updated.LeaveID);
        if (myIdx !== -1) {
          state.myLeaves[myIdx] = updated;
        }
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });

    // fetchLeaveBalance
    builder
      .addCase(fetchLeaveBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action: PayloadAction<LeaveBalance>) => {
        state.loading = false;
        state.leaveBalance = action.payload;
      })
      .addCase(fetchLeaveBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearLeaveError } = leaveSlice.actions;

export default leaveSlice.reducer;