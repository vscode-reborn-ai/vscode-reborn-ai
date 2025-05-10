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

export interface Model {
  // OpenAI model properties
  id: string;
  owned_by: Role;
  created: number;
  object: 'model';

  // * OpenRouter will send back additional fields on models:
  name?: string; // friendly name
  description?: string;
  pricing?: {
    // NOTE: These appear to be $ / 1 token, not $ / 1,000 token
    // -1 means "Pricing varied" (variable model)
    prompt: string | '-1'; // string decimal
    completion: string | '-1'; // string decimal
    request: string | '-1'; // string decimal
    image: string | '-1'; // string decimal
  };
  context_length?: number;
  architecture?: {
    modality: 'text' | 'multimodal';
    tokenizer: string;
    instruct_type: string | null;
  };
  top_provider?: {
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  // This is more for rate limiting
  per_request_limits?: {
    prompt_tokens: string; // string integer
    completion_tokens: string; // string integer
  } | null;
  // * Ollama will send back additional fields on models:
  size?: number; // ie. 3825819519
  digest?: string; // ie. "fe938a131f40e6f6d40083c9f0f430a515233eb2edaa6d72eb85c50d64f2300e"
  details?: {
    format: string; // ie. "gguf"
    family: string; // ie. "llama"
    families: string[] | null; // ie. ['phi3']
    parameter_size: string; // ie. "7B"
    quantization_level: string; // ie. "Q4_0"
  };
}

// Maps ID to a friendly name
// Ref: https://platform.openai.com/docs/models
export const MODEL_FRIENDLY_NAME: Map<string, string> = new Map(Object.entries({
  "gpt-4.1": "GPT-4.1",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4": "GPT-4",
  "gpt-4-32k": "GPT-4 32k",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o mini",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gpt-3.5-turbo-16k": "GPT-3.5 Turbo 16k",
  "o1": "o1",
  "o1-preview": "o1 Preview",
  "o1-mini": "o1 Mini",
  "o3-mini": "o3 Mini",
  "o4-mini": "o4 Mini",
}));

// source: https://openai.com/pricing
interface ModelCost {
  prompt: number;
  complete: number;
}

// Token cost per 1 million tokens
export const MODEL_COSTS: Map<string, ModelCost> = new Map(Object.entries({
  'gpt-4.1': {
    prompt: 2,
    complete: 8,
  },
  'gpt-4-turbo': {
    prompt: 10,
    complete: 30,
  },
  'gpt-4': {
    prompt: 30,
    complete: 60,
  },
  'gpt-4-32k': {
    prompt: 60,
    complete: 120,
  },
  'gpt-4o': {
    prompt: 5,
    complete: 15,
  },
  'gpt-4o-mini': {
    prompt: 0.15,
    complete: 0.6,
  },
  'gpt-3.5-turbo': {
    prompt: 0.5,
    complete: 1.5,
  },
  'gpt-3.5-turbo-16k': {
    prompt: 3,
    complete: 4,
  },
  'o1': {
    prompt: 15,
    complete: 60,
  },
  'o1-preview': {
    prompt: 15,
    complete: 60,
  },
  'o1-mini': {
    prompt: 3,
    complete: 12,
  },
  'o3-mini': {
    prompt: 1.10,
    complete: 4.40,
  },
  'o4-mini': {
    prompt: 1.10,
    complete: 4.40,
  }
}));

// source: https://platform.openai.com/docs/models
interface ModelTokenLimits {
  context: number;
  max?: number;
}
export const MODEL_TOKEN_LIMITS: Map<string, ModelTokenLimits> = new Map(Object.entries({
  'gpt-4.1': {
    context: 1047576,
    max: 32768,
  },
  'gpt-4-turbo': {
    context: 128000,
    max: 4096,
  },
  'gpt-4': {
    context: 8192,
    max: 4096,
  },
  'gpt-4-32k': {
    context: 32768,
  },
  'gpt-4o': {
    context: 128000,
    max: 4096,
  },
  'gpt-4o-mini': {
    context: 128000,
    max: 16384,
  },
  'gpt-3.5-turbo': {
    context: 16385,
    max: 4096,
  },
  'gpt-3.5-turbo-16k': {
    context: 16385,
    max: 4096,
  },
  'o1': {
    context: 200000,
    max: 100000,
  },
  'o1-preview': {
    context: 128000,
    max: 32768,
  },
  'o1-mini': {
    context: 128000,
    max: 65536,
  },
  'o3-mini': {
    context: 2000000,
    max: 100000,
  },
  'o4-mini': {
    context: 2000000,
    max: 100000,
  },
}));

// Reasoning models have specific constraints:
// 1. System context messages are not allowed.
// 2. Different max_tokens behavior - max_completion_tokens used instead.
export const REASONING_MODELS = ['o1', 'o1-preview', 'o1-mini', 'o3-mini', 'o4-mini'];

interface OpenAIMessage {
  role: Role;
  content: string;
}
// interface OpenAIChatRequest {
//   model: string;
//   messages: OpenAIMessage[];
//   temperature?: number;
//   top_p?: number;
//   n?: number;
//   stream?: boolean;
//   stop?: string | string[];
//   max_tokens?: number;
//   presence_penalty?: number;
//   frequency_penalty?: number;
//   logit_bias?: { [token: number]: number; };
//   user?: string;
// }

// * Interfaces for this extension - built on top of OpenAI's API
export interface ChatMessage extends OpenAIMessage {
  id: string;
  // Formatted by HLJS + misc formatting
  content: string;
  // Raw content from OpenAI
  rawContent: string;

