// * Interfaces for OpenAI's API
// For network requests - based on OpenAI API docs - https://platform.openai.com/docs/api-reference/
// TODO: just import directly from openai types
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
  // ChatGPT
  gpt_4_turbo = "gpt-4-turbo",
  gpt_4 = "gpt-4",
  gpt_4_32k = "gpt-4-32k",
  gpt_4o = "gpt-4o",
  gpt_35_turbo = "gpt-3.5-turbo",
  gpt_35_turbo_16k = "gpt-3.5-turbo-16k",
  // Prompt completion models - Not yet supported in this extension
  babbage_002 = "babbage-002",
  davinci_002 = "davinci-002",
}

export const MODEL_FRIENDLY_NAME = {
  [Model.gpt_4_turbo]: "GPT-4 Turbo",
  [Model.gpt_4]: "GPT-4",
  [Model.gpt_4_32k]: "GPT-4 32k",
  [Model.gpt_4o]: "GPT-4o",
  [Model.gpt_35_turbo]: "GPT-3.5 Turbo",
  [Model.gpt_35_turbo_16k]: "GPT-3.5 Turbo 16k",
  [Model.babbage_002]: "Babbage 002",
  [Model.davinci_002]: "Davinci 002",
};

// source: https://openai.com/pricing
export const MODEL_COSTS = {
  [Model.gpt_4_turbo]: {
    prompt: 0.01,
    complete: 0.03,
  },
  [Model.gpt_4]: {
    prompt: 0.03,
    complete: 0.06,
  },
  [Model.gpt_4_32k]: {
    prompt: 0.06,
    complete: 0.12,
  },
  [Model.gpt_4o]: {
    prompt: 0.005,
    complete: 0.015,
  },
  [Model.gpt_35_turbo]: {
    prompt: 0.0015,
    complete: 0.002,
  },
  [Model.gpt_35_turbo_16k]: {
    prompt: 0.003,
    complete: 0.004,
  },
  [Model.babbage_002]: {
    prompt: 0.0004,
    complete: 0.0004,
  },
  [Model.davinci_002]: {
    prompt: 0.002,
    complete: 0.002,
  },
} as {
  [model: string]: {
    prompt: number;
    complete: number;
  };
};

// source: https://platform.openai.com/docs/models
export const MODEL_TOKEN_LIMITS = {
  [Model.gpt_4_turbo]: {
    context: 128000,
    max: 4096,
  },
  [Model.gpt_4]: {
    context: 8192,
    max: 4096,
  },
  [Model.gpt_4_32k]: {
    context: 32768,
  },
  [Model.gpt_4o]: {
    context: 128000,
    max: 4096,
  },
  // TODO: Dec 11, 2023 gpt-35-turbo prompt will become 16385 (but complete will remain 4096)
  [Model.gpt_35_turbo]: {
    context: 4096,
  },
  [Model.gpt_35_turbo_16k]: {
    context: 16385,
    max: 4096,
  },
  [Model.babbage_002]: {
    context: 16384,
  },
  [Model.davinci_002]: {
    context: 16384,
  }
} as {
  [model: string]: {
    context: number;
    max?: number;
  };
};

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
  // Formatted by HLJS + misc formatting
  content: string;
  // Raw content from OpenAI
  rawContent: string;
  role: Role;
  isError?: boolean;
  createdAt: string | number;
  updatedAt?: string | number;
  // If this is a user message that uses code selected from the editor
  questionCode?: string;
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

export enum Verbosity {
  code = "code",
  concise = "concise",
  normal = "normal",
  full = "full"
}

export interface Conversation {
  id: string;
  createdAt: string | number;
  inProgress: boolean;
  messages: Message[];
  model: Model | undefined;
  title?: string;
  autoscroll: boolean;
  verbosity?: Verbosity | undefined;
  // allow the user to switch tabs while working on a prompt
  userInput?: string;
  tokenCount?: {
    messages: number; // All messages combined
    userInput: number; // User input
    minTotal: number; // Minimum tokens to be used (messages + userInput)
  },
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

export enum ActionNames {
  createReadmeFromPackageJson = "createReadmeFromPackageJson",
  createReadmeFromFileStructure = "createReadmeFromFileStructure",
  createGitignore = "createGitignore",
  createConversationTitle = "createConversationTitle",
}
