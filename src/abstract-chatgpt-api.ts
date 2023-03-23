// Adapted from https://github.com/transitive-bullshit/chatgpt-api/blob/v3/license

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
import * as types from './types';

export abstract class AChatGPTAPI {
    /**
     * Performs any async initialization work required to ensure that this API is
     * properly authenticated.
     *
     * @throws An error if the session failed to initialize properly.
     */
    abstract initSession(): Promise<void>;

    /**
     * Sends a message to ChatGPT, waits for the response to resolve, and returns
     * the response.
     *
     * If you want to receive a stream of partial responses, use `opts.onProgress`.
     *
     * @param message - The prompt message to send
     * @param opts.conversationId - Optional ID of a conversation to continue
     * @param opts.parentMessageId - Optional ID of the previous message in the conversation
     * @param opts.messageId - Optional ID of the message to send (defaults to a random UUID)
     * @param opts.action - Optional ChatGPT `action` (either `next` or `variant`)
     * @param opts.timeoutMs - Optional timeout in milliseconds (defaults to no timeout)
     * @param opts.onProgress - Optional callback which will be invoked every time the partial response is updated
     * @param opts.abortSignal - Optional callback used to abort the underlying `fetch` call using an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
     *
     * @returns The response from ChatGPT, including `conversationId`, `messageId`, and
     * the `response` text.
     */
    abstract sendMessage(
        message: string,
        opts?: types.SendMessageOptions
    ): Promise<types.ChatResponse>;

    /**
     * @returns `true` if the client is authenticated with a valid session or `false`
     * otherwise.
     */
    abstract getIsAuthenticated(): Promise<boolean>;
}