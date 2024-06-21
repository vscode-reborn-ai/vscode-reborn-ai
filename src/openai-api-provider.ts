import { AzureOpenAIProvider, AzureOpenAIProviderSettings, createAzure } from '@ai-sdk/azure';
import { OpenAIProvider, OpenAIProviderSettings, createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { Tiktoken, TiktokenModel, encodingForModel } from "js-tiktoken";
import ky from "ky";
import { getModelCompletionLimit, getModelContextLimit } from "./renderer/helpers";
import { ChatMessage, Conversation, Model, Role } from "./renderer/types";

/** openai-api-provider.ts

Responsible for handling API calls to OpenAI's API
(or any server that implements the OpenAI API).

*/

// Fallback model ID used for token counting
const FALLBACK_MODEL_ID = 'gpt-4-turbo';

export class ApiProvider {
  private _openai: OpenAIProvider | AzureOpenAIProvider | undefined;
  private _temperature: number;
  private _topP: number;
  private _modelList: Model[] = [];

  public config: OpenAIProviderSettings = {};
  public isAzure: boolean = false;
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
    }) {
    this._temperature = temperature;
    this._topP = topP;

    this.config = this.updateConfig({
      apiKey,
      organization,
      baseURL: baseApiUrl.replace(/\/$/, ''),
      // temperature,
      // topP,
    });

    // this.providerRegistry = createProviderRegistry({});

    this.rebuildOpenAIProvider();
  }

  // setModel(modelId: string) {

  getRemainingTokens(model: Model | undefined, promptTokensUsed: number) {
    // const modelContext = MODEL_TOKEN_LIMITS.get(modelId)?.context ?? 128000;
    // const modelMax = MODEL_TOKEN_LIMITS.get(modelId)?.max ?? 4096;
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

    // Only stream if not using a proxy
    /*
    const useStream = true;
    const response = await this._openai.chat.completions.create(
      {
        model: conversation.model?.id ?? FALLBACK_MODEL_ID,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens: completeTokensLeft,
        temperature,
        top_p: topP,
        stream: useStream,
      }, {
    });
    */

    const { textStream } = await
      // this._openai.chat(
      // conversation.model?.id ?? FALLBACK_MODEL_ID,
      // {
      streamText({
        // model: this.providerRegistry.languageModel(`${this.isAzure ? 'azure' : 'openai'}:${conversation.model?.id ?? FALLBACK_MODEL_ID}`),
        model: this._openai.languageModel(conversation.model?.id ?? FALLBACK_MODEL_ID),
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        maxTokens: completeTokensLeft,
        temperature,
        topP,
        abortSignal,
      });

    for await (const textPart of textStream) {
      if (abortSignal.aborted) {
        return;
      }

      yield textPart;
    }


    // for await (const chunk of response) {
    //   if (abortSignal.aborted) {
    //     return;
    //   }

    //   try {
    //     if (chunk.choices.length > 0) {
    //       const token = chunk.choices[0].delta.content;

    //       if (token) {
    //         yield token;
    //       }
    //     }
    //   } catch (e: any) {
    //     console.error('[Reborn AI] api JSON parse error. Message:', e?.message, 'Error:', e);
    //   }
    // }
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

    // const response = await this._openai.chat.completions.create(
    //   {
    //     model: conversation.model?.id ?? FALLBACK_MODEL_ID,
    //     messages: conversation.messages.map((message) => ({
    //       role: message.role,
    //       content: message.content,
    //     })),
    //     stream: false,
    //     max_tokens: completeTokensLeft,
    //     temperature,
    //     top_p: topP
    //   }, {
    //   headers: {
    //     "HTTP-Referer": "https://github.com/Christopher-Hayes/vscode-chatgpt-reborn",
    //     "X-Title": "VSCode Reborn AI",
    //   }
    // });

    // return response.choices[0].message;

    const { text } = await generateText({
      // model: this.providerRegistry.languageModel(`${this.isAzure ? 'azure' : 'openai'}:${conversation.model?.id ?? FALLBACK_MODEL_ID}`),
      model: this._openai.languageModel(conversation.model?.id ?? FALLBACK_MODEL_ID),
      messages: conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      maxTokens: completeTokensLeft,
      temperature,
      topP,
    });

    return text;
  }

  // Note: PromptCompletion is LEGACY
  // Using prompt as a param instead of the last message in the conversation to
  // allow for special formatting of the prompt before sending it to OpenAI
  /*
  async getPromptCompletion(prompt: string, conversation: Conversation, {
    temperature = this._temperature,
    topP = this._topP,
  }: {
    temperature?: number;
    topP?: number;
  } = {}): Promise<ChatMessage | undefined> {
    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(conversation.model, promptTokensUsed);

    const response = await this._openai.chat.completions.create(
      {
        model: conversation.model?.id ?? FALLBACK_MODEL_ID,
        messages: [{ "role": "user", "content": prompt }],
        max_tokens: completeTokensLeft,
        temperature,
        top_p: topP,
        stream: false,
      }, {
      headers: {
        "HTTP-Referer": "https://github.com/Christopher-Hayes/vscode-chatgpt-reborn",
        "X-Title": "VSCode Reborn AI",
      }
    });

    return {
      id: uuidv4(),
      content: response.choices[0].message.content ?? '',
      rawContent: response.choices[0].message.content ?? '',
      role: Role.assistant,
      createdAt: Date.now(),
    };
  }
  */

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

  private updateConfig(config: Partial<OpenAIProviderSettings & AzureOpenAIProviderSettings>) {
    const baseURL = config.baseURL ?? this.config.baseURL ?? '';

    this.config = {
      ...this.config,
      ...config,
      baseURL,
      // Use 'compatible' for non-OpenAI tools that mimic the OpenAI API.
      compatibility: config.compatibility ?? (baseURL.includes('openai.com') || baseURL.includes('azure.com') ? 'strict' : 'compatible'),
      // The way 'ai' uses fetch may be okay.
      // But, going to give the cross-platform library, ky, a try
      // Where 'got' is only for node.js, 'ky' is for the browser (and node.js).
      // fetch: ky,
      // On OpenRouter, this allows the Reborn AI to show on the app leaderboard.
      headers: {
        ...this.config.headers,
        ...config.headers,
        "HTTP-Referer": "https://github.com/Christopher-Hayes/vscode-chatgpt-reborn",
        "X-Title": "VSCode Reborn AI",
      }
    };

    return this.config;
  }

  private async rebuildOpenAIProvider() {
    if ((this.config?.baseURL ?? '').includes('.azure.com')) {
      // Azure OpenAI API
      // Azure docs: https://learn.microsoft.com/en-us/javascript/api/@azure/openai/
      this.isAzure = true;

      /*
        Azure's AI dashboard calls it "endpoint".
        Vercel's AI package calls is "resource name".
        Same thing.
      */

      // this.config.deployment = this.config.deployment ?? '';

      // If baseURL contains "/deployments/{deployment}", remove it, and assign the deployment as the modelId
      let deployment: string | undefined = undefined;

      if (this.config.baseURL && this.config.baseURL.includes('/deployments/')) {
        const urlParts = this.config.baseURL.split('/');
        deployment = urlParts[urlParts.length - 1];
      }

      const endpoint = (this.config.baseURL ?? '').replace(`/deployments/${deployment}`, '');

      // `endpoint` and `baseURL` are mutually exclusive.
      // TODO: not sure if this is needed with the 'ai' package
      this.config.baseURL = undefined;

      // TODO: Vercel's 'ai' package doesn't take an API version?
      // this.config.apiVersion = await vscode.workspace.getConfiguration("chatgpt").get("apiVersion") as string ?? process.env.OPENAI_API_VERSION ?? '2024-02-01';

      if (!deployment) {
        console.warn('[Reborn AI] Attempting to set up Azure OpenAI API without a deployment ID. This will likely fail.');
      }

      this.updateConfig({
        resourceName: endpoint,
      });

      this._openai = createAzure(this.config);
      // this.providerRegistry = createProviderRegistry({
      //   azure: this._openai,
      // });
    } else {
      // All non-Azure APIs
      this.isAzure = false;

      this._openai = createOpenAI(this.config);
      // this.providerRegistry = createProviderRegistry({
      //   openai: this._openai,
      // });
    }
  }

  async updateApiKey(apiKey: string) {
    this.updateConfig({
      apiKey,
    });

    await this.rebuildOpenAIProvider();
    await this.repullModelListOnce();
  }

  async updateOrganizationId(organization: string) {
    this.updateConfig({
      organization
    });

    await this.rebuildOpenAIProvider();
    await this.repullModelListOnce();
  }

  async updateApiBaseUrl(apiBaseUrl: string) {
    // Only update if the base URL has changed
    // This can trigger twice when propagating changes to the extension settings.
    if (apiBaseUrl === this.config.baseURL) {
      return;
    }

    // If apiBaseUrl ends with slash, remove it
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');

    this.updateConfig({
      baseURL: apiBaseUrl
    });
    console.log('[Reborn AI] Updated API base URL:', apiBaseUrl, 'config:', this.config);

    await this.rebuildOpenAIProvider();
    await this.repullModelListOnce();

    console.log('[Reborn AI] Rebuilt api provider with new base URL:', this.config);
    console.log('[Reborn AI] repulled model list', this._modelList);
  }

  // Vercel's ai package doesn't yet have a way to fetch the model list
  // Issue: https://github.com/vercel/ai/issues/1896
  // private async fetchModelList(): Promise<Model[]> {
  //   if (!this.config.baseURL) {
  //     console.error('[Reborn AI] API base URL not set');
  //     return [];
  //   }

  //   try {
  //     const data = await ky.get(`${this.config.baseURL}/models`, {
  //       headers: {
  //         "Authorization": `Bearer ${this.config.apiKey}`,
  //       },
  //     }).json() as { data: Model[]; };

  //     console.log('[Reborn AI] model list', data.data);

  //     return data.data;
  //   } catch (e) {
  //     console.error('[Reborn AI] Failed to fetch model list', e);
  //     return [];
  //   }
  // }

  // Ensures that only a single model list fetch is in progress at a time
  private async repullModelListOnce(): Promise<void> {
    if (!this.pendingModelFetch) {
      this.pendingModelFetch = this.repullModelList();
    }

    return this.pendingModelFetch;
  }

  private async repullModelList(): Promise<void> {
    if (this.isAzure) {
      this._modelList = [{
        id: (this.config as AzureOpenAIProviderSettings).resourceName ?? '',
        name: 'Default Azure Model',
        created: Date.now(),
        object: "model",
        owned_by: Role.user,
      }];

      return;
    }

    if (!this._openai) {
      console.error('[Reborn AI] OpenAI API not initialized');
      return;
    }

    const modelEndpointNotFound = new Error('Model endpoint not found.');
    const missingApiKey = new Error('Missing API key.');

    try {
      // if we call openai's function and it 404s, it breaks out of this try block
      // so we're gonna first poke the endpoint to see if it's there first
      const data = await ky.get(`${this.config.baseURL}/models`, {
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

      // Did not 404, so we can fetch models from the OpenAI API
      this._modelList = data.data as Model[];
    } catch (error: any | Error) {
      if (error === modelEndpointNotFound) {
        // If 404 error, this might be the ollama API
        // Attempt to fetch models from the ollama API
        try {
          // const response = await ky.get('http://localhost:11434/api/tags');
          const data = await ky.get(`${(this.config.baseURL ?? '').replace('/v1', '')}/api/tags`).json() as {
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
        }
      } else if (error === missingApiKey) {
        // print out the request URL, body, and headers
        console.error('[Reborn AI] Missing API key', error, {
          url: `${this.config.baseURL}/models`,
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
          },
        }, 'config:', this.config);
        throw error;
      } else {
        console.error('[Reborn AI] Failed to fetch models from OpenAI API', error);
        throw error;
      }
    } finally {
      // Reset the pending model fetch promise
      this.pendingModelFetch = undefined;
    }
  }

  // Will not make a request, unless model list is empty
  // _modelList is only updated when API settings are updated
  async getModelList(): Promise<Model[]> {
    if (this._modelList?.length === 0) {
      await this.repullModelListOnce();
    }

    return this._modelList ?? [];
  }

  // Utilities
  // Is the API an Azure API?
  isApiAzure(apiUrl?: string): boolean {
    if (apiUrl) {
      return apiUrl.includes('cognitiveservices.azure.com');
    } else {
      return (this.config.baseURL ?? '').includes('cognitiveservices.azure.com');
    }
  }
}
