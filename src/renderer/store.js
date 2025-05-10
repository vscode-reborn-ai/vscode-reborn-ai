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
//# sourceMappingURL=store.js.map