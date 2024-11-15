import React from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";

export default function DebugConversation({
  conversationId,
}: {
  conversationId: string;
}) {
  const conversation = useAppSelector(
    (state: RootState) => state.conversation.conversations[conversationId]
  );

  return (
    <div className="text-gray-500 text-[10px] font-mono">
      Conversation ID: {conversation?.id}
      <br />
      Conversation Title: {conversation?.title}
      <br />
      Conversation Datetime:{" "}
      {new Date(conversation?.createdAt ?? "").toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
      <br />
      Conversation Model: {conversation.model?.id}
      <br />
      Conversation inProgress: {conversation?.inProgress ? "true" : "false"}
    </div>
  );
}
