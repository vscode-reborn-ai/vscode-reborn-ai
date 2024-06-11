import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import OpenAI from "openai";
import { WebviewApi } from "vscode-webview";
import { DEFAULT_EXTENSION_SETTINGS, ExtensionSettings } from "../types";

export enum ApiKeyStatus {
  Unknown = "unknown", // On extension load, key has not yet been checked
  Unset = "unset", // On extension load, key is checked, but no valid API key is discovered
  Pending = "pending", // When the user submits an API key
  Invalid = "invalid", // When the user's submission is checked, and it not valid. This is when the error message is shown.
  Valid = "valid", // Either after user submits a valid key, or on extension load, if a valid key is discovered
}

export interface AppState {
  debug: boolean;
  extensionSettings: ExtensionSettings;
  models: OpenAI.Model[];
  apiKeyStatus: ApiKeyStatus;
  translations: any;
  useEditorSelection: boolean;
  vscode?: WebviewApi<unknown>;
}

const initialState: AppState = {
  debug: false,
  extensionSettings: DEFAULT_EXTENSION_SETTINGS,
  models: [],
  apiKeyStatus: ApiKeyStatus.Unknown,
  translations: {},
  useEditorSelection: false,
  vscode: undefined,
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
    setModels: (state, action: PayloadAction<{
      models: OpenAI.Model[];
    }>) => {
      state.models = action.payload.models;
    },
    setApiKeyStatus: (state, action: PayloadAction<ApiKeyStatus>) => {
      state.apiKeyStatus = action.payload;
    },
    setTranslations: (state, action: PayloadAction<any>) => {
      state.translations = action.payload;
    },
    setUseEditorSelection: (state, action: PayloadAction<boolean>) => {
      state.useEditorSelection = action.payload;
    },
    setVSCode: (state, action: PayloadAction<any>) => {
      state.vscode = action.payload;
    }
  },
});

export const {
  setDebug,
  setExtensionSettings,
  setModels,
  setApiKeyStatus,
  setTranslations,
  setUseEditorSelection,
  setVSCode,
} = appSlice.actions;

export default appSlice.reducer;