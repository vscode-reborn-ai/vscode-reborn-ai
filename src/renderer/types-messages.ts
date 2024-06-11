import OpenAI from "openai";
import { ApiKeyStatus } from "./store/app";
import { ChatMessage, Conversation, ExtensionSettings, Verbosity } from "./types";

// A message that gets sent TO the backend
export enum BackendMessageType {
  // Chat
  addFreeTextQuestion = "addFreeTextQuestion",
  stopGenerating = "stopGenerating",
  setCurrentConversation = "setCurrentConversation",
  getTokenCount = "getTokenCount",
  editCode = "editCode",
  openNew = "openNew",
  cleargpt3 = "cleargpt3",
  exportToMarkdown = "exportToMarkdown",
  // Settings
  getSettings = "getSettings",
  openSettings = "openSettings",
  openSettingsPrompt = "openSettingsPrompt",
  setVerbosity = "setVerbosity",
  setShowAllModels = "setShowAllModels",
  // Models
  getModels = "getModels",
  setModel = "setModel",
  // Base API URL
  changeApiUrl = "changeApiUrl",
  changeApiKey = "changeApiKey",
  // API Key
  getApiKeyStatus = "getApiKeyStatus",
  resetApiKey = "resetApiKey",
  // Action
  runAction = "runAction",
  stopAction = "stopAction"
}

export interface BaseBackendMessage {
  type: BackendMessageType,
};

// * Backend messages
export interface AddFreeTextQuestionMessage extends BaseBackendMessage {
  type: BackendMessageType.addFreeTextQuestion;
  conversation: Conversation;
  question: string;
  includeEditorSelection: boolean;
  questionId?: string;
  messageId?: string;
}

export interface EditCodeMessage extends BaseBackendMessage {
  type: BackendMessageType.editCode;
  code: string;
}

export interface SetModelMessage extends BaseBackendMessage {
  type: BackendMessageType.setModel;
  model: OpenAI.Model;
}

export interface OpenNewMessage extends BaseBackendMessage {
  type: BackendMessageType.openNew;
  code: string;
  language: string;
}

export interface Cleargpt3Message extends BaseBackendMessage {
  type: BackendMessageType.cleargpt3;
}

export interface OpenSettingsMessage extends BaseBackendMessage {
  type: BackendMessageType.openSettings;
}

export interface OpenSettingsPromptMessage extends BaseBackendMessage {
  type: BackendMessageType.openSettingsPrompt;
}

export interface StopGeneratingMessage extends BaseBackendMessage {
  type: BackendMessageType.stopGenerating;
  conversationId?: string;
}

export interface GetSettingsMessage extends BaseBackendMessage {
  type: BackendMessageType.getSettings;
}

export interface ExportToMarkdownMessage extends BaseBackendMessage {
  type: BackendMessageType.exportToMarkdown;
  conversation: any; // Replace 'any' with the actual type
}

export interface ChangeApiUrlMessage extends BaseBackendMessage {
  type: BackendMessageType.changeApiUrl;
  apiUrl: string;
}

export interface ChangeApiKeyMessage extends BaseBackendMessage {
  type: BackendMessageType.changeApiKey;
  apiKey: string;
}

export interface GetApiKeyStatusMessage extends BaseBackendMessage {
  type: BackendMessageType.getApiKeyStatus;
}

export interface ResetApiKeyMessage extends BaseBackendMessage {
  type: BackendMessageType.resetApiKey;
}

export interface SetVerbosityMessage extends BaseBackendMessage {
  type: BackendMessageType.setVerbosity;
  verbosity: Verbosity;
}

export interface SetShowAllModelsMessage extends BaseBackendMessage {
  type: BackendMessageType.setShowAllModels;
  showAllModels: boolean;
}

export interface SetCurrentConversationMessage extends BaseBackendMessage {
  type: BackendMessageType.setCurrentConversation;
  conversation: any; // Replace 'any' with the actual type
}

export interface GetTokenCountMessage extends BaseBackendMessage {
  type: BackendMessageType.getTokenCount;
  conversation: any; // Replace 'any' with the actual type
  useEditorSelection?: boolean;
}

export interface RunActionMessage extends BaseBackendMessage {
  type: BackendMessageType.runAction;
  actionId: string; // Replace with actual ActionNames enum or type
  actionOptions?: any; // Replace 'any' with the actual options type if needed
}

export interface StopActionMessage extends BaseBackendMessage {
  type: BackendMessageType.stopAction;
  actionId: string;
}

// * Frontend messages
// A message that gets sent TO the frontend
export enum FrontendMessageType {
  // Chat
  messagesUpdated = "messagesUpdated",
  showInProgress = "showInProgress",
  updateMessage = "updateMessage",
  addMessage = "addMessage",
  streamMessage = "streamMessage",
  addError = "addError",
  tokenCount = "tokenCount",
  clearConversation = "clearConversation",
  exportToMarkdown = "exportToMarkdown",
  // Models
  modelsUpdate = "modelsUpdate",
  // Settings
  settingsUpdate = "settingsUpdate",
  // API Key
  updateApiKeyStatus = "updateApiKeyStatus",
  // Content
  setTranslations = "setTranslations",
  // Action
  actionComplete = "actionComplete",
  actionError = "actionError",
}

export interface BaseFrontendMessage {
  type: FrontendMessageType,
};

export interface ModelsUpdateMessage extends BaseFrontendMessage {
  type: FrontendMessageType.modelsUpdate;
  models: OpenAI.Model[];
}

export interface SettingsUpdateMessage extends BaseFrontendMessage {
  type: FrontendMessageType.settingsUpdate;
  config: ExtensionSettings;
}

export interface SetTranslationsMessage extends BaseFrontendMessage {
  type: FrontendMessageType.setTranslations;
  translations: string; // Stringified JSON object
}

export interface UpdateApiKeyStatusMessage extends BaseFrontendMessage {
  type: FrontendMessageType.updateApiKeyStatus;
  status: ApiKeyStatus;
}

export interface MessagesUpdatedMessage extends BaseFrontendMessage {
  type: FrontendMessageType.messagesUpdated;
  chatMessages: ChatMessage[];
  conversationId: string;
}

export interface ShowInProgressMessage extends BaseFrontendMessage {
  type: FrontendMessageType.showInProgress;
  inProgress: boolean;
  conversationId: string;
}

export interface UpdateMessageMessage extends BaseFrontendMessage {
  type: FrontendMessageType.updateMessage;
  chatMessage: ChatMessage;
  conversationId: string;
}

export interface AddMessageMessage extends BaseFrontendMessage {
  type: FrontendMessageType.addMessage;
  chatMessage: ChatMessage;
  conversationId: string;
}

export interface StreamMessageMessage extends BaseFrontendMessage {
  type: FrontendMessageType.streamMessage;
  conversationId: string;
  chatMessageId: string;
  content: string;
}

export interface AddErrorMessage extends BaseFrontendMessage {
  type: FrontendMessageType.addError;
  id: string;
  conversationId: string;
  value: string;
}

export interface ActionCompleteMessage extends BaseFrontendMessage {
  type: FrontendMessageType.actionComplete;
  actionId: string;
  actionResult: any;
}

export interface ActionErrorMessage extends BaseFrontendMessage {
  type: FrontendMessageType.actionError;
  actionId: string;
  error: string;
}

export interface UpdateTokenCountMessage extends BaseFrontendMessage {
  type: FrontendMessageType.tokenCount;
  tokenCount: {
    messages: number;
    userInput: number;
    minTotal: number;
  };
  conversationId: string;
}
