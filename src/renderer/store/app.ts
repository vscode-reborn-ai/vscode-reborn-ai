import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebviewApi } from "vscode-webview";
import { DEFAULT_EXTENSION_SETTINGS, ExtensionSettings, Model } from "../types";
import { ApiKeyStatus, ModelListStatus } from "./types";

export interface AppState {
  debug: boolean;
  extensionSettings: ExtensionSettings;
  models: Model[];
  apiKeyStatus: ApiKeyStatus;
  modelListStatus: ModelListStatus;
  translations: any;
  useEditorSelection: boolean;
  vscode?: WebviewApi<unknown>;
}

const initialState: AppState = {
  debug: false,
  extensionSettings: DEFAULT_EXTENSION_SETTINGS,
  models: [],
  apiKeyStatus: ApiKeyStatus.Unknown,
  modelListStatus: ModelListStatus.Unknown,
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
      models: Model[];
    }>) => {
      state.models = action.payload.models ?? [];
    },
    setApiKeyStatus: (state, action: PayloadAction<ApiKeyStatus>) => {
      state.apiKeyStatus = action.payload;
    },
    setModelListStatus: (state, action: PayloadAction<ModelListStatus>) => {
      state.modelListStatus = action.payload;
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
  setModelListStatus,
  setTranslations,
  setUseEditorSelection,
  setVSCode,
} = appSlice.actions;

export default appSlice.reducer;
