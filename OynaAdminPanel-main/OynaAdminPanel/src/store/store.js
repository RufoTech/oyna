import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { foodApi } from './api/foodApi';
import { venuesApi } from './api/venuesApi';
import { reservationsApi } from './api/reservationsApi';
import authReducer from './slices/authSlice';
import venueFormReducer from './slices/venueFormSlice';

import { dashboardApi } from './api/dashboardApi';

export const store = configureStore({
  reducer: {
    // Slices
    auth: authReducer,
    venueForm: venueFormReducer,

    // RTK Query API reducers
    [authApi.reducerPath]: authApi.reducer,
    [foodApi.reducerPath]: foodApi.reducer,
    [venuesApi.reducerPath]: venuesApi.reducer,
    [reservationsApi.reducerPath]: reservationsApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(foodApi.middleware)
      .concat(venuesApi.middleware)
      .concat(reservationsApi.middleware)
      .concat(dashboardApi.middleware),
});
