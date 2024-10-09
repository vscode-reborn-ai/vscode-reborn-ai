import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebviewApi } from "vscode-webview";
import { DEFAULT_EXTENSION_SETTINGS, ExtensionSettings, Model } from "../types";

export enum ApiKeyStatus {
  Unknown = "unknown", // On extension load, key has not yet been checked
  Unset = "unset", // On extension load, key is checked, but no valid API key is discovered
  Pending = "pending", // When the user submits an API key
  Authenticating = "authenticating", // When the extension is checking the API key
  Invalid = "invalid", // When the user's submission is checked, and it not valid. This is when the error message is shown.
  Valid = "valid", // Either after user submits a valid key, or on extension load, if a valid key is discovered
  Error = "error", // When an error occurs while checking the API key
}

export interface ViewOptionsState {
  // Chat messages
  hideName: boolean; // Hide names from the chat for compactness.
  showCodeOnly: boolean; // Only show code in ai responses.
  showMarkdown: boolean; // Show markdown instead of rendering HTML.
  alignRight: boolean; // Align user responses to the right.
  showCompact: boolean; // TODO: A more compact UI overall - think irc or slack's compact mode.
  showNetworkLogs: boolean; // TODO: Show network logs in the chat.
  // User input UI
  showEditorSelection: boolean; // Show the "Editor selection" button.
  showClear: boolean; // Show the "Clear" button.
  showVerbosity: boolean; // Show the verbosity button.
  showModelSelect: boolean; // Show the model select button.
  showTokenCount: boolean; // Show the token count.
}

export interface AppState {
  debug: boolean;
  extensionSettings: ExtensionSettings;
  models: Model[];
  apiKeyStatus: ApiKeyStatus;
  translations: any;
  useEditorSelection: boolean;
  vscode?: WebviewApi<unknown>;
  viewOptions: ViewOptionsState;
}

const initialState: AppState = {
  debug: false,
  extensionSettings: DEFAULT_EXTENSION_SETTINGS,
  models: [],
  apiKeyStatus: ApiKeyStatus.Unknown,
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
  },
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setDebug: (state, action: PayloadAction<boolean>) => {
      state.debug = action.payload;
    },
    setExtensionSettings: (state, action: PayloadAction<{ newSettings: any; }>) => {
      state.extensionSettings = action.payload.newSettings;
    },
    setModels: (state, action: PayloadAction<{ models: Model[]; }>) => {
      state.models = action.payload.models ?? [];
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
    },
    toggleViewOption: (state, action: PayloadAction<keyof ViewOptionsState>) => {
      state.viewOptions[action.payload] = !state.viewOptions[action.payload];
    },
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
  toggleViewOption,
} = appSlice.actions;

export default appSlice.reducer;
