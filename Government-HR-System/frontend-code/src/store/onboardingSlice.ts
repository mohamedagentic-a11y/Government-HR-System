import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post, put } from '../lib/apiClient';

export interface ChecklistItem {
  itemId: string;
  title: string;
  titleAr: string;
  completed: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export interface Checklist {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNameAr: string;
  title: string;
  titleAr: string;
  status: string;
  createdAt: string;
  items: ChecklistItem[];
}

export interface OnboardingState {
  checklists: Checklist[];
  loading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  checklists: [],
  loading: false,
  error: null,
};

export const fetchChecklists = createAsyncThunk<Checklist[], void, { rejectValue: string }>(
  'onboarding/fetchChecklists',
  async (_, { rejectWithValue }) => {
    try {
      const data = await get<Checklist[]>('/v1/onboarding/checklists');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch checklists';
      return rejectWithValue(message);
    }
  }
);

export interface CreateChecklistPayload {
  employeeId: string;
  title: string;
  titleAr: string;
  items: Omit<ChecklistItem, 'itemId' | 'completed' | 'completedAt'>[];
}

export const createChecklist = createAsyncThunk<Checklist, CreateChecklistPayload, { rejectValue: string }>(
  'onboarding/createChecklist',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await post<Checklist>('/v1/onboarding/checklists', payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create checklist';
      return rejectWithValue(message);
    }
  }
);

export interface UpdateChecklistItemPayload {
  checklistId: string;
  itemId: string;
  completed: boolean;
  completedAt?: string;
}

export const updateChecklistItem = createAsyncThunk<
  { checklistId: string; item: ChecklistItem },
  UpdateChecklistItemPayload,
  { rejectValue: string }
>(
  'onboarding/updateChecklistItem',
  async ({ checklistId, itemId, ...rest }, { rejectWithValue }) => {
    try {
      const data = await put<ChecklistItem>(
        `/v1/onboarding/checklists/${checklistId}/items/${itemId}`,
        rest
      );
      return { checklistId, item: data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update checklist item';
      return rejectWithValue(message);
    }
  }
);

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchChecklists
      .addCase(fetchChecklists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChecklists.fulfilled, (state, action: PayloadAction<Checklist[]>) => {
        state.loading = false;
        state.checklists = action.payload;
      })
      .addCase(fetchChecklists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      // createChecklist
      .addCase(createChecklist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChecklist.fulfilled, (state, action: PayloadAction<Checklist>) => {
        state.loading = false;
        state.checklists.push(action.payload);
      })
      .addCase(createChecklist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      // updateChecklistItem
      .addCase(updateChecklistItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateChecklistItem.fulfilled,
        (state, action: PayloadAction<{ checklistId: string; item: ChecklistItem }>) => {
          state.loading = false;
          const checklist = state.checklists.find((c) => c.id === action.payload.checklistId);
          if (checklist) {
            const itemIndex = checklist.items.findIndex(
              (i) => i.itemId === action.payload.item.itemId
            );
            if (itemIndex !== -1) {
              checklist.items[itemIndex] = action.payload.item;
            }
          }
        }
      )
      .addCase(updateChecklistItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearError } = onboardingSlice.actions;

export default onboardingSlice.reducer;