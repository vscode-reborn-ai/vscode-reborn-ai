import React, { useState } from "react";
import { Conversation } from "../renderer-types";
import Icon from "./Icon";

export default function MoreActionsSelect({
  vscode,
  currentConversation,
}: {
  vscode: any;
  currentConversation: Conversation;
}) {
  const [showMoreActions, setShowMoreActions] = useState(false);

  const exportConversation = () => {
    if ((window as any).turndownService) {
      const turndownService = new (window as any).turndownService({
        codeBlockStyle: "fenced",
      });
      turndownService.remove("no-export");
      let markdown = turndownService.turndown(
        document.getElementById("qa-list")
      );

      vscode.postMessage({
        type: "openNew",
        value: markdown,
        language: "markdown",
        conversationId: currentConversation.id,
      });
    }
  };

  return (
    <>
      <button
        title="More actions"
        className="rounded-lg p-0.5"
        onClick={() => {
          setShowMoreActions(!showMoreActions);
        }}
      >
        <Icon icon="more" className="w-5 h-5" />
      </button>

      <div
        className={`absolute bottom-14 items-center more-menu right-8 border text-menu bg-menu border-menu shadow-xl text-xs
            ${showMoreActions ? "block" : "hidden"}
          `}
      ></div>
    </>
  );
}
