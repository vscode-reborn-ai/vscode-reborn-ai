import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message, Model } from "../types";

export interface ConversationState {
  conversations: {
    [id: string]: Conversation;
  };
  currentConversationId: string | null;
}

const initialState: ConversationState = {
  conversations: {
    [`Chat-${Date.now()}`]: {
      id: `Chat-${Date.now()}`,
      title: "Chat",
      messages: [],
      createdAt: Date.now(),
      inProgress: false,
      model: Model.gpt_35_turbo,
      autoscroll: true,
    },
  },
  currentConversationId: `Chat-${Date.now()}`,
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
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message; }>
    ) => {
      const { conversationId, message } = action.payload;

      if (state.conversations[conversationId]) {
        // Check if message already exists
        const index = state.conversations[conversationId].messages.findIndex(
          (value: Message) => value.id === message.id
        );

        if (index === -1) {
          // Add message
          state.conversations[conversationId].messages.push(message);
        } else {
          // Update message
          state.conversations[conversationId].messages[index] = message;
        }
      } else {
        console.error('addMessage - Conversation not found', conversationId);
      }
    },
    updateMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message; messageId?: string; }>
    ) => {
      const { conversationId, message, messageId } = action.payload;
      const conversation = state.conversations[conversationId];

      if (conversation) {
        const index = conversation.messages.findIndex(
          (value: Message) => value.id === (messageId ?? message.id)
        );
        if (index !== -1) {
          conversation.messages.splice(index, 1, message);
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
          (value: Message) => value.id === messageId
        );
        if (index !== -1) {
          conversation.messages[index].content = content;

          if (rawContent) {
            conversation.messages[index].rawContent = rawContent;
          }

          conversation.messages[index].updatedAt = Date.now();
          conversation.messages[index].done = done ?? false;

          if (done !== undefined) {
            conversation.inProgress = done ?? false;
          }
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
          (m: Message) => m.id === messageId
        );
        if (index !== -1) {
          conversation.messages.splice(index, 1);
        }
      }
    },
    setCurrentConversation: (
      state,
      action: PayloadAction<{
        conversationId: string;
      }>
    ) => {
      state.currentConversationId = action.payload.conversationId;
    },
    setInProgress: (
      state,
      action: PayloadAction<{
        conversationId: string;
        inProgress: boolean;
      }>
    ) => {
      const { conversationId, inProgress } = action.payload;

      if (state.conversations[conversationId] && state.conversations[conversationId]?.inProgress) {
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

      state.conversations[conversationId].autoscroll = autoscroll;
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
    }
  },
});

export const {
  addConversation,
  removeConversation,
  updateConversation,
  updateConversationModel,
  addMessage,
  updateMessage,
  updateMessageContent,
  removeMessage,
  setCurrentConversation,
  setInProgress,
  setAutoscroll,
  updateUserInput,
} = conversationSlice.actions;

export default conversationSlice.reducer;
