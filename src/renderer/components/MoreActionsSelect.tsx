import React, { useState } from "react";
import Icon from "./Icon";

export default function MoreActionsSelect({
  postMessage,
}: {
  postMessage: (type: string, value?: any, language?: string) => void;
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

      postMessage("openNew", markdown, "markdown");
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
      >
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          id="clear-button"
          onClick={() => {
            postMessage("clearConversation");
          }}
        >
          <Icon icon="plus" className="w-4 h-4 mr-2" />
          New chat
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          id="list-conversations-button"
        >
          <Icon icon="chat" className="w-4 h-4 mr-2" />
          Show conversations
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("openSettings");
          }}
        >
          <Icon icon="cog" className="w-4 h-4 mr-2" />
          Update settings
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          id="export-button"
        >
          <Icon icon="download" className="w-4 h-4 mr-2" />
          Export to markdown
        </button>
      </div>
    </>
  );
}
