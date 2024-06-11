// Convenience functions for the renderer code

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useAppDispatch } from "./hooks";
import { aiRenamedTitle } from "./store/conversation";
import { ActionNames, ChatMessage, Conversation, ExtensionSettings, Role } from "./types";

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
