import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model } from "../types";

export enum ApiKeyStatus {
  Unknown = "unknown", // On extension load, key has not yet been checked
  Unset = "unset", // On extension load, key is checked, but no valid API key is discovered
  Pending = "pending", // When the user submits an API key
  Invalid = "invalid", // When the user's submission is checked, and it not valid. This is when the error message is shown.
  Valid = "valid", // Either after user submits a valid key, or on extension load, if a valid key is discovered
}

export interface AppState {
  debug: boolean;
  extensionSettings: any;
  chatGPTModels: Model[];
  apiKeyStatus: ApiKeyStatus;
  translations: any;
}

const initialState: AppState = {
  debug: false,
  extensionSettings: {},
  chatGPTModels: [],
  apiKeyStatus: ApiKeyStatus.Unknown,
  translations: {},
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
    setApiKeyStatus: (state, action: PayloadAction<ApiKeyStatus>) => {
      state.apiKeyStatus = action.payload;
    },
    setTranslations: (state, action: PayloadAction<any>) => {
      state.translations = action.payload;
    },
  },
});

export const {
  setDebug,
  setExtensionSettings,
  setChatGPTModels,
  setApiKeyStatus,
  setTranslations,
} = appSlice.actions;

export default appSlice.reducer;