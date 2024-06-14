// Convenience functions for the renderer code

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useAppDispatch } from "./hooks";
import { aiRenamedTitle } from "./store/conversation";
import { ActionNames, ChatMessage, Conversation, ExtensionSettings, MODEL_COSTS, MODEL_TOKEN_LIMITS, Model, Role } from "./types";

export const unEscapeHTML = (unsafe: any) => {
  return unsafe
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#039;", "'");
};

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
              index === self.findIndex((m: ChatMessage) => m.id === message.id)
          ),
        }
        : conversation
    )
  );
};


export const useDebounce =
  (callback: (...args: any[]) => void,
    delay: number) => {

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

    return useMemo(() => (...args: any) =>
      naiveDebounce(callbackRef.current, delay,
        ...args), [delay]);
  };


// Hook - Rename the tab title with AI
export function useRenameTabTitleWithAI(
  backendMessenger: any,
  settings: ExtensionSettings,
) {
  const dispatch = useAppDispatch();

  return useCallback((
    conversation: Conversation,
    firstAssistantMessage?: string
  ) => {
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
  }, [settings]);
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
    // Mutiply by 1,000 to convert from $ / 1 token to $ / 1,000 tokens
    costs.prompt = parseFloat(model.pricing.prompt) * 1000;
    costs.complete = parseFloat(model.pricing.completion) * 1000;
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

export function isMultimodalModel(model: Model | undefined) {
  return model?.architecture?.modality === "multimodal";
}

export function isOnlineModel(model: Model | undefined) {
  return model?.id.includes("online");
}