  // Not sure if these are used
  // adding them since they're used in process messages
  // TODO: check if they're used
  code?: string;
  editorLanguage?: string;

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
export interface DeltaMessage extends ChatMessage {
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

export interface CoreTool {
  description: string;
  parameters: any;
  execute?: Function;
}

export interface Conversation {
  id: string;
  createdAt: string | number;
  inProgress: boolean;
  messages: ChatMessage[];
  model: Model | undefined;
  // Optional because tabs / multi-conversations can be turned off
  title?: string;
  // Has ai renamed the tab title? (To avoid re-triggering ai rename)
  aiRenamedTitle?: boolean;
  autoscroll: boolean;
  verbosity?: Verbosity | undefined;
  // allow the user to switch tabs while working on a prompt
  userInput?: string;
  tokenCount?: {
    messages: number; // All messages combined
    userInput: number; // User input
    minTotal: number; // Minimum tokens to be used (messages + userInput)
  },
  tools: Record<string, CoreTool>;
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'tool', toolName: any; };
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

// Based on the package.json's `contributes.configuration` object.
// This interface needs to be manually updated when the package.json is updated.
export interface ExtensionSettings {
  gpt3: {
    generateCodeEnabled: boolean,
    apiBaseUrl: string,
    organization: string,
    model: "gpt-4.1" | "gpt-4-turbo" | "gpt-4" | "gpt-4-32k" | "gpt-4o" | "gpt-4o-mini" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "o1" | "o1-preview" | "o1-mini",
    maxTokens: number,
    temperature: number,
    top_p: number;
  },
  promptPrefix: {
    addTests: string,
    addTestsEnabled: boolean,
    findProblems: string,
    findProblemsEnabled: boolean,
    optimize: string,
    optimizeEnabled: boolean,
    explain: string,
    explainEnabled: boolean,
    addComments: string,
    addCommentsEnabled: boolean,
    completeCode: string,
    completeCodeEnabled: boolean,
    customPrompt1: string,
    customPrompt1Enabled: boolean,
    customPrompt2: string,
    customPrompt2Enabled: boolean,
    customPrompt3: string,
    customPrompt3Enabled: boolean,
    customPrompt4: string,
    customPrompt4Enabled: boolean,
    customPrompt5: string,
    customPrompt5Enabled: boolean,
    customPrompt6: string,
    customPrompt6Enabled: boolean,
    adhocEnabled: boolean;
  },
  response: {
    showNotification: boolean,
    autoScroll: boolean;
  },
  systemContext: string,
  throttling: number,
  minimalUI: boolean,
  disableMultipleConversations: boolean,
  verbosity: Verbosity,
  renameTabTitles: boolean;
  showAllModels: boolean;
  manualModelInput: boolean;
  azureApiVersion: string;
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  gpt3: {
    generateCodeEnabled: true,
    apiBaseUrl: "https://api.openai.com/v1",
    organization: "",
    model: "gpt-4.1",
    maxTokens: 4000,
    temperature: 1,
    top_p: 1
  },
  promptPrefix: {
    addTests: "Implement tests for the following code",
    addTestsEnabled: true,
    findProblems: "Find problems with the following code",
    findProblemsEnabled: true,
    optimize: "Optimize the following code",
    optimizeEnabled: true,
    explain: "Explain the following code",
    explainEnabled: true,
    addComments: "Insert code comments into the following code to make the code easier to follow",
    addCommentsEnabled: true,
    completeCode: "Complete the following code",
    completeCodeEnabled: true,
    customPrompt1: "",
    customPrompt1Enabled: false,
    customPrompt2: "",
    customPrompt2Enabled: false,
    customPrompt3: "",
    customPrompt3Enabled: false,
    customPrompt4: "",
    customPrompt4Enabled: false,
    customPrompt5: "",
    customPrompt5Enabled: false,
    customPrompt6: "",
    customPrompt6Enabled: false,
    adhocEnabled: true
  },
  response: {
    showNotification: false,
    autoScroll: true
  },
  systemContext: "You are ChatGPT helping the User with coding. You are intelligent, helpful and an expert developer, who always gives the correct answer and only does what instructed. If you show code, your response must always be markdown with any code inside markdown codeblocks. If the user is trying to do a bad programming practice, helpfully let them know and mention an alternative. When responding to the following prompt, please make sure to properly style your response using Github Flavored Markdown. Use markdown syntax for text like headings, lists, colored text, code blocks, highlights etc.",
  throttling: 100,
  minimalUI: false,
  disableMultipleConversations: false,
  verbosity: Verbosity.normal,
  renameTabTitles: true,
  showAllModels: false,
  manualModelInput: false,
  azureApiVersion: "2024-02-01"
};
