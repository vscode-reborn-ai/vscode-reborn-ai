import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  debug: boolean;
  extensionSettings: any;
}

const initialState: AppState = {
  debug: false,
  extensionSettings: {},
};

export const appSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setDebug: (state, action: PayloadAction<boolean>) => {
      state.debug = action.payload;
    },
    setExtensionSettings: (state, action: PayloadAction<{
      newSettings: any;
    }>) => {
      state.extensionSettings = action.payload.newSettings;
    },
  },
});

export const {
  setDebug,
  setExtensionSettings,
} = appSlice.actions;

export default appSlice.reducer;