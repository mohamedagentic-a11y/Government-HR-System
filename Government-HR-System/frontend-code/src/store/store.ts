import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import { leaveSlice } from './leaveSlice';
import { payrollSlice } from './payrollSlice';
import { performanceSlice } from './performanceSlice';
import { onboardingSlice } from './onboardingSlice';
import { employeeSlice } from './employeeSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    leave: leaveSlice.reducer,
    payroll: payrollSlice.reducer,
    performance: performanceSlice.reducer,
    onboarding: onboardingSlice.reducer,
    employee: employeeSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;