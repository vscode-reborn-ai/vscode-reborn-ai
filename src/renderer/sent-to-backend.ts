import { Conversation, Model, Verbosity } from "./types";
import { AddFreeTextQuestionMessage, BackendMessageType, ChangeApiKeyMessage, ChangeApiUrlMessage, EditCodeMessage, ExportToMarkdownMessage, GetTokenCountMessage, OpenNewMessage, RunActionMessage, SetConversationListMessage, SetCurrentConversationMessage, SetModelMessage, SetVerbosityMessage } from "./types-messages";

export function useMessenger(vscode: any) {
  const sendMessageToBackend = (type: string, data: any = {}) => {
    // Check if data is serializable
    try {
      JSON.stringify(data);
    } catch (error) {
      console.error("Error serializing message data", error);
      console.error("Type", type);
      console.error("Message data", data);
      return;
    }

    vscode.postMessage({
      type,
      ...data
    });
  };

  const sendModelUpdate = (model: Model) => {
    sendMessageToBackend(BackendMessageType.setModel, {
      model,
    } as SetModelMessage);
  };

  // * GET
  const sendGetSettings = () => sendMessageToBackend(BackendMessageType.getSettings);
  const sendGetModels = () => sendMessageToBackend(BackendMessageType.getModels);
  const sendGetApiKeyStatus = () => sendMessageToBackend(BackendMessageType.getApiKeyStatus);
  const sendGetTokenCount = (conversation: Conversation, useEditorSelection: boolean) => {
    sendMessageToBackend(BackendMessageType.getTokenCount, {
      conversation,
      useEditorSelection
    } as GetTokenCountMessage);
  };

  // * SET
  const sendSetCurrentConversation = (conversation: Conversation) => {
    sendMessageToBackend(BackendMessageType.setCurrentConversation, {
      conversation
    } as SetCurrentConversationMessage);
  };
  const sendConversationList = (conversations: Conversation[], currentConversation: Conversation) => {
    sendMessageToBackend(BackendMessageType.setConversationList, {
      conversations,
      currentConversation
    } as SetConversationListMessage);
  };
  const sendRunAction = (actionId: string, actionOptions: any = {}) => {
    sendMessageToBackend(BackendMessageType.runAction, {
      actionId,
      actionOptions
    } as RunActionMessage);
  };
  const sendStopAction = (actionId: string) => {
    sendMessageToBackend(BackendMessageType.stopAction, {
      actionId
    } as RunActionMessage);
  };
  const sendChangeApiUrl = (apiUrl: string) => {
    sendMessageToBackend(BackendMessageType.changeApiUrl, {
      apiUrl
    } as ChangeApiUrlMessage);
  };
  const sendChangeApiKey = (apiKey: string) => {
    sendMessageToBackend(BackendMessageType.changeApiKey, {
      apiKey
    } as ChangeApiKeyMessage);
  };
  const sendEditCode = (code: string) => {
    sendMessageToBackend(BackendMessageType.editCode, {
      code,
    } as EditCodeMessage);
  };
  const sendOpenNew = (code: string, language: string) => {
    sendMessageToBackend(BackendMessageType.openNew, {
      code,
      language
    } as OpenNewMessage);
  };
  const sendOpenSettings = () => {
    sendMessageToBackend(BackendMessageType.openSettings);
  };
  const sendExportToMarkdown = (conversation: Conversation) => {
    sendMessageToBackend(BackendMessageType.exportToMarkdown, {
      conversation
    } as ExportToMarkdownMessage);
  };
  const sendResetApiKey = () => sendMessageToBackend(BackendMessageType.resetApiKey);
  const sendGenerateOpenRouterApiKey = () => {
    sendMessageToBackend(BackendMessageType.generateOpenRouterApiKey);
  };
  const sendAddFreeTextQuestion = (options: {
    conversation: Conversation,
    question: string,
    includeEditorSelection: boolean,
    code?: string;
    questionId?: string,
    messageId?: string;
  }) => {
    sendMessageToBackend(BackendMessageType.addFreeTextQuestion, options as AddFreeTextQuestionMessage);
  };
  const sendStopGenerating = (conversationId?: string) => {
    sendMessageToBackend(BackendMessageType.stopGenerating, {
      conversationId
    });
  };
  const sendSetVerbosity = (verbosity: Verbosity) => {
    sendMessageToBackend(BackendMessageType.setVerbosity, {
      verbosity
    } as SetVerbosityMessage);
  };
  const sendSetShowAllModels = (showAllModels: boolean) => {
    sendMessageToBackend(BackendMessageType.setShowAllModels, {
      showAllModels
    });
  };
  const sendSetManualModelInput = (useManualModelInput: boolean) => {
    sendMessageToBackend(BackendMessageType.setManualModelInput, {
      useManualModelInput
    });
  };

  return {
    sendGetSettings,
    sendGetModels,
    sendGetApiKeyStatus,
    sendGenerateOpenRouterApiKey,
    sendGetTokenCount,

    sendModelUpdate,
    sendSetCurrentConversation,
    sendConversationList,
    sendRunAction,
    sendStopAction,
    sendChangeApiUrl,
    sendChangeApiKey,
    sendEditCode,
    sendOpenNew,
    sendOpenSettings,
    sendExportToMarkdown,
    sendResetApiKey,
    sendAddFreeTextQuestion,
    sendStopGenerating,
    sendSetVerbosity,
    sendSetShowAllModels,
    sendSetManualModelInput,
  };
}
