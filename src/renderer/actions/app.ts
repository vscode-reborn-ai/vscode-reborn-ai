import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  debug: boolean;
}

const initialState: AppState = {
  debug: false,
};

export const appSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setDebug: (state, action: PayloadAction<boolean>) => {
      state.debug = action.payload;
    },
  },
});

export const {
  setDebug,
} = appSlice.actions;

export default appSlice.reducer;