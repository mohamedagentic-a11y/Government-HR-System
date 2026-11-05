import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post } from '../lib/apiClient';

export interface PerformanceCycle {
  CycleID: string;
  Name: string;
  StartDate: string;
  EndDate: string;
  Status: string;
}

export interface PerformanceReview {
  ReviewID: string;
  CycleID: string;
  EmployeeID: string;
  ReviewerID: string;
  Score?: number;
  Comments?: string;
  Status: string;
  CreatedAt: string;
}

export interface InitiateCyclePayload {
  Name: string;
  StartDate: string;
  EndDate: string;
}

export interface SubmitReviewPayload {
  CycleID: string;
  EmployeeID: string;
  Score: number;
  Comments?: string;
}

interface PerformanceState {
  cycles: PerformanceCycle[];
  myReviews: PerformanceReview[];
  loadingCycles: boolean;
  loadingReviews: boolean;
  initiating: boolean;
  submitting: boolean;
  errorCycles: string | null;
  errorReviews: string | null;
  errorInitiate: string | null;
  errorSubmit: string | null;
}

const initialState: PerformanceState = {
  cycles: [],
  myReviews: [],
  loadingCycles: false,
  loadingReviews: false,
  initiating: false,
  submitting: false,
  errorCycles: null,
  errorReviews: null,
  errorInitiate: null,
  errorSubmit: null,
};

export const fetchCycles = createAsyncThunk<PerformanceCycle[], void, { rejectValue: string }>(
  'performance/fetchCycles',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<PerformanceCycle[]>('/performance/cycles');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch cycles';
      return rejectWithValue(message);
    }
  }
);

export const initiateCycle = createAsyncThunk<PerformanceCycle, InitiateCyclePayload, { rejectValue: string }>(
  'performance/initiateCycle',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await post<PerformanceCycle>('/performance/cycles', payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initiate cycle';
      return rejectWithValue(message);
    }
  }
);

export const submitReview = createAsyncThunk<PerformanceReview, SubmitReviewPayload, { rejectValue: string }>(
  'performance/submitReview',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await post<PerformanceReview>('/performance/reviews', payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      return rejectWithValue(message);
    }
  }
);

export const fetchMyReviews = createAsyncThunk<PerformanceReview[], void, { rejectValue: string }>(
  'performance/fetchMyReviews',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<PerformanceReview[]>('/performance/reviews/my');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
      return rejectWithValue(message);
    }
  }
);

export const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    clearPerformanceErrors(state) {
      state.errorCycles = null;
      state.errorReviews = null;
      state.errorInitiate = null;
      state.errorSubmit = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCycles
    builder
      .addCase(fetchCycles.pending, (state) => {
        state.loadingCycles = true;
        state.errorCycles = null;
      })
      .addCase(fetchCycles.fulfilled, (state, action: PayloadAction<PerformanceCycle[]>) => {
        state.loadingCycles = false;
        state.cycles = action.payload;
      })
      .addCase(fetchCycles.rejected, (state, action) => {
        state.loadingCycles = false;
        state.errorCycles = action.payload ?? 'Unknown error';
      });

    // initiateCycle
    builder
      .addCase(initiateCycle.pending, (state) => {
        state.initiating = true;
        state.errorInitiate = null;
      })
      .addCase(initiateCycle.fulfilled, (state, action: PayloadAction<PerformanceCycle>) => {
        state.initiating = false;
        state.cycles.push(action.payload);
      })
      .addCase(initiateCycle.rejected, (state, action) => {
        state.initiating = false;
        state.errorInitiate = action.payload ?? 'Unknown error';
      });

    // submitReview
    builder
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
        state.errorSubmit = null;
      })
      .addCase(submitReview.fulfilled, (state, action: PayloadAction<PerformanceReview>) => {
        state.submitting = false;
        state.myReviews.push(action.payload);
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        state.errorSubmit = action.payload ?? 'Unknown error';
      });

    // fetchMyReviews
    builder
      .addCase(fetchMyReviews.pending, (state) => {
        state.loadingReviews = true;
        state.errorReviews = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action: PayloadAction<PerformanceReview[]>) => {
        state.loadingReviews = false;
        state.myReviews = action.payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loadingReviews = false;
        state.errorReviews = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearPerformanceErrors } = performanceSlice.actions;

export default performanceSlice.reducer;