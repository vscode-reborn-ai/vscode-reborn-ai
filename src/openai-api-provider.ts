import { encodingForModel, Tiktoken, TiktokenModel } from "js-tiktoken";
import OpenAI, { ClientOptions } from 'openai';
import { v4 as uuidv4 } from "uuid";
import { ChatMessage, Conversation, MODEL_TOKEN_LIMITS, Role } from "./renderer/types";

const FALLBACK_MODEL_ID = 'gpt-4-turbo';

/*

* openai-api-provider.ts

Responsible for handling API calls to OpenAI's API
(or any server that implements the OpenAI API).

*/

export class ApiProvider {
  private _openai: OpenAI;
  private _temperature: number;
  private _topP: number;
  private _modelList: OpenAI.Model[] | undefined;

  public apiConfig: ClientOptions;

  constructor(apiKey: string, {
    organizationId = '',
    apiBaseUrl = 'https://api.openai.com/v1',
    maxTokens = 4096,
    maxResponseTokens,
    temperature = 0.9,
    topP = 1,
  }: {
    organizationId?: string;
    apiBaseUrl?: string;
    maxTokens?: number;
    maxResponseTokens?: number;
    temperature?: number;
    topP?: number;
  } = {}) {
    // If apiBaseUrl ends with slash, remove it
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    // OpenAI API config
    this.apiConfig = {
      apiKey: apiKey,
      organization: organizationId,
      baseURL: apiBaseUrl,
    };
    this._openai = new OpenAI(this.apiConfig);
    this._temperature = temperature;
    this._topP = topP;
  }

  getRemainingTokens(modelId: string, promptTokensUsed: number) {
    const modelContext = MODEL_TOKEN_LIMITS.get(modelId)?.context ?? 128000;
    const modelMax = MODEL_TOKEN_LIMITS.get(modelId)?.max ?? 4096;

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
      throw new Error(`This conversation uses ${promptTokensUsed} tokens, but this model (${modelId}) only supports ${modelContext} context tokens. Please reduce the amount of code you're including, clear the conversation to reduce past messages size or use a different model with a bigger prompt token limit.`);
    }

    return tokensLeft;
  }

  // OpenAI's library doesn't support streaming, but great workaround from @danneu - https://github.com/openai/openai-node/issues/18#issuecomment-1483808526
  async* streamChatCompletion(conversation: Conversation, abortSignal: AbortSignal, {
    temperature = this._temperature,
    topP = this._topP,
  }: {
    temperature?: number;
    topP?: number;
  } = {}): AsyncGenerator<any, any, unknown> {
    const modelId = conversation.model?.id ?? FALLBACK_MODEL_ID;
    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(modelId, promptTokensUsed);

    // Only stream if not using a proxy
    const useStream = true; // this.apiConfig.basePath === 'https://api.openai.com/v1';
    const response = await this._openai.chat.completions.create(
      {
        model: modelId,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens: completeTokensLeft,
        temperature,
        top_p: topP,
        stream: useStream,
      }
    );

    for await (const chunk of response) {
      if (abortSignal.aborted) {
        return;
      }

      try {
        const token = chunk.choices[0].delta.content;

        if (token) {
          yield token;
        }
      } catch (e: any) {
        console.error('api JSON parse error. Message:', e?.message, 'Error:', e);
      }
    }
  }

  async getChatCompletion(conversation: Conversation, {
    temperature = this._temperature,
    topP = this._topP,
  }: {
    temperature?: number;
    topP?: number;
  } = {}): Promise<OpenAI.Chat.Completions.ChatCompletionMessage | undefined> {
    const modelId = conversation.model?.id ?? FALLBACK_MODEL_ID;
    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(modelId, promptTokensUsed);

    const response = await this._openai.chat.completions.create(
      {
        model: modelId,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        stream: false,
        max_tokens: completeTokensLeft,
        temperature,
        top_p: topP,
      }
    );

    return response.choices[0].message;
  }

  // Note: PromptCompletion is LEGACY
  // Using prompt as a param instead of the last message in the conversation to
  // allow for special formatting of the prompt before sending it to OpenAI
  async getPromptCompletion(prompt: string, conversation: Conversation, {
    temperature = this._temperature,
    topP = this._topP,
  }: {
    temperature?: number;
    topP?: number;
  } = {}): Promise<ChatMessage | undefined> {
    const modelId = conversation.model?.id ?? 'gpt-4-turbo';
    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(modelId, promptTokensUsed);

    const response = await this._openai.chat.completions.create(
      {
        model: modelId,
        messages: [{ "role": "user", "content": prompt }],
        max_tokens: completeTokensLeft,
        temperature,
        top_p: topP,
        stream: false,
      }
    );

    return {
      id: uuidv4(),
      content: response.choices[0].message.content ?? '',
      rawContent: response.choices[0].message.content ?? '',
      role: Role.assistant,
      createdAt: Date.now(),
    };
  }

  // * Utility token counting methods
  public static getEncodingForModel(modelId: string): Tiktoken {
    try {
      return encodingForModel(modelId as TiktokenModel);
    } catch (e) {
      console.info(`Failed to get encoding for model ${modelId}. Using default model ${FALLBACK_MODEL_ID}.`);
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

  public static countMessageTokens(message: ChatMessage, model: OpenAI.Model | undefined, encoder?: Tiktoken): number {
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

  async updateApiKey(apiKey: string) {
    // OpenAI API config
    this.apiConfig = {
      apiKey: apiKey,
      organization: this.apiConfig.organization,
      baseURL: this.apiConfig.baseURL,
    };

    this._openai = new OpenAI(this.apiConfig);

    this.repullModelList();
  }

  async updateOrganizationId(organizationId: string) {
    // OpenAI API config
    this.apiConfig = {
      apiKey: this.apiConfig.apiKey,
      organization: organizationId,
      baseURL: this.apiConfig.baseURL,
    };

    this._openai = new OpenAI(this.apiConfig);

    this.repullModelList();
  }

  async updateApiBaseUrl(apiBaseUrl: string) {
    // If apiBaseUrl ends with slash, remove it
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    // OpenAI API config
    this.apiConfig = {
      apiKey: this.apiConfig.apiKey,
      organization: this.apiConfig.organization,
      baseURL: this.apiConfig.baseURL,
    };

    this._openai = new OpenAI(this.apiConfig);

    this.repullModelList();
  }

  private async repullModelList(): Promise<void> {
    this._modelList = (await this._openai.models.list()).getPaginatedItems();
  }

  async getModelList(): Promise<OpenAI.Model[]> {
    if (!this._modelList) {
      await this.repullModelList();
    }

    return this._modelList ?? [];
  }
}
