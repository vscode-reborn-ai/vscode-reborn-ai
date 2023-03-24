// Adapted from https://github.com/transitive-bullshit/chatgpt-api

/**
 * 
 * MIT License

Copyright (c) 2023 Travis Fischer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import Keyv from "keyv";
import pTimeout from "p-timeout";
import QuickLRU from "quick-lru";
import { v4 as uuidv4 } from "uuid";
import { ChatGPTError, DeltaMessage, Message, Role } from "./renderer/types";

var openai;
((openai2) => {
})(openai || (openai = {}));

// src/fetch.ts
var fetch = globalThis.fetch;

// src/fetch-sse.ts
import { createParser } from "eventsource-parser";
import { Conversation } from "./renderer/types";

// src/stream-async-iterable.t./types
async function* streamAsyncIterable(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    console.warn("streamAsyncIterable: stream is null");
    return;
  }

  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// src/fetch-sse.ts
async function fetchSSE(url: RequestInfo | URL, options: {
  [x: string]: any; method?: string; headers?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Authorization: string;
  }; body?: string; signal?: any; onMessage: any;
}, fetch2 = fetch) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch2(url, fetchOptions);
  if (!res.ok) {
    let reason;
    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }

    const error = {
      response: res,
      statusCode: res.status,
      statusText: res.statusText,
      reason: reason,
    } as ChatGPTError;

    throw error;
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  if (!res?.body?.getReader) {
    const body = res.body as any;
    if (!body?.on || !body?.read) {
      throw new ChatGPTError('unsupported "fetch" implementation');
    }
    body.on("readable", () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        parser.feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  }
}

// src/chatgpt-api.ts
var CHATGPT_MODEL = "gpt-3.5-turbo";
var USER_LABEL_DEFAULT = "User";
var ASSISTANT_LABEL_DEFAULT = "ChatGPT";
class ChatGPTAPI {
  _apiKey: string;
  _apiBaseUrl: string;
  _debug: boolean;
  _organizationId: string | undefined;
  _fetch: typeof fetch;
  _completionParams: any;
  _systemMessage: string;
  _maxModelTokens: number;
  _maxResponseTokens: number;
  _getMessageById: (id: string) => Promise<Message>;
  _upsertMessage: (message: DeltaMessage) => Promise<void>;
  _messageStore: any;

  /**
   * Creates a new client wrapper around OpenAI's chat completion API, mimicing the official ChatGPT webapp's functionality as closely as possible.
   *
   * @param apiKey - OpenAI API key (required).
   * @param apiBaseUrl - Optional override for the OpenAI API base URL.
   * @param debug - Optional enables logging debugging info to stdout.
   * @param completionParams - Param overrides to send to the [OpenAI chat completion API](https://platform.openai.com/docs/api-reference/chat/create). Options like `temperature` and `presence_penalty` can be tweaked to change the personality of the assistant.
   * @param maxModelTokens - Optional override for the maximum number of tokens allowed by the model's context. Defaults to 4096.
   * @param maxResponseTokens - Optional override for the minimum number of tokens allowed for the model's response. Defaults to 1000.
   * @param messageStore - Optional [Keyv](https://github.com/jaredwray/keyv) store to persist chat messages to. If not provided, messages will be lost when the process exits.
   * @param getMessageById - Optional function to retrieve a message by its ID. If not provided, the default implementation will be used (using an in-memory `messageStore`).
   * @param upsertMessage - Optional function to insert or update a message. If not provided, the default implementation will be used (using an in-memory `messageStore`).
   * @param organization - Optional organization string for openai calls
   * @param fetch - Optional override for the `fetch` implementation to use. Defaults to the global `fetch` function.
   */
  constructor(opts: {
    apiKey: string;
    systemMessage: string;
    completionParams?: any;
    maxModelTokens?: 4000 | undefined;
    maxResponseTokens?: 1000 | undefined;
    apiBaseUrl?: string | undefined;
    getMessageById?: (id: string) => Promise<Message>;
    upsertMessage?: (message: DeltaMessage) => Promise<void>;
    organizationId?: string;
    debug?: true | undefined;
    messageStore?: any;
    fetch?: ((input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>) | undefined;
  }) {
    const {
      apiKey,
      apiBaseUrl = "https://api.openai.com",
      organizationId: organizationId,
      debug = true, // false,
      messageStore,
      completionParams,
      systemMessage,
      maxModelTokens = 4e3,
      maxResponseTokens = 1e3,
      getMessageById,
      upsertMessage,
      fetch: fetch2 = fetch
    } = opts;
    this._apiKey = apiKey;
    this._apiBaseUrl = apiBaseUrl;
    this._organizationId = organizationId;
    this._debug = !!debug;
    this._fetch = fetch2;
    this._completionParams = {
      model: CHATGPT_MODEL,
      temperature: 0.8,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      top_p: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      presence_penalty: 1,
      ...completionParams
    };
    this._systemMessage = systemMessage;
    if (this._systemMessage === void 0) {
      const currentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      this._systemMessage = `You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.
Knowledge cutoff: 2021-09-01
Current date: ${currentDate}`;
    }
    this._maxModelTokens = maxModelTokens;
    this._maxResponseTokens = maxResponseTokens;
    this._getMessageById = getMessageById ?? this._defaultGetMessageById;
    this._upsertMessage = upsertMessage ?? this._defaultUpsertMessage;
    if (messageStore) {
      this._messageStore = messageStore;
    } else {
      this._messageStore = new Keyv({
        store: new QuickLRU({ maxSize: 1e4 })
      } as any);
    }
    if (!this._apiKey) {
      throw new Error("OpenAI missing required apiKey");
    }
    if (!this._fetch) {
      throw new Error("Invalid environment; fetch is not defined");
    }
    if (typeof this._fetch !== "function") {
      throw new Error('Invalid "fetch" is not a function');
    }
  }
  /**
   * Sends a message to the OpenAI chat completions endpoint, waits for the response
   * to resolve, and returns the response.
   *
   * If you want your response to have historical context, you must provide a valid `parentMessageId`.
   *
   * If you want to receive a stream of partial responses, use `opts.onProgress`.
   *
   * Set `debug: true` in the `ChatGPTAPI` constructor to log more info on the full prompt sent to the OpenAI chat completions API. You can override the `systemMessage` in `opts` to customize the assistant's instructions.
   *
   * @param message - The prompt message to send
   * @param opts.parentMessageId - Optional ID of the previous message in the conversation (defaults to `undefined`)
   * @param opts.messageId - Optional ID of the message to send (defaults to a random UUID)
   * @param opts.systemMessage - Optional override for the chat "system message" which acts as instructions to the model (defaults to the ChatGPT system message)
   * @param opts.timeoutMs - Optional timeout in milliseconds (defaults to no timeout)
   * @param opts.onProgress - Optional callback which will be invoked every time the partial response is updated
   * @param opts.abortSignal - Optional callback used to abort the underlying `fetch` call using an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
   * @param completionParams - Optional overrides to send to the [OpenAI chat completion API](https://platform.openai.com/docs/api-reference/chat/create). Options like `temperature` and `presence_penalty` can be tweaked to change the personality of the assistant.
   *
   * @returns The response from ChatGPT
   */
  async sendMessage(content: any,
    conversation: Conversation,
    opts: {
      parentMessageId?: any;
      messageId?: any;
      systemMessage?: any;
      timeoutMs?: any;
      onProgress?: any;
      abortSignal?: any;
      completionParams?: any;
      stream?: any;
    }) {
    // Extract necessary fields from options
    const {
      parentMessageId,
      messageId = uuidv4(),
      timeoutMs,
      onProgress,
      stream = true, // = onProgress ? true : false,
      completionParams
    } = opts;

    console.debug("sendMessage", { content, conversation, opts });

    // Initialize abort controller and signal
    let { abortSignal } = opts;
    let abortController: AbortController | null = null;
    if (timeoutMs && !abortSignal) {
      abortController = new AbortController();
      abortSignal = abortController.signal;
    }

    // Create user message object
    const newMessage = {
      role: Role.user,
      id: messageId,
      parentMessageId,
      content,
    } as Message;

    // Upsert the message
    await this._upsertMessage(newMessage);

    // Build messages array
    // const { messages } = await this._buildMessages(text, opts);

    const messages = [...conversation.messages, newMessage];

    // if the messages are missing a system message, add it
    if (!messages.find((m) => m.role === Role.system)) {
      messages.unshift({
        id: uuidv4(),
        role: Role.system,
        content: this._systemMessage,
        createdAt: Date.now(),
      } as Message);
    }

    // Create assistant result object
    const result = {
      role: Role.assistant,
      id: uuidv4(),
      parentMessageId: messageId,
      content: ""
    } as DeltaMessage;
    const responseP = (new Promise(async (resolve, reject) => {
      const url = `${this._apiBaseUrl}/v1/chat/completions`;
      const headers = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${this._apiKey}`,
      } as any;

      if (this._organizationId) {
        headers["OpenAI-Organization"] = this._organizationId;
      }

      const body = {
        ...this._completionParams,
        ...completionParams,
        model: conversation.model ?? this._completionParams.model,
        // only include role and content in what is sent to OpenAI
        messages: messages.map(({ role, content }) => ({ role, content })),
        stream,
      };

      if (stream) {
        try {
          await fetchSSE(
            url,
            {
              method: "POST",
              headers,
              body: JSON.stringify(body),
              signal: abortSignal,
              onMessage: (data: string) => {
                if (data === "[DONE]") {
                  result.content = result.content.trim();
                  return resolve({
                    ...result,
                    cancel: () => {
                      abortController?.abort();
                    },
                  });
                }
                try {
                  const response = JSON.parse(data);
                  if (response.id) {
                    result.id = response.id;
                  }
                  if (response.choices?.length) {
                    const delta = response.choices[0].delta;
                    result.delta = delta.content;
                    if (delta.content) {
                      result.content += delta.content;
                    }
                    result.detail = response;
                    if (delta.role) {
                      result.role = delta.role;
                    }
                    onProgress?.(result);
                  }
                } catch (err) {
                  console.warn(
                    "Open AI has an unexpected error during streaming",
                    err
                  );
                  return reject(err);
                }
              },
            },
            this._fetch
          );
          // We want to resolve the Promise when fetchSSE resolves, so nothing to do here.
        } catch (err) {
          return reject(err);
        }
      } else {
        try {
          const res = await this._fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: abortSignal,
          });

          if (!res.ok) {
            const reason = await res.text();

            const error = {
              response: res,
              statusCode: res.status,
              statusText: res.statusText,
              reason,
            } as ChatGPTError;

            return reject(error);
          }

          const response = await res.json();
          if (this._debug) {
            console.log(response);
          }
          if (response.id) {
            result.id = response.id;
          }
          if (response.choices?.length) {
            const message2 = response.choices[0].message;
            result.content = message2.content;
            if (message2.role) {
              result.role = message2.role;
            }
          } else {
            const errorResponse = response;
            return reject(
              new Error(
                `OpenAI has an error: ${errorResponse?.detail?.message || errorResponse?.detail || "unknown"
                }`
              )
            );
          }

          result.detail = response;
          return resolve({
            ...result,
            cancel: () => {
              abortController?.abort();
            },
          });
        } catch (err) {
          return reject(err);
        }
      }
    }) as Promise<DeltaMessage>).then((message2: DeltaMessage) => {
      return this._upsertMessage(message2).then(() => message2);
    });


    if (timeoutMs) {
      return pTimeout(responseP, {
        milliseconds: timeoutMs,
        message: "OpenAI timed out waiting for response"
      });
    } else {
      return responseP;
    }
  }

  get apiKey() {
    return this._apiKey;
  }
  set apiKey(apiKey) {
    this._apiKey = apiKey;
  }

  // Helper function to construct human-readable prompt lines based on message role
  getMessageLines(role: string, label: string, content: any) {
    switch (role) {
      case "system":
        return [`Instructions:\n${content}`];
      case "user":
        return [`${label}:\n${content}`];
      default:
        return [`${label}:\n${content}`];
    }
  }

  async _buildMessages(content: any, opts: { /* name?: any; */ systemMessage?: any; parentMessageId?: any; }) {
    const { systemMessage = this._systemMessage } = opts;
    let { parentMessageId } = opts;

    const userLabel = USER_LABEL_DEFAULT;
    const assistantLabel = ASSISTANT_LABEL_DEFAULT;
    let messages = [] as Message[];

    // Add system message if present
    if (systemMessage) {
      messages.push({
        id: uuidv4(),
        role: Role.system,
        content: systemMessage,
        createdAt: Date.now(),
      });
    }

    const systemMessageOffset = messages.length;

    // Create new array with added user message or use original messages array
    let nextMessages: Message[] = content
      ? messages.concat([
        {
          id: uuidv4(),
          role: Role.user,
          content,
          createdAt: Date.now(),
        },
      ])
      : messages;

    // Iterate while there is a parent message ID
    do {
      // Construct the prompt for each message in the array
      nextMessages
        .reduce((promptAcc: any[], message: { role: string; content: any; }) => {
          const messageLines = this.getMessageLines(
            message.role,
            message.role === "user" ? userLabel : assistantLabel,
            message.content
          );
          return promptAcc.concat(messageLines);
        }, [])
        .join("\n\n");

      messages = nextMessages;

      if (!parentMessageId) {
        break;
      }

      // Retrieve parent message by ID
      const parentMessage = await this._getMessageById(parentMessageId);

      if (!parentMessage) {
        break;
      }

      // const parentMessageRole = parentMessage.role || "user";

      // Include the parent message and update the nextMessages array
      nextMessages = nextMessages
        .slice(0, systemMessageOffset)
        .concat([
          // {
          //   role: parentMessageRole,
          //   content: parentMessage.content,
          //   name: parentMessage.name,
          // },
          parentMessage,
          ...nextMessages.slice(systemMessageOffset),
        ]);

      parentMessageId = parentMessage.parentMessageId;

    } while (true);

    return { messages };
  }

  async _defaultGetMessageById(id: any) {
    const res = await this._messageStore.get(id);
    return res;
  }
  async _defaultUpsertMessage(message: { id: any; }) {
    await this._messageStore.set(message.id, message);
  }
};
export {
  ChatGPTAPI,
  ChatGPTError,
  openai
};
