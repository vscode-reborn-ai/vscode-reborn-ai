// Convenience functions for the renderer code

import { Conversation, Message } from "../types";

export const unEscapeHTML = (unsafe: any) => {
    return unsafe
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#039;", "'");
};

export const updateMessage = (message: Message, conversation: Conversation, setConversationList: any) => {
    setConversationList((prev: any[]) =>
        prev.map((c: { id: any; messages: any[]; }) =>
            c.id === conversation.id
                ? {
                    ...c,
                    messages: c.messages.map((m: { id: string | undefined; }) =>
                        m.id === message.id ? message : m
                    ),
                }
                : c
        )
    );
};

export const addMessage = (message: Message, conversation: Conversation, setConversationList: any) => {
    const messageExists = conversation.messages.find(
        (m) => m.id === message.id
    );

    if (messageExists) {
        updateMessage(message, conversation, setConversationList);
    } else {
        setConversationList((prev: any[]) =>
            prev.map((c: { id: string; messages: any; }) =>
                c.id === conversation.id
                    ? {
                        ...c,
                        messages: [...c.messages, message],
                    }
                    : c
            )
        );
    }
};
