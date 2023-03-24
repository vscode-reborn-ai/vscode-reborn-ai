import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model } from "../types";

export interface AppState {
  debug: boolean;
  extensionSettings: any;
  chatGPTModels: Model[];
}

const initialState: AppState = {
  debug: false,
  extensionSettings: {},
  chatGPTModels: [],
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
    setChatGPTModels: (state, action: PayloadAction<{
      models: Model[];
    }>) => {
      state.chatGPTModels = action.payload.models;
    },
  },
});

export const {
  setDebug,
  setExtensionSettings,
  setChatGPTModels,
} = appSlice.actions;

export default appSlice.reducer;