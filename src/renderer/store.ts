import { configureStore } from '@reduxjs/toolkit';
import ActionReducer from './store/action';
import AppReducer from './store/app';
import ConversationReducer from './store/conversation';

export const store = configureStore({
  reducer: {
    conversation: ConversationReducer,
    app: AppReducer,
    action: ActionReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
