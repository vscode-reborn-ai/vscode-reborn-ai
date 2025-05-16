import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { WebviewApi } from "vscode-webview";
import { useAppDispatch } from "./hooks";
import { useMessenger } from "./send-to-backend";
import { aiRenamedTitle } from "./store/conversation";
import {
  ActionNames,
  ChatMessage,
  Conversation,
  ExtensionSettings,
  MODEL_COSTS,
  MODEL_FRIENDLY_NAME,
  MODEL_TOKEN_LIMITS,
  Model,
  REASONING_MODELS,
  Role,
} from "./types";

export const unEscapeHTML = (unsafe: string): string => {
  return unsafe
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
};

// Shallow compare two objects
export function isSameObject(obj1: any, obj2: any) {
  for (let key in obj1) {
    if (obj1[key] !== obj2[key]) {
      return false; // Difference found
    }
  }
  for (let key in obj2) {
    if (obj1[key] !== obj2[key]) {
      return false; // Difference found
    }
  }
  return true; // No differences found
}

export const updateChatMessage = (
  updatedMessage: ChatMessage,
  currentConversationId: string,
  setConversationList: React.Dispatch<React.SetStateAction<Conversation[]>>
) => {
  setConversationList((prev: Conversation[]) =>
    prev.map((conversation: Conversation) => {
      if (conversation.id === currentConversationId) {
        // Find index of message to update
        const index = conversation.messages.findIndex(
          (message: ChatMessage) => message.id === updatedMessage.id
        );

        if (index !== -1) {
          // Update message in conversation
          const messages = [
            ...conversation.messages.slice(0, index),
            updatedMessage,
            ...conversation.messages.slice(index + 1),
          ];

          // Create new conversation object with updated message
          return {
            ...conversation,
            messages,
          };
        }
      }

      return conversation;
    })
  );
};

export const addChatMessage = (
  newMessage: ChatMessage,
  currentConversationId: string,
  setConversationList: React.Dispatch<React.SetStateAction<Conversation[]>>
) => {
  setConversationList((prev: Conversation[]) =>
    prev.map((conversation: Conversation) =>
      conversation.id === currentConversationId
        ? {
            ...conversation,
            // Add message to conversation; filter is here to prevent duplicate messages
            messages: [...conversation.messages, newMessage].filter(
              (message: ChatMessage, index: number, self: ChatMessage[]) =>
                index ===
                self.findIndex((m: ChatMessage) => m.id === message.id)
            ),
          }
        : conversation
    )
  );
};

export const useDebounce = (
  callback: (...args: any[]) => void,
  delay: number
) => {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  let timer: NodeJS.Timeout;

  const naiveDebounce = (
    func: (...args: any[]) => void,
    delayMs: number,
    ...args: any[]
  ) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      func(...args);
    }, delayMs);
  };

  return useMemo(
    () =>
      (...args: any) =>
        naiveDebounce(callbackRef.current, delay, ...args),
    [delay]
  );
};

// Hook - Rename the tab title with AI
export function useRenameTabTitleWithAI(
  backendMessenger: any,
  settings: ExtensionSettings
) {
  const dispatch = useAppDispatch();

  return useCallback(
    (conversation: Conversation, firstAssistantMessage?: string) => {
      if (
        conversation &&
        // Has the AI already renamed the title?
        !conversation?.aiRenamedTitle
      ) {
        dispatch(
          aiRenamedTitle({
            conversationId: conversation.id,
            aiRenamedTitle: true,
          })
        );

        const firstUserMessage =
          conversation.messages.find(
            (message: ChatMessage) => message.role === Role.user
          )?.content ?? "";

        if (!firstAssistantMessage) {
          firstAssistantMessage =
            conversation.messages.find(
              (message: ChatMessage) => message.role === Role.assistant
            )?.content ?? "";
        }
        // Use ChatGPT to rename the tab title
        if (
          settings.renameTabTitles &&
          !settings.minimalUI &&
          !settings.disableMultipleConversations
        ) {
          backendMessenger.sendRunAction(ActionNames.createConversationTitle, {
            messageText: `
            Question: ${firstUserMessage.substring(0, 200)}...
            Answer: ${firstAssistantMessage.substring(0, 200)}...
          `,
            conversationId: conversation.id,
          });
        }
      }
    },
    [settings]
  );
}

