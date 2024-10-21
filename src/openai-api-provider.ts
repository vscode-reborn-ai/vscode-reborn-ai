import { AzureOpenAIProvider, AzureOpenAIProviderSettings, createAzure } from '@ai-sdk/azure';
import { OpenAIProvider, OpenAIProviderSettings, createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { Tiktoken, TiktokenModel, encodingForModel } from "js-tiktoken";
import ky from "ky";
import { z } from 'zod';
import { isReasoningModel } from "./helpers";
import { getModelCompletionLimit, getModelContextLimit } from "./renderer/helpers";
import { ApiKeyStatus, ModelListStatus } from "./renderer/store/types";
import { ChatMessage, Conversation, Model, Role } from "./renderer/types";
import Messenger from "./send-to-frontend";

/** openai-api-provider.ts

Responsible for handling API calls to OpenAI's API
(or any server that implements the OpenAI API).

*/

// Fallback model ID used for token counting
const FALLBACK_MODEL_ID = 'gpt-4-turbo';

const azureSettingsSchema = z.object({
  apiKey: z.string().default(''),
  resourceName: z.string().default(''),
}).strict();

const openaiSettingsSchema = z.object({
  apiKey: z.string().default(''),
  baseURL: z.string().default('https://api.openai.com/v1'),
  organization: z.string().optional(),
  project: z.string().optional(),
  headers: z.record(z.string()).optional(),
  compatibility: z.enum(['strict', 'compatible']).default('compatible'),
  fetch: z.function().optional(),
});


export class ApiProvider {
  private _openai: OpenAIProvider | AzureOpenAIProvider | undefined;
  private _temperature: number;
  private _topP: number;
  private _modelList: Model[] = [];

  public config: OpenAIProviderSettings | AzureOpenAIProviderSettings = {};

  // For communication with the frontend
  private frontendMessenger: Messenger;

  // For Azure
  public isAzure: boolean = false;
  public deploymentName: string | undefined;

  // public baseApiUrl: string = 'https://api.openai.com/v1';
  // Testing this out, right now not used to maximum potential
  // For every new provider, you have to rebuild the provider registry, which is a pain
  // public providerRegistry: experimental_ProviderRegistry;

  // when the models are getting fetched, allow async functions to wait for the models to be fetched
  public pendingModelFetch: Promise<void> | undefined = undefined;

  constructor(apiKey: string, {
    organization,
    apiBaseUrl: baseApiUrl = 'https://api.openai.com/v1',
    temperature = 0.9,
    topP = 1,
  }: {
    organization: string | undefined;
    apiBaseUrl: string;
    temperature: number;
    topP: number;
  } = {
      organization: undefined,
      apiBaseUrl: 'https://api.openai.com/v1',
      temperature: 0.9,
      topP: 1,
    },
    frontendMessenger: Messenger,
  ) {
    this._temperature = temperature;
    this._topP = topP;

    this.frontendMessenger = frontendMessenger;

    if (this.checkIfAzure(baseApiUrl)) {
      this.updateAzureConfig({
        apiKey,
      }, baseApiUrl);
    } else {
      this.updateConfig({
        apiKey,
        organization,
        baseURL: baseApiUrl.replace(/\/$/, ''),
      } as OpenAIProviderSettings);
    }

    // this.providerRegistry = createProviderRegistry({});
  }

  // setModel(modelId: string) {

  getRemainingTokens(model: Model | undefined, promptTokensUsed: number) {
    const modelContext = getModelContextLimit(model);
    const modelMax = getModelCompletionLimit(model);

    // OpenAI's maxTokens is used as max (prompt + complete) tokens
    // We must calculate total context window - prompt tokens being sent to determine max response size
    // This is complicated by the fact that some models have a max token completion limit
    let tokensLeft = 4096;

    if (modelMax !== undefined) {
      // Models with a max token limit (ie gpt-4-turbo)
      tokensLeft = Math.min(modelContext - promptTokensUsed, modelMax);
    } else {
      // Models without a max token limit (ie gpt-4)
      tokensLeft = modelContext - promptTokensUsed;
    }

    if (tokensLeft < 0) {
      throw new Error(`This conversation uses ${promptTokensUsed} tokens, but this model (${model?.name ?? model?.id}) only supports ${modelContext} context tokens. Please reduce the amount of code you're including, clear the conversation to reduce past messages size or use a different model with a bigger prompt token limit.`);
    }

    return tokensLeft;
  }

  async* streamChatCompletion(conversation: Conversation, abortSignal: AbortSignal, {
    temperature = this._temperature,
    topP = this._topP,
  }: {
    temperature?: number;
    topP?: number;
  } = {}): AsyncGenerator<any, any, unknown> {
    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(conversation.model, promptTokensUsed);

    if (!this._openai) {
      console.error('[Reborn AI] OpenAI API not initialized');
      return;
    }

    let model = conversation.model?.id ?? FALLBACK_MODEL_ID;

    if (this.isAzure) {
      // sample api url: https://reborn-testing.openai.azure.com/openai/deployments/gpt-4o
      // if the "model" contains /deployments/, then extract the deployment name
      model = model.split('/deployments/').pop() ?? model;
    }

    const { textStream } = await
      streamText({
        // model: this.providerRegistry.languageModel(`${this.isAzure ? 'azure' : 'openai'}:${conversation.model?.id ?? FALLBACK_MODEL_ID}`),
        model: this._openai.languageModel(model),
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        maxTokens: isReasoningModel(model) ? undefined : completeTokensLeft,
        temperature,
        topP,
        abortSignal,
      });

    let sent = '';

    for await (const textPart of textStream) {
      if (abortSignal.aborted) {
        return;
      }

      sent += textPart;
      yield textPart;
    }
  }

  async getChatCompletion(conversation: Conversation, {
    temperature = this._temperature,
    topP = this._topP,
  }: {
    temperature?: number;
    topP?: number;
  } = {}): Promise<string | undefined> {
    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(conversation.model, promptTokensUsed);

    if (!this._openai) {
      console.error('[Reborn AI] OpenAI API not initialized');
      return;
    }

    let model = conversation.model?.id ?? FALLBACK_MODEL_ID;

    if (this.isAzure) {
      // sample api url: https://reborn-testing.openai.azure.com/openai/deployments/gpt-4o
      // if the "model" contains /deployments/, then extract the deployment name
      model = model.split('/deployments/').pop() ?? model;
    }

    const { text } = await generateText({
      // model: this.providerRegistry.languageModel(`${this.isAzure ? 'azure' : 'openai'}:${conversation.model?.id ?? FALLBACK_MODEL_ID}`),
      model: this._openai.languageModel(model),
      messages: conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      maxTokens: isReasoningModel(model) ? undefined : completeTokensLeft,
      temperature,
      topP,
    });

    return text;
  }

  // Utility token counting methods
  public static getEncodingForModel(modelId: string): Tiktoken {
    try {
      return encodingForModel(modelId as TiktokenModel);
    } catch (e) {
      // This model is not in tiktoken, fallback to default
      return encodingForModel(FALLBACK_MODEL_ID as TiktokenModel);
    }
  }

  public static countConversationTokens(conversation: Conversation): number {
    const enc = this.getEncodingForModel(conversation.model?.id ?? FALLBACK_MODEL_ID);
    let tokensUsed = 0;

    for (const message of conversation.messages) {
      tokensUsed += ApiProvider.countMessageTokens(message, conversation.model, enc);
    }

    tokensUsed += 3; // every reply is primed with <im_start>assistant

    return tokensUsed;
  }

  public static countMessageTokens(message: ChatMessage, model: Model | undefined, encoder?: Tiktoken): number {
    let enc = encoder ?? this.getEncodingForModel(model?.id ?? FALLBACK_MODEL_ID);
    let tokensUsed = 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n

    const openAIMessage = {
      role: message.role ?? Role.user,
      content: message.content ?? '',
      // name: message.name,
    };

    for (const [key, value] of Object.entries(openAIMessage)) {
      // Assuming encoding is available and has an encode method
      const tokens = enc.encode(value);
      tokensUsed += tokens ? tokens.length : 0;

      if (key === "name") { // if there's a name, the role is omitted
        tokensUsed -= 1; // role is always required and always 1 token
      }
    }

    return tokensUsed;
  }

  // Calculate tokens remaining for OpenAI's response
  public static getRemainingPromptTokens(maxTokens: number, prompt: string, modelId: string): number {
    return maxTokens - ApiProvider.countPromptTokens(prompt, modelId);
  }

  public static countPromptTokens(prompt: string, modelId: string): number {
    const enc = this.getEncodingForModel(modelId);
    const tokens = enc.encode(prompt).length;

    return tokens;
  }

  // * Getters and setters
  set temperature(value: number) {
    this._temperature = value;
  }

  set topP(value: number) {
    this._topP = value;
  }

  private updateConfig(config: OpenAIProviderSettings) {
    const validGlobalConfig = openaiSettingsSchema.parse(this.config);
    const validConfig = openaiSettingsSchema.parse(config);

    this.config = {
      // Default values

      ...validGlobalConfig,
      ...validConfig,
      // The way 'ai' uses fetch may be okay.
      // But, going to give the cross-platform library, ky, a try
      // Where 'got' is only for node.js, 'ky' is for the browser (and node.js).
      // fetch: ky,
      // On OpenRouter, this allows the Reborn AI to show on the app leaderboard.
      headers: {
        ...(this.config as OpenAIProviderSettings).headers,
        ...config.headers,
        "HTTP-Referer": "https://github.com/vscode-reborn-ai/vscode-reborn-ai",
        "X-Title": "VSCode Reborn AI",
      }
    } as OpenAIProviderSettings;

    // Use 'compatible' for non-OpenAI tools that mimic the OpenAI API.
    (this.config as OpenAIProviderSettings).compatibility = ((this.config as OpenAIProviderSettings).baseURL ?? '').includes('openai.com') ? 'strict' : 'compatible';

    this.rebuildOpenAIProvider();
  }

  private updateAzureConfig(config: AzureOpenAIProviderSettings, baseURL?: string) {
    this.isAzure = true;

    this.config = {
      resourceName: config?.resourceName ?? (this.config as AzureOpenAIProviderSettings).resourceName ?? '',
      apiKey: config?.apiKey ?? (this.config as AzureOpenAIProviderSettings).apiKey ?? '',
      // The way 'ai' uses fetch may be okay.
      // But, going to give the cross-platform library, ky, a try
      // Where 'got' is only for node.js, 'ky' is for the browser (and node.js).
      // fetch: ky,
    } as AzureOpenAIProviderSettings;

    this.rebuildAzureOpenAIProvider(baseURL);
  }

  private rebuildAzureOpenAIProvider(baseURL?: string) {
    // Azure OpenAI API
    // Azure docs: https://learn.microsoft.com/en-us/javascript/api/@azure/openai/
    this.isAzure = true;

    /*
      From the user, we get a URL like: https://reborn-testing.openai.azure.com/deployments/gpt-4o

      Azure's AI dashboard mentions "endpoint".     ie, https://reborn-testing.openai.azure.com/
      Azure's AI also mentions "deployment".        ie, gpt-4o
      Vercel's AI package mentions "resource name". ie, reborn-testing
    */

    if (baseURL && baseURL.includes('/deployments/')) {
      const urlParts = baseURL.split('/');
      this.deploymentName = urlParts[urlParts.length - 1];
    } else {
      console.warn('[Reborn AI] Azure OpenAI API deployment ID not found in URL:', baseURL);
    }

    const endpoint = (baseURL ?? '').replace(`/deployments/${this.deploymentName}`, '');
    const resourceName = (endpoint.split('.').shift() ?? endpoint).replace('https://', '');

    // TODO: Vercel's 'ai' package doesn't take an API version?
    // this.config.azureApiVersion = await vscode.workspace.getConfiguration("chatgpt").get("azureApiVersion") as string ?? process.env.OPENAI_API_VERSION ?? '2024-02-01';
    // const azureApiVersion = await vscode.workspace.getConfiguration("chatgpt").get("azureApiVersion") as string ?? process.env.OPENAI_API_VERSION ?? '2024-02-01';

    if (!this.deploymentName) {
      console.warn('[Reborn AI] Attempting to set up Azure OpenAI API without a deployment ID. This will likely fail.');
    }

    (this.config as AzureOpenAIProviderSettings).resourceName = resourceName;

    this._openai = createAzure(this.config);
    // this.providerRegistry = createProviderRegistry({
    //   azure: this._openai,
    // });
  }

  private rebuildOpenAIProvider() {
    // All non-Azure APIs
    this.isAzure = false;

    this._openai = createOpenAI(this.config);
    // this.providerRegistry = createProviderRegistry({
    //   openai: this._openai,
    // });
  }

  async updateApiKey(apiKey: string) {
    this.frontendMessenger.sendApiKeyStatus(ApiKeyStatus.Pending);

    if (this.isAzure) {
      this.updateAzureConfig({
        apiKey,
      });
    } else {
      this.updateConfig({
        apiKey,
      });
    }

    await this.repullModelListOnce();
  }

  async updateOrganizationId(organization: string) {
    if (this.isAzure) {
      console.info('[Reborn AI] organization updated, ignored. Azure API does not use an organization ID');
    } else {
      this.updateConfig({
        organization,
      });
    }

    await this.repullModelListOnce();
  }

  async updateApiBaseUrl(apiBaseUrl: string) {
    this.frontendMessenger.sendApiKeyStatus(ApiKeyStatus.Pending);

    // If apiBaseUrl ends with slash, remove it
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');

    this.isAzure = this.checkIfAzure(apiBaseUrl);

    // Only update if the base URL has changed
    // This can trigger twice when propagating changes to the extension settings.
    if (!this.isAzure && apiBaseUrl === (this.config as OpenAIProviderSettings).baseURL) {
      return;
    }

    if (this.isAzure) {
      this.updateAzureConfig({}, apiBaseUrl);
    } else {
      this.updateConfig({
        baseURL: apiBaseUrl
      });
    }

    await this.repullModelListOnce();
  }

  async updateApiKeyAndBaseUrl(apiKey: string, apiBaseUrl: string) {
    // If apiBaseUrl ends with slash, remove it
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');

    this.isAzure = this.checkIfAzure(apiBaseUrl);

    if (this.isAzure) {
      this.updateAzureConfig({
        apiKey,
      }, apiBaseUrl);
    } else {
      this.updateConfig({
        apiKey,
        baseURL: apiBaseUrl,
      });
    }

    await this.repullModelListOnce();
  }

  // Ensures that only a single model list fetch is in progress at a time
  private async repullModelListOnce(): Promise<void> {
    if (!this.pendingModelFetch) {
      this.pendingModelFetch = this.repullModelList()
        .catch((reason) => {
          console.error('[Reborn AI] Failed to fetch models:', reason);
        }).finally(() => {
          // Reset the pending model fetch promise
          this.pendingModelFetch = undefined;
        });
    }

    return this.pendingModelFetch;
  }

  private async repullModelList(): Promise<void> {
    if (this.isAzure) {
      this._modelList = [{
        id: this.deploymentName ?? FALLBACK_MODEL_ID,
        name: 'Default Azure Model',
        created: Date.now(),
        object: "model",
        owned_by: Role.user,
      }];

      return;
    }

    if (!this._openai) {
      console.error('[Reborn AI] OpenAI API not initialized');

      throw new Error('OpenAI API not initialized');
      // return;
    }

    const modelEndpointNotFound = new Error('Model endpoint not found.');
    const missingApiKey = new Error('Missing API key.');

    // Vercel's ai package doesn't yet have a way to fetch the model list
    // Issue: https://github.com/vercel/ai/issues/1896
    try {
      // if we call openai's function and it 404s, it breaks out of this try block
      // so we're gonna first poke the endpoint to see if it's there first
      let url = '';

      if (this.isAzure) {
        const config = this.config as AzureOpenAIProviderSettings;
        url = `https://${config.resourceName}.openai.azure.com/openai/deployments/${this.deploymentName}/models`;
      } else {
        const config = this.config as OpenAIProviderSettings;
        url = `${config.baseURL}/models`;
      }

      const data = await ky.get(url, {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        hooks: {
          afterResponse: [
            async (_input, _options, response) => {
              switch (response.status) {
                case 401:
                  throw missingApiKey;
                case 404:
                  throw modelEndpointNotFound;
                default:
                  return response;
              }
            },
          ],
        },
      }).json() as {
        object: string;
        data: Model[];
      };

      if (url.includes('api.featherless.ai')) {
        // Get extra data about models from the featherless API
        const featherModels = await ky.get('https://api.featherless.ai/feather/models').json() as {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          owned_by: string;
          model_class: string;
          favorites: number;
          downloads: number;
          status: string;
          health: string;
        }[];

        // Combine the two model lists
        // so that properties for a model are combined from both sources
        // and the list is deduplicated
        const combinedModels = new Map<string, Model>();

        for (const model of featherModels) {
          combinedModels.set(model.id, {
            id: model.id,
            name: model.name,
            created: Date.parse(model.created_at),
            object: "model",
            owned_by: model.owned_by as Role,
            // Featherless-specific fields
            favorites: model.favorites,
            downloads: model.downloads,
            status: model.status,
            health: model.health,
          });
        }

        for (const model of data.data) {
          combinedModels.set(model.id, {
            ...combinedModels.get(model.id) ?? {},
            ...model
          });
        }

        this._modelList = Array.from(combinedModels.values());

        console.info('[Reborn AI] Successfully fetched models from featherless API');
      } else {
        // Did not 404, so we can fetch models from the OpenAI API
        this._modelList = data.data as Model[];
      }
    } catch (error: any | Error) {
      console.error('[Reborn AI] Failed to fetch models from OpenAI API', error);

      if (error === modelEndpointNotFound) {
        // If 404 error, this might be the ollama API
        // Attempt to fetch models from the ollama API
        try {
          // const response = await ky.get('http://localhost:11434/api/tags');
          const data = await ky.get(`${((this.config as OpenAIProviderSettings).baseURL ?? '').replace('/v1', '')}/api/tags`).json() as {
            // ollama /models endpoint response
            models: {
              name: string;
              modified_at: string;
              size: number;
              digest: string;
              details: string;
            }[];
          };

          this._modelList = data.models.map((model: any): Model => ({
            id: model.name,
            name: model.name,
            created: Date.parse(model.modified_at),
            object: "model",
            owned_by: Role.user,
            // Ollama-specific fields
            size: model.size,
            digest: model.digest,
            details: model.details,
          }));

          console.info('[Reborn AI] Successfully fetched models from ollama API');
        } catch (e) {
          console.error('[Reborn AI] Failed to fetch models from ollama API', e);

          throw new Error('Failed to fetch models.');
        }
      } else if (error === missingApiKey) {
        // print out the request URL, body, and headers
        console.error('[Reborn AI] Missing API key', error, {
          url: `${(this.config as OpenAIProviderSettings).baseURL}/models`,
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
          },
        }, 'config:', this.config);

        throw error;
      } else {
        console.error('[Reborn AI] Failed to fetch models from OpenAI API', error);

        throw error;
      }
    }
  }

  // Will not make a request, unless model list is empty
  // _modelList is only updated when API settings are updated
  async getModelList(): Promise<Model[]> {
    if (this._modelList?.length === 0) {
      this.frontendMessenger.sendModelListStatus(ModelListStatus.Fetching);

      await this.repullModelListOnce();

      this.frontendMessenger.sendModelListStatus(ModelListStatus.Fetched);
    }

    return this._modelList ?? [];
  }

  getApiUrl(): string {
    if (this.isAzure) {
      return this.buildAzureApiUrl((this.config as AzureOpenAIProviderSettings).resourceName ?? '', this.deploymentName ?? '');
    } else {
      return (this.config as OpenAIProviderSettings).baseURL ?? '';
    }
  }

  // Utilities
  // Is the API an Azure API?
  checkIfAzure(apiUrl: string): boolean {
    return apiUrl.includes('azure.com');
  }

  buildAzureApiUrl(resourceName: string, deploymentName: string): string {
    return `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}`;
  }

}
