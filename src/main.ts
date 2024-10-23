import hljs from 'highlight.js';
import { createServer } from 'http';
import { marked } from "marked";
import { v4 as uuidv4 } from "uuid";
import * as vscode from 'vscode';
import { getSelectedModelId, getUpdatedModel, isReasoningModel } from "./helpers";
import { AuthStore, OfflineStore } from "./local-store";
import { loadTranslations } from './localization';
import { ModelCache as ModelListCache } from "./model-list-cache";
import { ApiProvider } from "./openai-api-provider";
import pkceChallenge from "./pkce-challenge";
import { isInstructModel, unEscapeHTML } from "./renderer/helpers";
import { ApiKeyStatus } from "./renderer/store/types";
import { ActionNames, ChatMessage, Conversation, Model, Role, Verbosity } from "./renderer/types";
import { AddFreeTextQuestionMessage, BackendMessageType, BaseBackendMessage, ChangeApiKeyMessage, ChangeApiUrlMessage, EditCodeMessage, ExportToMarkdownMessage, GetTokenCountMessage, OpenExternalUrlMessage, OpenNewMessage, RunActionMessage, SetAzureApiVersionMessage, SetConversationListMessage, SetCurrentConversationMessage, SetManualModelInputMessage, SetModelMessage, SetShowAllModelsMessage, SetVerbosityMessage, SetViewOptionsMessage, StopActionMessage, StopGeneratingMessage } from "./renderer/types-messages";
import Messenger from "./send-to-frontend";
import { ActionRunner } from "./smart-action-runner";

/*

* main.ts

This is the main backend file for this extension.
It handles the communication between the webview ("renderer process", uses react) and the extension's backend process.

*/

export interface ApiRequestOptions {
  command: string,
  conversation: Conversation,
  questionId?: string,
  messageId?: string,
  code?: string,
  language?: string;
  topP?: number;
  temperature?: number;
  maxTokens?: number;
}

export default class ChatGptViewProvider implements vscode.WebviewViewProvider {
  private webView?: vscode.WebviewView;
  private authStore?: AuthStore; // Local secrets storage for API keys
  private offlineStore?: OfflineStore; // Local storage for view options
  private modelListCache: ModelListCache; // Model list caching
  private runner: ActionRunner;

  private _temperature: number = 0.9;
  private _topP: number = 1;
  private chatMode?: boolean = true;
  private systemContext: string;
  private showAllModels: boolean = false;
  private throttling: number = 100;
  private abortControllers: {
    conversationId?: string,
    actionName?: string,
    controller: AbortController;
  }[] = [];

  public api: ApiProvider;
  public frontendMessenger: Messenger;
  public subscribeToResponse: boolean;
  public model: Model;

  // Updated by frontend when these change
  public conversationList: Conversation[] = [];
  public currentConversation?: Conversation;