// Returns a friendly name for a specific model (does not use models array or settings fallback)
export function getModelFriendlyNameFromModel(
  model: Model | undefined,
  shortVersion: boolean = false
) {
  let friendlyName: string;
  let usingModelId = false;

  if (model?.name) {
    friendlyName = model.name;
  } else if (MODEL_FRIENDLY_NAME.has(model?.id ?? "")) {
    friendlyName = MODEL_FRIENDLY_NAME.get(model?.id ?? "") ?? "";
  } else if (model?.id) {
    friendlyName = model.id;
    usingModelId = true;
  } else {
    friendlyName = "No model selected";
  }

  if (usingModelId) {
    if (friendlyName.includes("/")) {
      friendlyName = friendlyName.split("/")[1];
    }
    if (friendlyName.includes(":")) {
      friendlyName = friendlyName.split(":")[0];
    }
  } else if (shortVersion) {
    if (friendlyName.includes(":")) {
      friendlyName = friendlyName.split(":")[1];
    }
    if (friendlyName.includes(" (")) {
      friendlyName = friendlyName.split(" (")[0];
    }
  }

  return friendlyName.trim();
}

// Returns a friendly name for the model used in a conversation, with fallback logic using models/settings
export function getModelFriendlyName(
  conversation: Conversation,
  models: Model[],
  settings: ExtensionSettings,
  shortVersion: boolean = false
) {
  let model = conversation.model;
  if (!model) {
    // Try to find the model from settings.gpt3.model in the models array
    model = models.find((m) => m.id === settings?.gpt3?.model);
    if (!model && settings?.gpt3?.model) {
      // If not found, create a minimal model object with just the id
      model = { id: settings.gpt3.model } as Model;
    }
  }
  return getModelFriendlyNameFromModel(model, shortVersion);
}

// Hook version for model
export function useModelFriendlyNameFromModel(
  model: Model | undefined,
  shortVersion: boolean = false
) {
  return getModelFriendlyNameFromModel(model, shortVersion);
}

// Hook version for conversation
export function useModelFriendlyName(
  conversation: Conversation,
  models: Model[],
  settings: ExtensionSettings,
  shortVersion: boolean = false
) {
  return getModelFriendlyName(conversation, models, settings, shortVersion);
}

// Model token limit for context (input)
export function getModelContextLimit(model: Model | undefined) {
  let limit = 128000;

  if (!model) {
    return limit;
  }

  // For OpenRouter models, check if the model has context token limits
  if (model.context_length) {
    limit = model.context_length ?? 128000;
  } else {
    // Fallback to hardcoded limits
    limit = MODEL_TOKEN_LIMITS.has(model.id)
      ? MODEL_TOKEN_LIMITS.get(model.id)?.context ?? 128000
      : 128000;
  }

  return limit;
}

// Model token limit for completions (output)
export function getModelCompletionLimit(model: Model | undefined) {
  let limit = 4096;

  if (!model) {
    return limit;
  }

  // For OpenRouter models, check if the model has completion token limits
  if (model?.top_provider?.max_completion_tokens) {
    limit = model.top_provider.max_completion_tokens;
  } else {
    // Fallback to hardcoded limits
    limit = MODEL_TOKEN_LIMITS.has(model.id)
      ? MODEL_TOKEN_LIMITS.get(model.id)?.max ?? 4096
      : 4096;
  }

  return limit;
}

interface ModelCosts {
  prompt: number | undefined;
  complete: number | undefined;
}

export function getModelRates(model: Model | undefined): ModelCosts {
  const costs: ModelCosts = {
    prompt: undefined,
    complete: undefined,
  };

  if (!model) {
    return costs;
  }

  // For OpenRouter models, check if the model has cost data with it
  if (model.pricing) {
    // Mutiply by 1,000,000 to convert from $ / 1 token to $ / 1 million tokens
    costs.prompt = parseFloat(model.pricing.prompt) * 1000000;
    costs.complete = parseFloat(model.pricing.completion) * 1000000;
    // If cost is < 0, set to undefined
    // -1 means "Pricing varied" (variable model)
    if (costs.prompt < 0) {
      costs.prompt = undefined;
    }
    if (costs.complete < 0) {
      costs.complete = undefined;
    }
  } else {
    // Fallback to hardcoded costs
    costs.prompt = MODEL_COSTS.has(model.id)
      ? MODEL_COSTS.get(model.id)?.prompt ?? undefined
      : undefined;
    costs.complete = MODEL_COSTS.has(model.id)
      ? MODEL_COSTS.get(model.id)?.complete ?? undefined
      : undefined;
  }

  return costs;
}

