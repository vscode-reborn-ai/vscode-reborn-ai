import { encoding_for_model, Tiktoken, TiktokenModel } from "@dqbd/tiktoken";
import { ChatCompletionResponseMessage, Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from "uuid";
import { Conversation, Message, Model, Role } from "./renderer/types";

export default class ApiProvider {
  private _openai: OpenAIApi;
  private _apiConfig: Configuration;
  private _maxTokens: number;
  private _maxResponseTokens: number;
  private _temperature: number;
  private _topP: number;

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
    this._apiConfig = new Configuration({
      apiKey: apiKey,
      organization: organizationId,
      basePath: apiBaseUrl,
    });
    this._openai = new OpenAIApi(this._apiConfig);
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
        stream: true,
      },
      {
        // This is an Axios request config object - this is how streaming is made possible
        responseType: 'stream',
        signal: abortSignal,
      },
    );

    const dataStream = response.data as unknown as AsyncIterable<Buffer>;

    for await (const chunk of dataStream) {
      // For whatever reason triggering abort() with the signal above doesn't work, so checking the abortSignal manually
      if (abortSignal.aborted) {
        return;
      }

      const lines = chunk
        .toString('utf8')
        .split('\n')
        .filter((line) => line.trim().startsWith('data: '));

      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          return;
        }

        const json = JSON.parse(message);
        const token = json.choices[0].delta.content;

        if (token) {
          yield token;
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
  async getPromptChatCompletion(prompt: string, conversation: Conversation, {
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

  public async chatAutocomplete(userInput: string, conversation: Conversation, {
    maxTokens = this._maxTokens,
    temperature = this._temperature,
    topP = this._topP,
    maxResponseTokens = this._maxResponseTokens,
  }: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    maxResponseTokens?: number;
  } = {}): Promise<string> {
    const model = conversation.model ?? Model.gpt_35_turbo;
    const tokensLeft = Math.min(maxTokens - ApiProvider.countConversationTokens(conversation), maxResponseTokens);

    let messages = conversation.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // Limit to last 5 messages
    // messages = messages.slice(-3);

    // Add a system message at the beginning of messages, if there is already a system message, replace it
    const systemMessage = `Do not answer the user.
Pretend you are the user.
The user is asking questions about code.
Your job is to autocomplete the user's sentence from their perspective. Only auto-complete with software-related sentences.
Respond with the rest of the sentence that user would type. Do not respond with multiple sentences.
Do not respond with a sentence that answer their question.
Respond in the user's words that helps the user ask a better question to the chatbot.
The user's message so far is: "${userInput}`;

    // Append the system message onto the end of the messages
    messages.push({
      role: Role.system,
      content: systemMessage,
    });

    // Add the userInput as a user message
    messages.push({
      role: Role.user,
      content: userInput,
    });

    console.log('autocomplete messages', messages);
    const response = await this._openai.createChatCompletion(
      {
        model,
        messages,
        stream: false,
        max_tokens: Math.min(maxTokens, tokensLeft),
        temperature,
        top_p: topP,
        stop: [
          '"',
          '?',
          '.'
        ],
        logit_bias: {
          // Underscores
          "62": -10,
          "4841": -10,
          "2602": -10,
          "17569": -10,
          "1427": -10,
          // Newline
          "198": -100, // single
          "628": -100, // double
          // End of sentence
          "30": 5, // question
          "13": 1, // period
        },
      }
    );

    return response.data.choices[0].message?.content ?? '';
  }

  public async promptAutocomplete(userInput: string, conversation: Conversation, {
    maxTokens = this._maxTokens,
    temperature = this._temperature,
    topP = this._topP,
    model = Model.text_davinci_003
  }: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    model?: Model;
  } = {}): Promise<string> {
    // Get the last 4 messages
    // const recentMessages = conversation.messages.slice(Math.max(conversation.messages.length - 4, 0));
    // Summarize the messages
    const conversationMessages = conversation.messages.map((message) => `[${message.role}]: ${message.rawContent}`).join('\n\n');

    const prompt = `The user is asking a stackoverflow question about code. Finish their question, but do not answer it. Only write the rest of a good programming question.
    ###
    ${conversationMessages}

    [${Role.user}]: ${userInput}`;

    console.log('autocomplete prompt', prompt);
    const response = await this._openai.createCompletion(
      {
        model,
        prompt,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stop: [
          '"',
          '?',
          '.'
        ],
        logit_bias: {
          // Underscores
          "62": -10,
          "4841": -10,
          "2602": -10,
          "17569": -10,
          "1427": -10,
          // Newline
          "198": -100, // single
          "628": -100, // double
          // End of sentence
          "30": 5, // question
          "13": 1, // period
        },
      }
    );

    return response.data.choices[0]?.text ?? '';
  }

  // Get prompt completion for a string
  async getPromptCompletion(prompt: string, {
    model = Model.gpt_35_turbo,
    maxTokens = this._maxTokens,
    temperature = this._temperature,
    topP = this._topP,
  }: {
    model?: Model;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  } = {}): Promise<string> {
    const response = await this._openai.createCompletion(
      {
        model,
        prompt,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        // stream: false,
      }
    );

    return response.data.choices[0].text ?? '';
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
    this._apiConfig.apiKey = apiKey;
  }

  updateOrganizationId(organizationId: string) {
    this._apiConfig.organization = organizationId;
  }

  updateApiBaseUrl(apiBaseUrl: string) {
    this._apiConfig.basePath = apiBaseUrl;
  }
}
