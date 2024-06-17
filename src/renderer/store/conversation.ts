import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, Conversation, Model, Verbosity } from "../types";

export interface ConversationState {
  conversations: {
    [id: string]: Conversation;
  };
  currentConversationId: string | undefined;
  currentConversation: Conversation | undefined;
}

const initialConversationID = `Chat-${Date.now()}`;
const initialConversation: Conversation = {
  id: initialConversationID,
  title: "Chat",
  aiRenamedTitle: false,
  messages: [],
  createdAt: Date.now(),
  inProgress: false,
  model: undefined,
  autoscroll: true,
  verbosity: undefined,
};

const initialState: ConversationState = {
  conversations: {
    [initialConversationID]: initialConversation
  },
  currentConversationId: `Chat-${Date.now()}`,
  currentConversation: initialConversation,
};

export const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations[action.payload.id] = action.payload;
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      delete state.conversations[action.payload];
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const { id } = action.payload;
      if (state.conversations[id]) {
        state.conversations[id] = action.payload;

        if (id === state.currentConversationId) {
          state.currentConversation = action.payload;
        }
      }
    },
    updateConversationMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: ChatMessage[]; }>
    ) => {
      const { conversationId, messages } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages = messages;

        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = messages;
        }
      }
    },
    updateConversationModel: (
      state,
      action: PayloadAction<{ conversationId: string; model: Model; }>
    ) => {
      const { conversationId, model } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].model = model;
      }
    },
    updateConversationTitle: (
      state,
      action: PayloadAction<{ conversationId: string; title: string; }>
    ) => {
      const { conversationId, title } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].title = title;
      }
    },
    aiRenamedTitle: (
      state,
      action: PayloadAction<{ conversationId: string; aiRenamedTitle: boolean; }>
    ) => {
      const { conversationId, aiRenamedTitle } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].aiRenamedTitle = aiRenamedTitle;
      }
    },
    updateConversationTokenCount: (
      state,
      action: PayloadAction<{
        conversationId: string; tokenCount: {
          messages: number; // All messages combined
          userInput: number; // User input
          minTotal: number; // Minimum tokens to be used (messages + userInput)
        };
      }>
    ) => {
      const { conversationId, tokenCount } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].tokenCount = tokenCount;
      }
    },
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: ChatMessage; }>
    ) => {
      const { conversationId, message } = action.payload;

      if (state.conversations[conversationId]) {
        // Check if message already exists
        const index = state.conversations[conversationId].messages.findIndex(
          (value: ChatMessage) => value.id === message.id
        );

        if (index === -1) {
          // Add message
          state.conversations[conversationId].messages.push(message);
        } else {
          // Update message
          state.conversations[conversationId].messages[index] = message;
        }

        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = state.conversations[conversationId].messages;
        }
      } else {
        console.error('[Reborn AI] addMessage - Conversation not found', conversationId);
      }
    },
    updateMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: ChatMessage; messageId?: string; }>
    ) => {
      const { conversationId, message, messageId } = action.payload;
      const conversation = state.conversations[conversationId];

      if (conversation) {
        const index = conversation.messages.findIndex(
          (value: ChatMessage) => value.id === (messageId ?? message.id)
        );
        if (index !== -1) {
          conversation.messages.splice(index, 1, message);
        }

        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = conversation.messages;
        }
      }
    },
    updateMessageContent: (
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: string;
        content: string;
        rawContent?: string;
        done?: boolean;
      }>
    ) => {
      const { conversationId, messageId, content, rawContent, done } = action.payload;
      const conversation = state.conversations[conversationId];

      if (conversation) {
        const index = conversation.messages.findIndex(
          (value: ChatMessage) => value.id === messageId
        );
        if (index !== -1) {
          conversation.messages[index].content = content;

          if (rawContent) {
            conversation.messages[index].rawContent = rawContent;
          }

          conversation.messages[index].updatedAt = Date.now();
          conversation.messages[index].done = done ?? false;

          if (done !== undefined) {
            conversation.inProgress = !done ?? false;
          }

          if (conversationId === state.currentConversationId && state.currentConversation) {
            state.currentConversation.messages = conversation.messages;
          }
        }
      }
    },
    clearMessages: (state, action: PayloadAction<{
      conversationId: string;
    }>) => {
      const { conversationId } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages = [];

        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = [];
        }
      }
    },
    removeMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: string;
      }>
    ) => {
      const { conversationId, messageId } = action.payload;
      const conversation = state.conversations[conversationId];
      if (conversation) {
        const index = conversation.messages.findIndex(
          (m: ChatMessage) => m.id === messageId
        );
        if (index !== -1) {
          conversation.messages.splice(index, 1);

          if (conversationId === state.currentConversationId && state.currentConversation) {
            state.currentConversation.messages = conversation.messages;
          }
        }
      }
    },
    setCurrentConversationId: (
      state,
      action: PayloadAction<{
        conversationId: string;
      }>
    ) => {
      state.currentConversationId = action.payload.conversationId;
      state.currentConversation = state.conversations[action.payload.conversationId];
    },
    setInProgress: (
      state,
      action: PayloadAction<{
        conversationId: string;
        inProgress: boolean;
      }>
    ) => {
      const { conversationId, inProgress } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].inProgress = inProgress;
      }
    },
    setAutoscroll: (
      state,
      action: PayloadAction<{
        conversationId: string;
        autoscroll: boolean;
      }>
    ) => {
      const { conversationId, autoscroll } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].autoscroll = autoscroll;
      }
    },
    setVerbosity: (
      state,
      action: PayloadAction<{
        conversationId: string;
        verbosity: Verbosity;
      }>
    ) => {
      const { conversationId, verbosity } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].verbosity = verbosity;
      }
    },
    setModel: (
      state,
      action: PayloadAction<{
        conversationId: string;
        model: Model;
      }>
    ) => {
      const { conversationId, model } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].model = model;
      }
    },
    updateUserInput: (
      state,
      action: PayloadAction<{
        conversationId: string;
        userInput: string;
      }>
    ) => {
      const { conversationId, userInput } = action.payload;

      state.conversations[conversationId].userInput = userInput;

      if (conversationId === state.currentConversationId && state.currentConversation) {
        state.currentConversation.userInput = userInput;
      }
    },
  },
});

export const {
  addConversation,
  removeConversation,
  updateConversation,
  updateConversationMessages,
  updateConversationModel,
  updateConversationTitle,
  aiRenamedTitle,
  updateConversationTokenCount,
  addMessage,
  updateMessage,
  updateMessageContent,
  clearMessages,
  removeMessage,
  setCurrentConversationId,
  setInProgress,
  setAutoscroll,
  setVerbosity,
  setModel,
  updateUserInput,
} = conversationSlice.actions;

export default conversationSlice.reducer;
