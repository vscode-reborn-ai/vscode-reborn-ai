import { ApiKeyStatus, ModelListStatus, ViewOptionsState } from "./store/types";
import { ChatMessage, Conversation, ExtensionSettings, Model, Verbosity } from "./types";

// A message that gets sent TO the backend
export enum BackendMessageType {
  // Chat
  addFreeTextQuestion = "addFreeTextQuestion",
  stopGenerating = "stopGenerating",
  getTokenCount = "getTokenCount",
  editCode = "editCode",
  openNew = "openNew",
  cleargpt3 = "cleargpt3",
  exportToMarkdown = "exportToMarkdown",
  // Conversation
  setCurrentConversation = "setCurrentConversation",
  setConversationList = "setConversationList",
  // Settings
  getSettings = "getSettings",
  openSettings = "openSettings",
  openSettingsPrompt = "openSettingsPrompt",
  setVerbosity = "setVerbosity",
  setShowAllModels = "setShowAllModels",
  setManualModelInput = "setManualModelInput",
  // View options
  getViewOptions = "getViewOptions",
  setViewOptions = "setViewOptions",
  // Models
  getModels = "getModels",
  getModelDetails = "getModelDetails",
  setModel = "setModel",
  // Base API URL
  changeApiUrl = "changeApiUrl",
  changeApiKey = "changeApiKey",
  // API Key
  getApiKeyStatus = "getApiKeyStatus",
  resetApiKey = "resetApiKey",
  generateOpenRouterApiKey = "generateOpenRouterApiKey",
  // API Version
  setAzureApiVersion = "setAzureApiVersion",
  // Action
  runAction = "runAction",
  stopAction = "stopAction",
  // Misc
  openExternalUrl = "openExternalUrl",
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
  model: Model;
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

export interface GetViewOptionsMessage extends BaseBackendMessage {
  type: BackendMessageType.getViewOptions;
}

export interface SetViewOptionsMessage extends BaseBackendMessage {
  type: BackendMessageType.setViewOptions;
  viewOptions: ViewOptionsState;
}

export interface GetModelDetailsMessage extends BaseBackendMessage {
  type: BackendMessageType.getModelDetails;
  modelId: string;
}

export interface ExportToMarkdownMessage extends BaseBackendMessage {
  type: BackendMessageType.exportToMarkdown;
  conversation: Conversation;
}

export interface ChangeApiUrlMessage extends BaseBackendMessage {
  type: BackendMessageType.changeApiUrl;
  apiUrl: string;
}

export interface ChangeApiKeyMessage extends BaseBackendMessage {
  type: BackendMessageType.changeApiKey;
  apiKey: string;
}

export interface SetAzureApiVersionMessage extends BaseBackendMessage {
  type: BackendMessageType.setAzureApiVersion;
  azureApiVersion: string;
}

export interface GetApiKeyStatusMessage extends BaseBackendMessage {
  type: BackendMessageType.getApiKeyStatus;
}

export interface ResetApiKeyMessage extends BaseBackendMessage {
  type: BackendMessageType.resetApiKey;
}

export interface GenerateOpenRouterApiKeyMessage extends BaseBackendMessage {
  type: BackendMessageType.generateOpenRouterApiKey;
}

export interface SetVerbosityMessage extends BaseBackendMessage {
  type: BackendMessageType.setVerbosity;
  verbosity: Verbosity;
}

export interface SetShowAllModelsMessage extends BaseBackendMessage {
  type: BackendMessageType.setShowAllModels;
  showAllModels: boolean;
}

export interface SetManualModelInputMessage extends BaseBackendMessage {
  type: BackendMessageType.setManualModelInput;
  useManualModelInput: boolean;
}

export interface SetCurrentConversationMessage extends BaseBackendMessage {
  type: BackendMessageType.setCurrentConversation;
  conversation: Conversation;
}

export interface SetConversationListMessage extends BaseBackendMessage {
  type: BackendMessageType.setConversationList;
  conversations: Conversation[];
  currentConversation: Conversation;
}

export interface GetTokenCountMessage extends BaseBackendMessage {
  type: BackendMessageType.getTokenCount;
  conversation: Conversation;
  useEditorSelection?: boolean;
}

export interface RunActionMessage extends BaseBackendMessage {
  type: BackendMessageType.runAction;
  actionId: string;
  actionOptions?: any;
}

export interface StopActionMessage extends BaseBackendMessage {
  type: BackendMessageType.stopAction;
  actionId: string;
}

export interface OpenExternalUrlMessage extends BaseBackendMessage {
  type: BackendMessageType.openExternalUrl;
  url: string;
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
  modelDetailsUpdate = "modelDetailsUpdate",
  setConversationModel = "setConversationModel",
  updateModelListStatus = "updateModelListStatus",
  // Settings
  settingsUpdate = "settingsUpdate",
  viewOptionsUpdate = "viewOptionsUpdate",
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
  models: Model[];
}

export interface ModelDetailsUpdateMessage extends BaseFrontendMessage {
  type: FrontendMessageType.modelDetailsUpdate;
  model: Model;
}

export interface SetConversationModelMessage extends BaseFrontendMessage {
  type: FrontendMessageType.setConversationModel;
  model: Model;
  conversationId: string;
}

export interface SettingsUpdateMessage extends BaseFrontendMessage {
  type: FrontendMessageType.settingsUpdate;
  config: ExtensionSettings;
}

export interface ViewOptionsUpdateMessage extends BaseFrontendMessage {
  type: FrontendMessageType.viewOptionsUpdate;
  viewOptions: ViewOptionsState;
}

export interface SetTranslationsMessage extends BaseFrontendMessage {
  type: FrontendMessageType.setTranslations;
  translations: string; // Stringified JSON object
}

export interface UpdateApiKeyStatusMessage extends BaseFrontendMessage {
  type: FrontendMessageType.updateApiKeyStatus;
  status: ApiKeyStatus;
}

export interface UpdateModelListStatusMessage extends BaseFrontendMessage {
  type: FrontendMessageType.updateModelListStatus;
  status: ModelListStatus;
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
  rawContent: string;
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