  /**
  * Message to be rendered lazily if they haven't been rendered
  * in time before resolveWebviewView is called.
  */
  constructor(private context: vscode.ExtensionContext) {
    // Communication with the React frontend
    this.frontendMessenger = new Messenger();

    // Local VS Code storage
    this.authStore = AuthStore.init(context); // API key storage
    this.offlineStore = OfflineStore.init(context); // Non-config settings
    this.modelListCache = ModelListCache.init(context); // Model list caching

    // ApiProvider handles all API requests to LLMs
    this.api = new ApiProvider('', undefined, this.frontendMessenger, this.modelListCache);
    // ActionRunner runs "actions" with multiple ai steps
    this.runner = new ActionRunner(this);

    this.model = {
      id: getSelectedModelId(),
      // dummy values
      object: "model",
      created: 0,
      owned_by: Role.system
    };

    // Load settings
    this.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
    this.systemContext = vscode.workspace.getConfiguration('chatgpt').get('systemContext') ?? vscode.workspace.getConfiguration('chatgpt').get('systemContext.default') ?? '';
    this.throttling = vscode.workspace.getConfiguration("chatgpt").get("throttling") || 100;

    // Check config settings for "chatgpt.gpt3.apiBaseUrl", if it is set to "https://api.openai.com", change it to "https://api.openai.com/v1"
    const baseUrl = vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string;
    if (baseUrl === "https://api.openai.com") {
      vscode.workspace.getConfiguration("chatgpt").update("gpt3.apiBaseUrl", "https://api.openai.com/v1", true);
    }

    // If apiBaseUrl is in old "https://api.openai.com" format, update to format "https://api.openai.com/v1"
    // This update puts "apiBaseUrl" in line with the "basePath" format used by the OpenAI's official SDK
    if (vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") === "https://api.openai.com") {
      vscode.workspace.getConfiguration("chatgpt").update("gpt3.apiBaseUrl", "https://api.openai.com/v1", true);
    }

    // The chatgpt.apiVersion setting was deprecated in favor of chatgpt.azureApiVersion
    // Check config for chatgpt.apiVersion
    const apiVersion = vscode.workspace.getConfiguration("chatgpt").get("apiVersion") as string;
    if (apiVersion) {
      // If it exists, move it to chatgpt.azureApiVersion
      vscode.workspace.getConfiguration("chatgpt").update("azureApiVersion", apiVersion, true);
      // Remove chatgpt.apiVersion from the config
      vscode.workspace.getConfiguration("chatgpt").update("apiVersion", undefined, true);
    }

    vscode.commands.registerCommand("chatgptReborn.setOpenAIApiKey", async (apiKey: string) => {
      if (this.authStore) {
        const apiBaseUrl = this.api?.getApiUrl() ?? baseUrl ?? vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string;
        await this.authStore.storeApiKey(apiKey, apiBaseUrl);
      } else {
        console.error("[Reborn AI] Auth store not initialized");
      }
    });
    vscode.commands.registerCommand("chatgptReborn.getOpenAIApiKey", async () => {
      if (this.authStore) {
        const apiBaseUrl = this.api?.getApiUrl() ?? baseUrl ?? vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string;
        const tokenOutput = await this.authStore.getApiKey(apiBaseUrl);
        return tokenOutput;
      } else {
        console.error("[Reborn AI] Auth store not initialized");
        return undefined;
      }
    });

    // Check config settings for "chatgpt.gpt3.apiKey", if it exists, move it to the secret storage and remove it from the config
    const apiKey = vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiKey") as string;
    if (apiKey) {
      const apiBaseUrl = this.api?.getApiUrl() ?? baseUrl ?? vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string;
      this.authStore.storeApiKey(apiKey, apiBaseUrl);
      vscode.workspace.getConfiguration("chatgpt").update("gpt3.apiKey", undefined, true);
    }

    // * EXPERIMENT: Turn off maxTokens
    //   Due to how extension settings work, the setting will default to the 1,024 setting
    //   from a very long time ago. New models support 128,000 tokens, but you have to tell the
    //   user to update their config to "enable" these larger contexts. With the updated UI
    //   now showing token counts, I think it's better to just turn off the maxTokens setting
    // this._maxTokens = vscode.workspace.getConfiguration("chatgpt").get("gpt3.maxTokens") as number;
    this._temperature = vscode.workspace.getConfiguration("chatgpt").get("gpt3.temperature") as number;
    this._topP = vscode.workspace.getConfiguration("chatgpt").get("gpt3.top_p") as number;

    // Initialize the API
    this.authStore.getApiKey(baseUrl).then((apiKey) => {
      this.api = new ApiProvider(
        apiKey ?? "",
        {
          organization: vscode.workspace.getConfiguration("chatgpt").get("gpt3.organization") as string ?? undefined,
          apiBaseUrl: vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string,
          temperature: vscode.workspace.getConfiguration("chatgpt").get("gpt3.temperature") as number,
          topP: vscode.workspace.getConfiguration("chatgpt").get("gpt3.top_p") as number,
        },
        this.frontendMessenger,
        this.modelListCache
      );
      this.frontendMessenger.setApiProvider(this.api);
    });

    // Update data members when the config settings change
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      let rebuildApiProvider = false;

      // Show all models
      if (e.affectsConfiguration("chatgpt.showAllModels")) {
        this.showAllModels = vscode.workspace.getConfiguration("chatgpt").get("showAllModels") ?? false;
      }
      // Model
      if (e.affectsConfiguration("chatgpt.gpt3.model")) {
        if (this.api) {
          const selectedModelId = getSelectedModelId();
          const modelList = await this.api.getModelList();

          const newModel = modelList.find((m) => m.id === selectedModelId);

          if (newModel) {
            this.model = newModel;
          } else {
            this.model = {
              id: selectedModelId,
              // dummy values
              object: "model",
              created: 0,
              owned_by: Role.system
            };
          }

          this.frontendMessenger.sendModels(modelList);
          if (this.currentConversation) {
            this.currentConversation.model = this.model;
          }
        }
      }
      // System Context
      if (e.affectsConfiguration("chatgpt.systemContext")) {
        this.systemContext = vscode.workspace.getConfiguration('chatgpt').get('systemContext') ?? vscode.workspace.getConfiguration('chatgpt').get('systemContext.default') ?? '';
      }
      // Throttling
      if (e.affectsConfiguration("chatgpt.throttling")) {
        this.throttling = vscode.workspace.getConfiguration("chatgpt").get("throttling") ?? 100;
      }
      // organization
      if (e.affectsConfiguration("chatgpt.gpt3.organization")) {
        this.api.updateOrganizationId(vscode.workspace.getConfiguration("chatgpt").get("gpt3.organization") ?? "");
        rebuildApiProvider = true;
      }
      // Api Base Url
      if (e.affectsConfiguration("chatgpt.gpt3.apiBaseUrl")) {
        this.api.updateApiBaseUrl(vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") ?? "");
        rebuildApiProvider = true;
      }
      // * EXPERIMENT: Turn off maxTokens
      //   Due to how extension settings work, the setting will default to the 1,024 setting
      //   from a very long time ago. New models support 128,000 tokens, but you have to tell the
      //   user to update their config to "enable" these larger contexts. With the updated UI
      //   now showing token counts, I think it's better to just turn off the maxTokens setting
      // if (e.affectsConfiguration("chatgpt.gpt3.maxTokens")) {
      // 	this.api.maxTokens = this._maxTokens = vscode.workspace.getConfiguration("chatgpt").get("gpt3.maxTokens") as number ?? 2048;
      // }
      // temperature
      if (e.affectsConfiguration("chatgpt.gpt3.temperature")) {
        this.api.temperature = this._temperature = vscode.workspace.getConfiguration("chatgpt").get("gpt3.temperature") as number ?? 0.9;
      }
      // topP
      if (e.affectsConfiguration("chatgpt.gpt3.top_p")) {
        this.api.topP = this._topP = vscode.workspace.getConfiguration("chatgpt").get("gpt3.top_p") as number ?? 1;
      }

      if (rebuildApiProvider) {
        await this.rebuildApiProvider();
      }
    });

