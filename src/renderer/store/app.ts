import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebviewApi } from "vscode-webview";
import { RootState } from "../store";
import { DEFAULT_EXTENSION_SETTINGS, ExtensionSettings, Model } from "../types";
import { ApiKeyStatus, ModelListStatus, ViewOptionsState } from "./types";

export const selectApiBaseUrl = createSelector(
  (state: RootState) => state.app.extensionSettings.gpt3.apiBaseUrl,
  (apiBaseUrl) => apiBaseUrl
);
export const selectVerbosity = createSelector(
  (state: RootState) => state.app.extensionSettings.verbosity,
  (verbosity) => verbosity
);
export const selectMinimalUI = createSelector(
  (state: RootState) => state.app.extensionSettings.minimalUI,
  (minimalUI) => minimalUI
);
export const selectModelList = createSelector(
  (state: RootState) => state.app.models,
  (models) => models
);

export interface AppState {
  debug: boolean;
  extensionSettings: ExtensionSettings;
  models: Model[];
  apiKeyStatus: ApiKeyStatus;
  modelListStatus: ModelListStatus;
  translations: any;
  useEditorSelection: boolean;
  vscode?: WebviewApi<unknown>;
  viewOptions: ViewOptionsState;
  // On startup - syncing with backend
  sync: {
    receivedViewOptions: boolean;
    receivedModels: boolean;
    receivedExtensionSettings: boolean;
    receivedTranslations: boolean;
  };
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
  viewOptions: {
    hideName: false,
    showCodeOnly: false,
    showMarkdown: false,
    alignRight: false,
    showCompact: false,
    showNetworkLogs: false,

    showEditorSelection: true,
    showClear: true,
    showVerbosity: true,
    showModelSelect: true,
    showTokenCount: true,
    showModelName: true,
  },
  sync: {
    receivedViewOptions: false,
    receivedModels: false,
    receivedExtensionSettings: false,
    receivedTranslations: false,
  }
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setDebug: (state, action: PayloadAction<boolean>) => {
      state.debug = action.payload;
    },
    setExtensionSettings: (state, action: PayloadAction<{ newSettings: ExtensionSettings; }>) => {
      state.extensionSettings = action.payload.newSettings;
    },
    setModels: (state, action: PayloadAction<{ models: Model[]; }>) => {
      // Create a new object to avoid mutating the state directly
      state.models = [...action.payload.models];
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
    },
    toggleViewOption: (state, action: PayloadAction<keyof ViewOptionsState>) => {
      state.viewOptions[action.payload] = !state.viewOptions[action.payload];
    },
    setViewOptions: (state, action: PayloadAction<ViewOptionsState>) => {
      state.viewOptions = action.payload;

      // Ensure all view options are defined
      state.viewOptions = {
        ...initialState.viewOptions,
        ...state.viewOptions,
      };
    },
    setReceivedViewOptions: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedViewOptions = action.payload;
    },
    setReceivedModels: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedModels = action.payload;
    },
    setReceivedExtensionSettings: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedExtensionSettings = action.payload;
    },
    setReceivedTranslations: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedTranslations = action.payload;
    },
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
  toggleViewOption,
  setViewOptions,
  setReceivedViewOptions,
  setReceivedModels,
  setReceivedExtensionSettings,
  setReceivedTranslations,
} = appSlice.actions;

export default appSlice.reducer;