export function isInstructModel(model: Model | undefined) {
  return model?.architecture?.instruct_type || model?.id.includes("instruct");
}

// Can this model stream back its responses?
export function isStreamingModel(model: Model | undefined) {
  const isInstruct = isInstructModel(model);
  const isSearchPreview = ["gpt-4o-search", "gpt-4o-search-preview"].includes(
    model?.id ?? ""
  );

  return !isInstruct && !isSearchPreview;
}

export function isMultimodalModel(model: Model | undefined) {
  return model?.architecture?.modality === "multimodal";
}

export function isOnlineModel(model: Model | undefined) {
  return model?.id.includes("online");
}

export function isReasoningModel(model: Model | undefined) {
  return REASONING_MODELS.includes(model?.id ?? "");
}

// Custom hook useIsCurrentModelAvailable
export function useIsModelAvailable(
  models: Array<{ id: string }>,
  model: Model | undefined
): boolean {
  return useMemo(() => {
    const modelsAreEmpty = models.length === 0;
    const currentConversationModel = model?.id;

    if (modelsAreEmpty) {
      return false;
    }

    if (!currentConversationModel) {
      return true;
    }

    return models.some((model) => model.id === currentConversationModel);
  }, [models, model]);
}

export function useConvertMarkdownToComponent(
  vscode: WebviewApi<unknown> | undefined
) {
  const backendMessenger = useMessenger(vscode);

  const renderLink = (href: string, children: React.ReactNode) => {
    const baseUrl = "https://openrouter.ai";
    const baseUrlNoSlash = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const adjustedHref = href.startsWith("/") ? baseUrlNoSlash + href : href;
    let domain = new URL(adjustedHref).hostname;
    // only get the highest level domain
    domain = domain.split(".").slice(-2).join(".");

    const handleClick = (
      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
      event.preventDefault();

      backendMessenger.sendOpenExternalUrl(adjustedHref);
    };

    return (
      <a
        href={adjustedHref}
        title={`Open ${domain} in the browser.`}
        target="_blank"
        onClick={handleClick}
      >
        {children}
      </a>
    );
  };

  const markdownToComponent = useCallback(
    (markdown: string) => {
      return (
        <ReactMarkdown
          components={{
            a: ({
              href,
              children,
            }: {
              href?: string;
              children?: React.ReactNode;
            }) => renderLink(href ?? "", children),
          }}
        >
          {markdown}
        </ReactMarkdown>
      );
    },
    [vscode]
  );

  return markdownToComponent;
}

// Hook - Get the max cost of a conversation
export function useMaxCost(conversation: Conversation) {
  const [maxCost, setMaxCost] = useState<number | undefined>(undefined);

  useEffect(() => {
    const minPromptTokens =
      (conversation.tokenCount?.messages ?? 0) +
      (conversation.tokenCount?.userInput ?? 0);
    const modelContextLimit = getModelContextLimit(conversation.model);
    const modelMax = getModelCompletionLimit(conversation.model);
    const maxCompleteTokens = Math.min(
      modelContextLimit - minPromptTokens,
      modelMax ?? Infinity
    );
    const rates = getModelRates(conversation.model);

    if (rates.prompt !== undefined && rates.complete !== undefined) {
      const minCost = (minPromptTokens / 1000000) * rates.prompt;
      setMaxCost(minCost + (maxCompleteTokens / 1000000) * rates.complete);
    } else {
      setMaxCost(undefined);
    }
  }, [conversation.tokenCount, conversation.model]);

  return maxCost;
}

export function useFormatInteger() {
  const formatInteger = useCallback((num: number | undefined) => {
    if (num === undefined) {
      return "varies";
    }

    return num.toLocaleString();
  }, []);

  return formatInteger;
}

export function useFormatSize() {
  const formatSize = useCallback((bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
      return "0 B";
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  }, []);

  return formatSize;
}
