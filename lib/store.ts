import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/features/common/api/baseApi';
// Import feature APIs to ensure they're injected
import '@/features/product/api/productApi';
import '@/features/category/api/categoryApi';
import '@/features/manufacturer/api/manufacturerApi';
import '@/features/uom/api/uomApi';
import '@/features/auth/api/authApi';

export const makeStore = () => {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

