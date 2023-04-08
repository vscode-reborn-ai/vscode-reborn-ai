import { encoding_for_model, Tiktoken, TiktokenModel } from "@dqbd/tiktoken";
import { ChatCompletionResponseMessage, Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from "uuid";
import { Conversation, Message, Model, Role } from "./renderer/types";
// https://openai.1rmb.tk/v1/

export default class ApiProvider {
  private _openai: OpenAIApi;
  private _maxTokens: number;
  private _maxResponseTokens: number;
  private _temperature: number;
  private _topP: number;

  public apiConfig: Configuration;

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
    this.apiConfig = new Configuration({
      apiKey: apiKey,
      organization: organizationId,
      basePath: apiBaseUrl,
    });
    this._openai = new OpenAIApi(this.apiConfig);
    this._maxTokens = maxTokens;
    this._maxResponseTokens = maxResponseTokens ?? maxTokens;
    this._temperature = temperature;
    this._topP = topP;
  }

  // OpenAI's library doesn't support streaming, but great workaround from @danneu - https://github.com/openai/openai-node/issues/18#issuecomment-1483808526
  async* streamChatCompletion(conversation: Conversation, abortSignal: AbortSignal, {
    maxTokens = this._maxTokens,
    temperature = this._temperature,
    topP = this._topP,
    maxResponseTokens = this._maxResponseTokens,
  }: {
    maxTokens?: number;
    maxResponseTokens?: number;
    temperature?: number;
    topP?: number;
  } = {}): AsyncGenerator<any, any, unknown> {
    const model = conversation.model ?? Model.gpt_35_turbo;
    const tokensUsed = ApiProvider.countConversationTokens(conversation);
    const tokensLeft = Math.min(maxTokens - tokensUsed, maxResponseTokens);
    // Only stream if not using a proxy
    const useStream = true; // this.apiConfig.basePath === 'https://api.openai.com/v1';
    const response = await this._openai.createChatCompletion(
      {
        model,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens: tokensLeft,
        temperature,
        top_p: topP,
        // Note - this alone won't make streaming work, OpenAI's SDK generator doesn't implement streaming
        stream: useStream,
      },
      {
        // This is an Axios request config object - this is how streaming is made possible
        responseType: useStream ? 'stream' : 'json',
        signal: abortSignal,
      },
    );

    const dataStream = response.data as unknown as AsyncIterable<Buffer>;

    // Weird bug with proxies where the first chunk is broken up into two
    let incompleteLine = '';

    for await (const chunk of dataStream) {
      // For whatever reason triggering abort() with the signal above doesn't work, so checking the abortSignal manually
      if (abortSignal.aborted) {
        return;
      }

      const lines = chunk.toString('utf8').split('\n');

      for (const line of lines) {
        if (!line.trim().startsWith('data: ') && incompleteLine === '') {
          continue;
        }

        const message = (incompleteLine + line).replace(/^data: /, '');

        if (message === '[DONE]') {
          return;
        }

        try {
          const json = JSON.parse(message);

          const token = json.choices[0].delta.content;

          if (token) {
            yield token;
          }

          incompleteLine = '';
        } catch (e) {
          console.error('api JSON parse error. Message:', message, 'Error:', e);
          incompleteLine += message;
        }
      }
    }
  }

  async getChatCompletion(conversation: Conversation, {
    maxTokens = this._maxTokens,
    temperature = this._temperature,
    topP = this._topP,
    maxResponseTokens = this._maxResponseTokens,
  }: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    maxResponseTokens?: number;
  } = {}): Promise<ChatCompletionResponseMessage | undefined> {
    const model = conversation.model ?? Model.gpt_35_turbo;
    const tokensLeft = Math.min(maxTokens - ApiProvider.countConversationTokens(conversation), maxResponseTokens);
    const response = await this._openai.createChatCompletion(
      {
        model,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        stream: false,
        max_tokens: tokensLeft,
        temperature,
        top_p: topP,
      },
      {
        responseEncoding: 'utf8',
      },
    );

    return response.data.choices[0].message;
  }

  // Using prompt as a param instead of the last message in the conversation to
  // allow for special formatting of the prompt before sending it to OpenAI
  async getPromptCompletion(prompt: string, conversation: Conversation, {
    maxTokens = this._maxTokens,
    temperature = this._temperature,
    topP = this._topP,
    maxResponseTokens = this._maxResponseTokens,
  }: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    maxResponseTokens?: number;
  } = {}): Promise<Message | undefined> {
    const model = conversation.model ?? Model.gpt_35_turbo;
    const tokensLeft = Math.min(maxTokens - ApiProvider.countConversationTokens(conversation), maxResponseTokens);
    const response = await this._openai.createCompletion(
      {
        model,
        prompt,
        max_tokens: tokensLeft,
        temperature,
        top_p: topP,
        stream: false,
      }
    );

    return {
      id: uuidv4(),
      content: response.data.choices[0].text ?? '',
      rawContent: response.data.choices[0].text ?? '',
      role: Role.assistant,
      createdAt: Date.now(),
    };
  }

  // * Utility token counting methods
  public static countConversationTokens(conversation: Conversation): number {
    const enc = encoding_for_model((conversation.model ?? Model.gpt_35_turbo) as TiktokenModel);
    let tokensUsed = 0;

    for (const message of conversation.messages) {
      tokensUsed += ApiProvider.countMessageTokens(message, conversation.model ?? Model.gpt_35_turbo, enc);
    }

    tokensUsed += 2; // every reply is primed with <im_start>assistant

    enc.free();
    return tokensUsed;
  }

  public static countMessageTokens(message: Message, model: Model, encoder?: Tiktoken): number {
    let enc = encoder ?? encoding_for_model(model as TiktokenModel);
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

    if (!encoder) {
      enc.free();
    }
    return tokensUsed;
  }

  // Calculate tokens remaining for OpenAI's response
  public static getRemainingPromptTokens(maxTokens: number, prompt: string, model: Model): number {
    return maxTokens - ApiProvider.countPromptTokens(prompt, model);
  }

  public static countPromptTokens(prompt: string, model: Model): number {
    const enc = encoding_for_model(model as TiktokenModel);
    const tokens = enc.encode(prompt).length;

    enc.free();
    return tokens;
  }

  // * Getters and setters
  set maxTokens(value: number) {
    this._maxTokens = value;
  }

  set temperature(value: number) {
    this._temperature = value;
  }

  set topP(value: number) {
    this._topP = value;
  }

  updateApiKey(apiKey: string) {
    // OpenAI API config
    this.apiConfig = new Configuration({
      apiKey: apiKey,
      organization: this.apiConfig.organization,
      basePath: this.apiConfig.basePath,
    });
    this._openai = new OpenAIApi(this.apiConfig);
  }

  updateOrganizationId(organizationId: string) {
    // OpenAI API config
    this.apiConfig = new Configuration({
      apiKey: this.apiConfig.apiKey,
      organization: organizationId,
      basePath: this.apiConfig.basePath,
    });
    this._openai = new OpenAIApi(this.apiConfig);
  }

  updateApiBaseUrl(apiBaseUrl: string) {
    // If apiBaseUrl ends with slash, remove it
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    // OpenAI API config
    this.apiConfig = new Configuration({
      apiKey: this.apiConfig.apiKey,
      organization: this.apiConfig.organization,
      basePath: apiBaseUrl,
    });
    this._openai = new OpenAIApi(this.apiConfig);
  }
}
