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

export type Conversation = {
    id: string;
    createdAt: string | number;
    inProgress: boolean;
    messages: Message[];
    model: Model;
    title?: string;
};

export type Message = {
    id: string;
    content: string;
    role: Role;
    isError?: boolean;
    createdAt: string | number;
    updatedAt?: string | number;
    done?: boolean | null;
};

export type SendMessageOptions = {
    conversation: Conversation;
    parentMessageId?: string;
    messageId?: string;
    timeoutMs?: number;
    model?: Model;
    abortSignal: AbortSignal;
    onProgress?: (partialResponse: ChatResponse) => void;
};

export class ChatGPTError extends Error {
    statusCode?: number;
    statusText?: string;
    response?: Response;
    reason?: string;
    originalError?: Error;
}

export type ChatResponse = {
    response: string;
    conversationId: string;
    messageId: string;
    origMessageId: string;
};
