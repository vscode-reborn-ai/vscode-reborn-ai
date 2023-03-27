import { ChatCompletionResponseMessage, Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from "uuid";
import { Conversation, Message, Model, Role } from "./renderer/types";

export default class ApiProvider {
  private openai: OpenAIApi;
  private apiConfig: Configuration;
  private maxTokens: number;
  private temperature: number;
  private topP: number;

  constructor(apiKey: string, {
    organizationId = '',
    maxTokens = 2048,
    temperature = 0.9,
    topP = 1,
  }: {
    organizationId?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  } = {}) {
    this.apiConfig = new Configuration({
      apiKey: apiKey,
      organization: organizationId,
    });
    this.openai = new OpenAIApi(this.apiConfig);
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.topP = topP;
  }

  updateApiKey(apiKey: string) {
    this.apiConfig.apiKey = apiKey;
  }

  updateOrganizationId(organizationId: string) {
    this.apiConfig.organization = organizationId;
  }

  // OpenAI's library doesn't support streaming, but great workaround from @danneu - https://github.com/openai/openai-node/issues/18#issuecomment-1483808526
  async* streamChatCompletion(conversation: Conversation, abortSignal: AbortSignal): AsyncGenerator<any, any, unknown> {
    const response = await this.openai.createChatCompletion(
      {
        model: conversation.model ?? Model.gpt_35_turbo,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_p: this.topP,
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

  async getChatCompletion(conversation: Conversation): Promise<ChatCompletionResponseMessage | undefined> {
    const response = await this.openai.createChatCompletion(
      {
        model: conversation.model ?? Model.gpt_35_turbo,
        messages: conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        stream: false,
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
    maxTokens = this.maxTokens,
    temperature = this.temperature,
    topP = this.topP,
  }: {
    maxTokens: number;
    temperature: number;
    topP: number;
  }): Promise<Message | undefined> {
    const response = await this.openai.createCompletion(
      {
        model: conversation.model ?? Model.gpt_35_turbo,
        prompt,
        max_tokens: maxTokens,
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

}