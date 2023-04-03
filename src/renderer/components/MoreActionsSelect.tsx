import React, { useState } from "react";
import { Conversation } from "../types";
import Icon from "./Icon";

export default function MoreActionsSelect({
  currentConversation,
  vscode,
}: {
  currentConversation: Conversation;
  vscode: any;
}) {
  const [showMoreActions, setShowMoreActions] = useState(false);

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
