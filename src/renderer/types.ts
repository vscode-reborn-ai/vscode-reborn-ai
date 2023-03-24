// * Interfaces for OpenAI's API
// For network requests - based on OpenAI API docs - https://platform.openai.com/docs/api-reference/
interface OpenAIPromptRequest {
    model: string;
    prompt?: string | string[] | number[] | number[][];
    suffix?: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    logprobs?: number;
    echo?: boolean;
    stop?: string | string[];
    presence_penalty?: number;
    frequency_penalty?: number;
    best_of?: number;
    logit_bias?: { [token: number]: number; };
    user?: string;
}
export enum Role {
    user = 'user',
    assistant = 'assistant',
    system = 'system'
}

export enum Model {
    gpt_4 = "gpt-4",
    gpt_4_32k = "gpt-4-32k",
    gpt_35_turbo = "gpt-3.5-turbo",
    gpt_35_turbo_0301 = "gpt-3.5-turbo-0301",
    text_davinci_003 = "text-davinci-003",
    text_curie_001 = "text-curie-001",
    text_babbage_001 = "text-babbage-001",
    text_ada_001 = "text-ada-001",
    code_davinci_002 = "code-davinci-002",
    code_cushman_001 = "code-cushman-001"
}

interface OpenAIMessage {
    role: Role;
    content: string;
}
interface OpenAIChatRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: { [token: number]: number; };
    user?: string;
}

// * Interfaces for this extension - built on top of OpenAI's API
export interface Message extends OpenAIMessage {
    id: string;
    content: string;
    role: Role;
    isError?: boolean;
    createdAt: string | number;
    updatedAt?: string | number;
    // For continuing conversations
    parentMessageId?: string;
    // For streaming responses
    done?: boolean | null;
}
export interface DeltaMessage extends Message {
    delta?: string;
    cancel?: Function;
    detail?: any;
}

export interface Conversation {
    id: string;
    createdAt: string | number;
    inProgress: boolean;
    messages: Message[];
    model: Model;
    title?: string;
    autoscroll: boolean;
    // allow the user to switch tabs while working on a prompt
    userInput?: string;
}


export interface SendMessageOptions {
    conversation: Conversation;
    parentMessageId?: string;
    messageId?: string;
    timeoutMs?: number;
    model?: Model;
    abortSignal: AbortSignal;
    onProgress?: (partialResponse: ChatResponse) => void;
}

export class ChatGPTError extends Error {
    statusCode?: number;
    statusText?: string;
    response?: Response;
    reason?: string;
    originalError?: Error;
}

export interface ChatResponse {
    response: string;
    conversationId: string;
    messageId: string;
    origMessageId: string;
}