    // if any of the extension settings change, send a message to the webview for the "settingsUpdate" event
    vscode.workspace.onDidChangeConfiguration((e) => {
      this.frontendMessenger.sendUpdatedSettings(vscode.workspace.getConfiguration("chatgpt"));
    });

    // Load translations
    loadTranslations(context.extensionPath).then((translations) => {
      this.frontendMessenger.sendTranslations(translations);
    }).catch((err) => {
      console.error("[Reborn AI] Failed to load translations", err);
    });
  }

  /** API KEY and API URL update functions

  - api url is dependent on the api key
  So when API URL changes, we need to check for a stored key.
  - API key is only used by the API provider
  - All API url updates are propagated to the JSON settings; however,
  we should consider the API provider the source of truth for the API URL.
  */
  public async rebuildApiProvider(apiKey: string | undefined = undefined, apiUrl: string | undefined = undefined) {
    const finalApiKey = (apiKey === undefined ? await this.authStore?.getApiKey(apiUrl) : apiKey) ?? '';
    const finalApiUrl = apiUrl ?? vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string;

    this.api = new ApiProvider(
      finalApiKey,
      {
        organization: vscode.workspace.getConfiguration("chatgpt").get("gpt3.organization") as string ?? undefined,
        apiBaseUrl: finalApiUrl,
        temperature: vscode.workspace.getConfiguration("chatgpt").get("gpt3.temperature") as number,
        topP: vscode.workspace.getConfiguration("chatgpt").get("gpt3.top_p") as number,
      }, this.frontendMessenger,
      this.modelListCache
    );

    // Test the API key
    const { status, models } = await this.testApiKey(this.api);

    this.frontendMessenger.sendApiKeyStatus(status);
    this.frontendMessenger.sendModels(models);
  }

  public async clearApiKey() {
    // Remake the API provider with a blank API key
    this.api.config.apiKey = '';
  }

  public async setApiUrl(apiUrl: string) {
    // Clear the current API key so we don't accidentally use an old key with the new URL
    await this.clearApiKey();

    // trim, lowercase
    apiUrl = apiUrl.trim().toLowerCase();

    // Remove trailing slash
    if (apiUrl.endsWith("/")) {
      apiUrl = apiUrl.slice(0, -1);
    }

    // if api url ends with /chat or /chat/completions, remove it
    if (apiUrl.endsWith("/chat")) {
      apiUrl = apiUrl.slice(0, -5);
    } else if (apiUrl.endsWith("/chat/completions")) {
      apiUrl = apiUrl.slice(0, -17);
    }

    // Look for an API key associated with this API URL
    const apiKey = await this.authStore?.getApiKey(apiUrl) ?? '';

    // Update the API provider
    // await this.rebuildApiProvider(apiKey, apiUrl);
    await this.api.updateApiKeyAndBaseUrl(apiKey, apiUrl);

    // Update config
    await vscode.workspace.getConfiguration("chatgpt").update("gpt3.apiBaseUrl", apiUrl, true);

    // Look for model associated with this API URL
    const model = await this.authStore?.getModelByApi(apiUrl);

    if (model) {
      // Update the model
      this.model = await this.setModel(model);

      // Update current conversation
      if (this.currentConversation) {
        this.frontendMessenger.setConversationModel(model, this.currentConversation);
      }
    }

    // Request a new copy of the settings to be sent to the frontend
    // For whatever reason, the actual settings and the rendered settings can get out of sync
    this.frontendMessenger.sendUpdatedSettings(vscode.workspace.getConfiguration("chatgpt"));
  }

  public async setApiKey(apiKey: string) {
    // Update the secret storage
    const apiUrl = this.api.getApiUrl() ?? vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiBaseUrl") as string;
    await this.authStore?.storeApiKey(apiKey, apiUrl);

    // Update the API provider
    await this.rebuildApiProvider(apiKey);
  }

  // Test if the API can be accessed with the provided API provider
  async testApiKey(apiProvider: ApiProvider | undefined = undefined): Promise<{
    status: ApiKeyStatus,
    models?: Model[],
  }> {
    if (!apiProvider) {
      apiProvider = this.api ?? new ApiProvider('', undefined, this.frontendMessenger, this.modelListCache);
    }

    const apiKey = apiProvider.config.apiKey ?? '';

    try {
      const models = await apiProvider?.getModelList();

      return {
        status: apiKey.length === 0 ? ApiKeyStatus.Unset : ApiKeyStatus.Valid,
        models,
      };
    } catch (error: any | Error) {
      console.error('[Reborn AI] Main Process - Error getting models', error);

      // if 401, the API key is invalid
      if ((error as Error)?.message?.includes("401") || (typeof error === 'string' && (error as string).includes("403"))) {
        return {
          status: ApiKeyStatus.Invalid
        };
      }

      return {
        status: ApiKeyStatus.Error
      };
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.webView = webviewView;
    this.frontendMessenger.setWebView(webviewView);

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this.context.extensionUri
      ],
    };

    webviewView.webview.html = this.getWebviewHtml(webviewView.webview);

    // TODO: split this out into its own file
    // A "message handler" class similar to the one in the renderer
    webviewView.webview.onDidReceiveMessage(async (data: BaseBackendMessage) => {
      switch (data.type) {
        case BackendMessageType.addFreeTextQuestion:
          const freeTextData = data as AddFreeTextQuestionMessage;
          const apiRequestOptions = {
            command: "freeText",
            conversation: freeTextData.conversation ?? null,
            questionId: freeTextData.questionId ?? null,
            messageId: freeTextData.messageId ?? null,
          } as ApiRequestOptions;

          // if includeEditorSelection is true, add the code snippet to the question
          if (freeTextData?.includeEditorSelection) {
            const selection = this.getActiveEditorSelection();
            apiRequestOptions.code = selection?.content ?? "";
            apiRequestOptions.language = selection?.language ?? "";
          }

          this.sendApiRequest(freeTextData.question, apiRequestOptions);
          break;
        case BackendMessageType.editCode: {
          const editCodeData = data as EditCodeMessage;
          const escapedString = (editCodeData.code as string).replace(/([\\$])/g, '\\$1');
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(escapedString));

          this.logEvent("code-inserted");
          break;
        }
        case BackendMessageType.setModel:
          const setModelData = data as SetModelMessage;
          // Note that due to some models being deprecated, this function may change the model
          this.model = await this.setModel(setModelData.model);
          break;
        case BackendMessageType.openNew:
          const openNewData = data as OpenNewMessage;
          const document = await vscode.workspace.openTextDocument({
            content: openNewData.code,
            language: openNewData.language
          });
          vscode.window.showTextDocument(document);

          this.logEvent(openNewData.language === "markdown" ? "code-exported" : "code-opened");
          break;
        case BackendMessageType.cleargpt3:
          // TODO: remove this?
          // this.apiGpt3 = undefined;

          this.logEvent("[Reborn] NOT IMPLEMENTED - gpt3-cleared");
          break;
        case BackendMessageType.openSettings:
          vscode.commands.executeCommand('workbench.action.openSettings', "@ext:chris-hayes.chatgpt-reborn chatgpt.");

          this.logEvent("settings-opened");
          break;
        case BackendMessageType.openSettingsPrompt:
          vscode.commands.executeCommand('workbench.action.openSettings', "@ext:chris-hayes.chatgpt-reborn promptPrefix");

          this.logEvent("settings-prompt-opened");
          break;
        case BackendMessageType.stopGenerating:
          const stopGeneratingData = data as StopGeneratingMessage;
          if (stopGeneratingData?.conversationId) {
            this.stopGenerating(stopGeneratingData.conversationId);
          } else {
            console.warn("[Reborn AI] Main Process - No conversationId provided to stop generating");
          }
          break;
        case BackendMessageType.getSettings:
          this.frontendMessenger.sendSettingsUpdate(vscode.workspace.getConfiguration("chatgpt"));
          break;
        case BackendMessageType.getViewOptions: {
          const viewOptions = await this.offlineStore?.getViewOptions();
          this.frontendMessenger.sendViewOptionsUpdate(viewOptions ?? {});
          break;
        }
        case BackendMessageType.setViewOptions: {
          const viewOptionsData = data as SetViewOptionsMessage;
          await this.offlineStore?.setViewOptions(viewOptionsData.viewOptions);
          break;
        }
        case BackendMessageType.exportToMarkdown:
          const exportToMarkdownData = data as ExportToMarkdownMessage;
          this.exportToMarkdown(exportToMarkdownData.conversation);
          break;
        case BackendMessageType.getModels:
          this.frontendMessenger.sendModels();
          break;
        case BackendMessageType.changeApiUrl:
          const changeApiUrlData = data as ChangeApiUrlMessage;
          this.setApiUrl(changeApiUrlData.apiUrl);
          break;
        case BackendMessageType.changeApiKey:
          const changeApiKeyData = data as ChangeApiKeyMessage;
          this.setApiKey(changeApiKeyData.apiKey);
          break;
        case BackendMessageType.setAzureApiVersion: {
          const setAzureApiVersionData = data as SetAzureApiVersionMessage;
          vscode.workspace.getConfiguration("chatgpt").update("azureApiVersion", setAzureApiVersionData.azureApiVersion, vscode.ConfigurationTarget.Global);
          break;
        }
        case BackendMessageType.getApiKeyStatus:
          const { status, models } = await this.testApiKey();

          this.frontendMessenger.sendApiKeyStatus(status);
          this.frontendMessenger.sendModels(models);
          break;
        case BackendMessageType.resetApiKey:
          this.clearApiKey();
          break;
        case BackendMessageType.setVerbosity:
          const setVerbosityData = data as SetVerbosityMessage;
          const verbosity = setVerbosityData?.verbosity ?? Verbosity.normal;
          vscode.workspace.getConfiguration("chatgpt").update("verbosity", verbosity, vscode.ConfigurationTarget.Global);
          break;
        case BackendMessageType.setShowAllModels:
          const setShowAllModelsData = data as SetShowAllModelsMessage;
          this.showAllModels = setShowAllModelsData.showAllModels;
          vscode.workspace.getConfiguration("chatgpt").update("showAllModels", this.showAllModels, vscode.ConfigurationTarget.Global);
          break;
        case BackendMessageType.setManualModelInput:
          const setManualModelInputData = data as SetManualModelInputMessage;
          vscode.workspace.getConfiguration("chatgpt").update("manualModelInput", setManualModelInputData.useManualModelInput, vscode.ConfigurationTarget.Global);
          break;
        case BackendMessageType.setCurrentConversation:
          const currentConversationData = data as SetCurrentConversationMessage;
          this.currentConversation = currentConversationData.conversation;
          break;
        case BackendMessageType.setConversationList:
          const conversationListData = data as SetConversationListMessage;
          this.conversationList = conversationListData.conversations;
          this.currentConversation = conversationListData.currentConversation;
          break;
        case BackendMessageType.getTokenCount:
          const getTokenCountData = data as GetTokenCountMessage;
          const convTokens = ApiProvider.countConversationTokens(getTokenCountData.conversation);
          let userInputTokens = ApiProvider.countMessageTokens({
            role: Role.user,
            content: getTokenCountData.conversation.userInput
          } as ChatMessage, getTokenCountData.conversation?.model ?? this.model);

          // If "use editor selection" is enabled, add the tokens from the editor selection
          if (getTokenCountData?.useEditorSelection) {
            const selection = this.getActiveEditorSelection();
            // Roughly approximate the number of tokens used for the instructions about using the editor selection
            const roughApproxCodeSelectionContext = 40;

            userInputTokens += ApiProvider.countMessageTokens({
              role: Role.user,
              content: selection?.content ?? ""
            } as ChatMessage, getTokenCountData.conversation?.model ?? this.model) + roughApproxCodeSelectionContext;
          }

          this.frontendMessenger.sendTokenCount(convTokens, userInputTokens, getTokenCountData.conversation.id);
          break;
        case BackendMessageType.runAction:
          const runActionData = data as RunActionMessage;
          const actionId: ActionNames = runActionData.actionId as ActionNames;

          const controller = new AbortController();
          this.abortControllers.push({
            actionName: runActionData.actionId,
            controller
          });

          try {
            const actionResult = await this.runner.runAction(actionId, this.systemContext, controller, runActionData?.actionOptions);

            this.frontendMessenger.sendActionComplete(actionId, actionResult);
          } catch (error: any) {
            console.error("[Reborn AI] Main Process - Error running action: " + actionId);
            console.error(error);

            this.frontendMessenger.sendActionError(actionId, error);
          }

          break;
        case BackendMessageType.stopAction:
          const stopActionData = data as StopActionMessage;
          if (stopActionData?.actionId) {
            this.stopAction(stopActionData.actionId);
          } else {
            console.warn("[Reborn AI] Main Process - No actionName provided to stop action");
          }
          break;
        case BackendMessageType.generateOpenRouterApiKey:
          this.generateOpenRouterApiKey();
          break;
        case BackendMessageType.openExternalUrl:
          const openExternalUrlData = data as OpenExternalUrlMessage;
          vscode.env.openExternal(vscode.Uri.parse(openExternalUrlData.url));
          break;
        default:
          console.warn('[Reborn AI] Main Process - Uncaught message type: "' + data.type + '"');
          break;
      }
    });
  }

  private convertMessagesToMarkdown(conversation: Conversation): string {
    let markdown = conversation.messages.reduce((accumulator: string, message: ChatMessage) => {
      let role = 'Unknown';
      if (message.role === Role.user) {
        role = 'You';
      } else if (message.role === Role.system) {
        role = 'System Context';
      } else if (message.role === Role.assistant) {
        role = 'ChatGPT';
      }
      const isError = message.isError ? "ERROR: " : "";
      const content = message.rawContent ?? message.content;

      let formattedMessage = `<code>**${isError}[${role}]**</code>\n${content}\n\n`;

      // User included editor code selection in their question?
      if (message.role === Role.user && message.questionCode) {
        let code = message.questionCode;

        try {
          // The code will be already formatted with highlight.js
          code = code.replace('<pre><code class="language-', '');
          const split = code.split('">');
          let language = split[0];
          code = split[1].replace('</code></pre>', '');

          formattedMessage += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        } catch (error) {
          // Fallback
          formattedMessage += `\`\`\`\n${code}\n\`\`\`\n\n`;
        }
      }

      return accumulator + formattedMessage;
    }, "");

    return markdown;
  }

  private stopGenerating(conversationId: string): void {
    // Send the abort signal to the corresponding controller
    this.abortControllers.find((controller) => controller.conversationId === conversationId)?.controller.abort();
    // Remove abort controller from array
    this.abortControllers = this.abortControllers.filter((controller) => controller.conversationId !== conversationId);

    this.frontendMessenger.sendShowInProgress(false, conversationId);
  }

  private stopAction(actionName: string): void {
    // Send the abort signal to the corresponding controller
    this.abortControllers.find((controller) => controller.actionName === actionName)?.controller.abort();
    // Remove abort controller from array
    this.abortControllers = this.abortControllers.filter((controller) => controller.actionName !== actionName);
  }

  private get isCodexModel(): boolean {
    return !!this.model?.id.startsWith("code-");
  }

  async setModel(newModel: Model): Promise<Model> {
    // Associate the model with the current API
    // For Azure this is "resourceName" and for OpenAI this is "baseURL"
    let apiBaseURL = this.api.getApiUrl();

    let updatedModelId = newModel.id;

    // If using the official OpenAI API, swap out deprecated models.
    // To avoid breaking anything unintentionally, all other APIs are left alone.
    if (!this.api.isAzure && apiBaseURL.includes("openai.com")) {
      // Check and update the model if it's deprecated
      updatedModelId = getUpdatedModel(newModel.id);

      // If the model was swapped, quitely let the user know.
      if (newModel.id !== updatedModelId) {
        console.info(`[Reborn AI] Updated deprecated model "${newModel.id}" to "${updatedModelId}".`);
        return {
          ...newModel,
          id: updatedModelId,
        };
      }
    }

    // Update the extension's model setting
    await vscode.workspace.getConfiguration("chatgpt").update("gpt3.model", updatedModelId, vscode.ConfigurationTarget.Global);

    // Associate the model with the API
    if (this.authStore) {
      this.authStore.storeModelByApi(apiBaseURL, newModel);
    }

    // Return the model (in case it was updated)
    return newModel;
  }

  private processQuestion(question: string, conversation: Conversation, code?: string, language?: string): string {
    let verbosity = '';
    switch (conversation.verbosity) {
      case Verbosity.code:
        verbosity = 'Do not include any explanations in your answer. Only respond with the code.';
        break;
      case Verbosity.concise:
        verbosity = 'Your explanations should be as concise and to the point as possible, one or two sentences at most.';
        break;
      case Verbosity.full:
        verbosity = 'You should give full explanations that are as detailed as possible.';
        break;
    }

    if (code !== null && code !== undefined) {
      // If the lanague is not specified, get it from the active editor's language
      if (!language) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          language = editor.document.languageId;
        }
      }

      // if the language is still not specified, ask hljs to guess it
      if (!language) {
        const result = hljs.highlightAuto(code);
        language = result.language;
      }

      // Add prompt prefix to the code if there was a code block selected
      question = `${question}. ${verbosity} ${language ? ` The following code is in ${language} programming language.` : ''} Code in question:\n\n###\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else {
      question = `${question}. ${verbosity}`;
    }

    return question;
  }

  formatMessageContent(rawContent: string, markdown: boolean): string {
    return marked.parse(
      !markdown
        ? "```\r\n" + unEscapeHTML(rawContent) + " \r\n ```"
        : (rawContent ?? "").split("```").length % 2 === 1
          ? rawContent
          : rawContent + "\n\n```\n\n"
    );
  }

  public clearConversation(conversationId?: string) {
    // Clear the conversation
    if (conversationId) {
      this.frontendMessenger.sendMessagesUpdated([], conversationId);
    } else {
      console.error("[Reborn AI] Main Process - No conversation to clear");
    }
  }

  public async exportToMarkdown(conversation: Conversation) {
    // convert all messages in the conversation to markdown and open a new document with the markdown
    if (conversation) {
      const markdown = this.convertMessagesToMarkdown(conversation);

      const markdownExport = await vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
      });

      vscode.window.showTextDocument(markdownExport);
    } else {
      console.error("[Reborn AI] Main Process - No conversation to export to markdown");
    }
  }

  public async sendApiRequest(prompt: string, options: ApiRequestOptions) {
    this.logEvent("api-request-sent", { "chatgpt.command": options.command, "chatgpt.hasCode": String(!!options.code) });
    const responseInMarkdown = !this.isCodexModel;

    // 1. First check if the conversation has any messages, if not add the system message
    // However - If the model is a reasoning model, DO NOT add the system context (it's not supported)
    if (options.conversation?.messages.length === 0 && !isReasoningModel(this.model.id)) {
      options.conversation?.messages.push({
        id: uuidv4(),
        content: this.systemContext,
        rawContent: this.systemContext,
        role: Role.system,
        createdAt: Date.now(),
      });
    }

    // 2. Add the user's question to the conversation
    const formattedPrompt = this.processQuestion(prompt, options.conversation, options.code, options.language);
    if (options?.questionId) {
      // find the question in the conversation and update it
      const question = options.conversation?.messages.find((message) => message.id === options.questionId);
      if (question) {
        question.content = this.formatMessageContent(formattedPrompt, responseInMarkdown);
        question.rawContent = formattedPrompt;
        question.questionCode = options?.code
          ? marked.parse(
            `\`\`\`${options?.language}\n${options.code}\n\`\`\``
          )
          : "";
      }
    } else {
      options.conversation?.messages.push({
        id: uuidv4(),
        content: formattedPrompt,
        rawContent: prompt,
        questionCode: options?.code
          ? marked.parse(
            `\`\`\`${options?.language}\n${options.code}\n\`\`\``
          )
          : "",
        role: Role.user,
        createdAt: Date.now(),
      });
    }

    // 3. Tell the webview about the new messages
    this.frontendMessenger.sendMessagesUpdated(options.conversation?.messages, options.conversation?.id ?? '');

    // If the ChatGPT view is not in focus/visible; focus on it to render Q&A
    if (this.webView === null) {
      vscode.commands.executeCommand('vscode-chatgpt.view.focus');
    } else {
      this.webView?.show?.(true);
    }

    // Tell the webview that this conversation is in progress
    this.frontendMessenger.sendShowInProgress(true, options.conversation?.id ?? '');

    try {
      const message: ChatMessage = {
        // Normally random ID is generated, but when editing a question, the response update the same message
        id: options?.messageId ?? uuidv4(),
        content: '',
        rawContent: '',
        role: Role.assistant,
        createdAt: Date.now(),
      };

      // Initialize message in webview. Now event streaming only needs to update the message content
      if (options?.messageId) {
        this.frontendMessenger.sendUpdateMessage(message, options.conversation?.id ?? '');
      } else {
        this.frontendMessenger.sendAddMessage(message, options.conversation?.id ?? '');
      }

      if (this.chatMode && !isInstructModel(this.model)) {
        let lastMessageTime = 0;
        const controller = new AbortController();
        this.abortControllers.push({ conversationId: options.conversation?.id ?? '', controller });

        // Stream ChatGPT response (this is using an async iterator)
        for await (const token of this.api.streamChatCompletion(options.conversation, controller.signal, {
          temperature: options.temperature ?? this._temperature,
          topP: options.topP ?? this._topP,
        })) {
          message.rawContent += token;

          const now = Date.now();
          // Throttle the number of messages sent to the webview
          if (now - lastMessageTime > this.throttling) {
            message.content = this.formatMessageContent((message.rawContent ?? ''), responseInMarkdown);

            // Send webview updated message content
            this.frontendMessenger.sendStreamMessage(options.conversation?.id ?? '', message.id, message.content, message.rawContent);

            lastMessageTime = now;
          }
        }

        // remove the abort controller
        this.abortControllers = this.abortControllers.filter((controller) => controller.conversationId !== options.conversation?.id);

        message.done = true;
        message.content = this.formatMessageContent(message.rawContent ?? "", responseInMarkdown);

        // Send webview full updated message
        this.frontendMessenger.sendUpdateMessage(message, options.conversation?.id ?? '');
      } else if (isInstructModel(this.model)) {
        // Instruct models are not streamed, they are completed in one go
        const content = await this.api.getChatCompletion(options.conversation);

        if (content) {
          message.rawContent = content;
          message.content = this.formatMessageContent(message.rawContent, responseInMarkdown);

          this.frontendMessenger.sendUpdateMessage(message, options.conversation?.id ?? '');
        } else {
          throw new Error("Detected instruct model, attempted to use chat completion; however, the response was empty.");
        }
      } else {
        this.logEvent('chat-mode-off (not sending message)');
      }

      const hasContinuation = ((message.content.split("```").length) % 2) === 0;

      if (hasContinuation) {
        message.content = message.content + " \r\n ```\r\n";
        vscode.window.showInformationMessage("It looks like ChatGPT didn't complete their answer for your coding question. You can ask it to continue and combine the answers.", "Continue and combine answers")
          .then(async (choice) => {
            if (choice === "Continue and combine answers") {
              this.sendApiRequest("Continue", {
                command: options.command,
                conversation: options.conversation,
                code: undefined,
              });
            }
          });
      }

      if (this.subscribeToResponse) {
        // Check if the window is focused
        if (!vscode.window.state.focused) {
          vscode.window.showInformationMessage("ChatGPT responded to your question.", "Open conversation").then(async () => {
            await vscode.commands.executeCommand('vscode-chatgpt.view.focus');
          });
        }
      }
    } catch (error: any) {
      let message;
      let apiMessage = error?.response?.data?.error?.message ?? error?.response?.data?.message ?? error?.response?.message ?? error?.message ?? error?.name ?? (error ?? '').toString();

      if (error.responseBody) {
        apiMessage = JSON.stringify(error.responseBody, null, 2) ?? apiMessage;
      }

      console.error("[Reborn AI] api-request-failed info:", JSON.stringify(error, null, 2));
      console.error("[Reborn AI] api-request-failed error obj:", error);

      // For whatever reason error.status is undefined, but the below works
      const status = JSON.parse(JSON.stringify(error)).status ?? error?.status ?? error?.response?.status ?? error.statusCode ?? error?.response?.statusCode ?? error?.response?.data?.error?.status;

      console.error("[Reborn AI] api-request-failed status:", status);
      console.error("[Reborn AI] api-request-failed message:", apiMessage);

      switch (status) {
        case 400:
          message = `400 Bad Request\n\nYour model: '${this.model?.id}' may be incompatible or one of your parameters is unknown. \n\nServer message: ${apiMessage}`;
          break;
        case 401:
          message = '401 Unauthorized\n\nMake sure your API key is correct, you can reset it by going to "More Actions" > "Reset API Key". Potential reasons: \n- 1. Incorrect API key provided.\n- 2. Incorrect Organization provided. \n See https://platform.openai.com/docs/guides/error-codes for more details. \n\nServer message: ' + apiMessage;
          // set api key status
          this.frontendMessenger.sendApiKeyStatus(ApiKeyStatus.Invalid);
          break;
        case 403:
          if (error?.responseBody) {
            const errorObject = JSON.parse(error.responseBody);
            message = `${errorObject.statusCode} | ${errorObject.code}\n\n${errorObject.message}`;
          } else {
            message = '403 Forbidden\n\nYour token has expired. Please try authenticating again. \n\nServer message: ' + apiMessage;
          }
          break;
        case 404:
          message = `404 Not Found\n\n`;

          // For certain certain proxy paths, recommand a fix
          const apiUrl = this.api.getApiUrl();
          if (apiUrl.includes("openai.1rmb.tk") && apiUrl !== "https://openai.1rmb.tk/v1") {
            message += "It looks like you are using the openai.1rmb.tk proxy server, but the path might be wrong.\nThe recommended path is https://openai.1rmb.tk/v1";
          } else {
            message += `If you've changed the API baseUrlPath, double-check that it is correct.\nYour model: '${this.model?.id}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. \n\nServer message: ${JSON.stringify(JSON.parse(error.responseBody ?? apiMessage), null, 2)}`;
          }
          break;
        case 429:
          message = "429 Too Many Requests\n\nToo many requests try again later. Potential reasons: \n 1. You exceeded your current quota, please check your plan and billing details\n 2. You are sending requests too quickly \n 3. The engine is currently overloaded, please try again later. \n See https://platform.openai.com/docs/guides/error-codes for more details. \n\nServer message: " + apiMessage;
          break;
        case 500:
          message = "500 Internal Server Error\n\nThe server had an error while processing your request, please try again.\nSee https://platform.openai.com/docs/guides/error-codes for more details. \n\nServer message: " + apiMessage;
          break;
        default:
          if (apiMessage) {
            message = `${status ? status + '\n\n' : ''}${apiMessage}`;
          } else {
            message = `${status}\n\nAn unknown error occurred. Please check your internet connection, clear the conversation, and try again.\n\nServer message: ${apiMessage}`;
          }
      }

      this.frontendMessenger.sendAddError(uuidv4(), options.conversation?.id ?? '', message);

      return;
    } finally {
      this.frontendMessenger.sendShowInProgress(false, options.conversation?.id ?? '');
    }
  }

  private logEvent(eventName: string, properties?: {}): void {
    console.debug(eventName, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "chatgpt.model": this.model || "unknown", ...properties
    }, {
      "chatgpt.properties": properties,
    });
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const vendorHighlightCss = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.css'));
    const vendorHighlightJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.js'));
    const vendorMarkedJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'marked.min.js'));
    // React code bundled by webpack, this includes styling
    const webpackScript = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.bundle.js'));

    const nonce = this.getRandomId();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body class="overflow-hidden">
        <div id="root" class="flex flex-col min-h-[calc(100vh-8em)] max-h-screen"></div>
        <script nonce="${nonce}" src="${webpackScript}"></script>
        <script src="${vendorHighlightJs}" defer async></script>
        <script src="${vendorMarkedJs}" defer async></script>
        <link href="${vendorHighlightCss}" rel="stylesheet">
      </body>
      </html>`;
  }

  private getRandomId() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }


  private getActiveEditorSelection(): {
    content: string;
    language: string;
  }
    | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const selection = editor.document.getText(editor.selection);
    const language = editor.document.languageId;

    return {
      content: selection,
      language
    };
  }

  // * For OpenRouter API key exchange
  // Listen for the OAuth callback from the OpenRouter
  listenForOpenRouterCallback(code_verifier: string,
    pkceChallengeMethod: 'plain' | 'S256' = 'S256'
    /* , correctState: string */) {
    // Set up a really simple server to listen for the callback on localhost:7878
    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? '', `http://${req.headers.host}`);

      // OpenRouter OAuth PKCE flow
      if (url.searchParams.has('code')) {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (code) {
          if (!this.authStore) {
            console.error('[Reborn AI] [PKCE] No auth store found');
            return;
          }

          // check if the state matches
          /* if (state !== correctState) {
            console.error(`[PKCE] State mismatch. Expected: ${correctState}. Received: ${state}`);
            return;
          } */

          // Make a request to the backend to exchange the code for an API key
          try {
            // Send the code to the backend with the built-in fetch API
            const body = JSON.stringify({
              code: encodeURIComponent(code),
              code_verifier: encodeURIComponent(code_verifier),
              code_challenge_method: pkceChallengeMethod,
            });

            const response = await fetch(`${this.api.getApiUrl()}/auth/keys`, {
              method: 'POST',
              body,
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();

              this.setApiKey(data.key);

              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('API key successfully set. You can close this tab now.');
            } else {
              console.error(`[Reborn AI] Failed to exchange code for API key. Status: ${response.status}`);

              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Failed to exchange code for API key');

              // set api key status
              this.frontendMessenger.sendApiKeyStatus(ApiKeyStatus.Error);
            }
          } catch (error) {
            console.error(`[Reborn AI] Error exchanging code for API key: ${error}`);

            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error exchanging code for API key');

            // set api key status
            this.frontendMessenger.sendApiKeyStatus(ApiKeyStatus.Error);
          } finally {
            // Close the server
            server.close();
          }
        } else {
          console.error(`[Reborn AI] No code provided. uri: ${url.toString()}`);
        }
      } else {
        console.error(`[Reborn AI] No code provided. uri: ${url.toString()}`);
      }
    });

    server.listen(7878, 'localhost');

    return server;
  }

  // Send OAuth PKCE request to the OpenRouter
  async generateOpenRouterApiKey() {
    if (!this.authStore) {
      console.error("[Reborn AI] Main Process - AuthStore not initialized");
      return;
    }

    // API key status
    this.frontendMessenger.sendApiKeyStatus(ApiKeyStatus.Authenticating);

    const PKCE_CHALLENGE_METHOD: 'S256' | 'plain' = 'plain';

    const {
      code_verifier,
      code_challenge,
    } = await pkceChallenge(43, PKCE_CHALLENGE_METHOD);

    // Start a server to listen for the callback
    const server = this.listenForOpenRouterCallback(code_verifier, PKCE_CHALLENGE_METHOD);

    const uri = await vscode.env.asExternalUri(vscode.Uri.parse('http://localhost:7878'));
    // Can't get the challenge working with openrouter
    // const openRouterAuthUrl = `${(new URL(this.api.getApiUrl() ?? '')).origin}/auth?callback_url=${uri.toString()}`; // &code_challenge=${encodeURIComponent(code_challenge)}`; not working
    let callbackUrl = encodeURIComponent(uri.toString());
    // if callback url ends with a slash, remove it
    if (callbackUrl.endsWith('/')) {
      callbackUrl = callbackUrl.slice(0, -1);
    }
    const openRouterAuthUrl = `${(new URL(this.api.getApiUrl() ?? '')).origin}/auth?code_challenge_method=${PKCE_CHALLENGE_METHOD}&code_challenge=${code_challenge}&callback_url=${callbackUrl}`;

    vscode.env.openExternal(vscode.Uri.parse(openRouterAuthUrl));

    // timeout the server after 5 minutes
    setTimeout(() => {
      if (server) {
        try {
          server.close();
          console.warn('[Reborn AI] OpenRouter callback server closed (5 min timeout)');
        } catch (error) { }
      }
    }, 300000);
  }
}
