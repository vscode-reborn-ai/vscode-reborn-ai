import vscode from 'vscode';
import { ApiProvider } from "./openai-api-provider";
import { ApiKeyStatus, ModelListStatus } from "./renderer/store/types";
import { ChatMessage, Conversation, ExtensionSettings, Model } from "./renderer/types";
import { ActionCompleteMessage, ActionErrorMessage, AddErrorMessage, AddMessageMessage, BaseFrontendMessage, FrontendMessageType, MessagesUpdatedMessage, ModelsUpdateMessage, SetConversationModelMessage, SetTranslationsMessage, SettingsUpdateMessage, ShowInProgressMessage, StreamMessageMessage, UpdateApiKeyStatusMessage, UpdateMessageMessage, UpdateModelListStatusMessage, UpdateTokenCountMessage } from "./renderer/types-messages";

export default class Messenger {
  private webView?: vscode.WebviewView | null;
  // FIFO queue for messages that send before the WebView is ready
  private messageQueue: BaseFrontendMessage[] = [];
  private api: ApiProvider | null = null;

  setWebView(webView: vscode.WebviewView) {
    this.webView = webView;
  }

  setApiProvider(api: ApiProvider) {
    this.api = api;
  }

  /**
  * Message sender, stores in FIFO queue if a message cannot be delivered
  * @param message Message to be sent to WebView
  * @param ignoreMessageIfNullWebView We will ignore the command if webView is null/not-focused
  */
  sendMessage(message: BaseFrontendMessage) {
    if (this.webView) {
      // Check if there are any messages in the queue
      while (this.messageQueue.length > 0) {
        const queuedMessage = this.messageQueue.shift();
        if (queuedMessage) {
          this.webView.webview.postMessage(queuedMessage);
        }
      }

      // Send the latest message
      this.webView.webview.postMessage(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  async sendModels(models: Model[] = []) {
    if (!this.api) {
      console.error("[Reborn AI] Unable to send models, API provider is not set.");
      return;
    }

    if (!models.length) {
      models = await this.api.getModelList() ?? [];
    }

    this.sendMessage({
      type: FrontendMessageType.modelsUpdate,
      models,
    } as ModelsUpdateMessage);
  }

  setConversationModel(model: Model, conversation: Conversation) {
    this.sendMessage({
      type: FrontendMessageType.setConversationModel,
      model,
      conversationId: conversation.id
    } as SetConversationModelMessage);
  }

  sendUpdatedSettings(config: vscode.WorkspaceConfiguration) {
    this.sendMessage({
      type: FrontendMessageType.settingsUpdate,
      config: config as unknown as ExtensionSettings,
    } as SettingsUpdateMessage);
  }

  sendTranslations(translations: Record<string, string>) {
    // Serialize and send translations to the webview
    const serializedTranslations = JSON.stringify(translations);

    this.sendMessage({
      type: FrontendMessageType.setTranslations,
      translations: serializedTranslations,
    } as SetTranslationsMessage);
  }

  sendApiKeyStatus(status: ApiKeyStatus) {
    this.sendMessage({
      type: FrontendMessageType.updateApiKeyStatus,
      status,
    } as UpdateApiKeyStatusMessage);
  }

  sendModelListStatus(status: ModelListStatus) {
    this.sendMessage({
      type: FrontendMessageType.updateModelListStatus,
      status,
    } as UpdateModelListStatusMessage);
  }

  sendSettingsUpdate(config: vscode.WorkspaceConfiguration) {
    this.sendMessage({
      type: FrontendMessageType.settingsUpdate,
      config: config as unknown as ExtensionSettings,
    } as SettingsUpdateMessage);
  }

  sendMessagesUpdated(messages: ChatMessage[], conversationId: string) {
    this.sendMessage({
      type: FrontendMessageType.messagesUpdated,
      chatMessages: messages,
      conversationId,
    } as MessagesUpdatedMessage);
  }

  sendShowInProgress(inProgress: boolean, conversationId: string) {
    this.sendMessage({
      type: FrontendMessageType.showInProgress,
      inProgress,
      conversationId,
    } as ShowInProgressMessage);
  }

  sendUpdateMessage(message: ChatMessage, conversationId: string) {
    this.sendMessage({
      type: FrontendMessageType.updateMessage,
      chatMessage: message,
      conversationId,
    } as UpdateMessageMessage);
  }

  sendAddMessage(chatMessage: ChatMessage, conversationId: string) {
    this.sendMessage({
      type: FrontendMessageType.addMessage,
      chatMessage,
      conversationId,
    } as AddMessageMessage);
  }

  sendStreamMessage(conversationId: string, messageId: string, content: string) {
    this.sendMessage({
      type: FrontendMessageType.streamMessage,
      conversationId,
      chatMessageId: messageId,
      content,
    } as StreamMessageMessage);
  }

  sendAddError(id: string, conversationId: string, value: string) {
    this.sendMessage({
      type: FrontendMessageType.addError,
      id,
      conversationId,
      value,
    } as AddErrorMessage);
  }

  sendActionComplete(actionId: string, actionResult: any) {
    this.sendMessage({
      type: FrontendMessageType.actionComplete,
      actionId,
      actionResult
    } as ActionCompleteMessage);
  }

  sendActionError(actionId: string, error: Error) {
    this.sendMessage({
      type: FrontendMessageType.actionError,
      actionId,
      error: error?.message ?? "Unknown error"
    } as ActionErrorMessage);
  }

  sendTokenCount(convTokens: number, userInputTokens: number, conversationId: string) {
    this.sendMessage({
      type: "tokenCount",
      tokenCount: {
        messages: convTokens,
        userInput: userInputTokens,
        minTotal: convTokens + userInputTokens,
      },
      conversationId,
    } as UpdateTokenCountMessage);
  }
}
