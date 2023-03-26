import React, { useState } from "react";
import { setVerbosity } from "../actions/conversation";
import { useAppDispatch } from "../hooks";
import { Conversation, Verbosity } from "../types";
import Icon from "./Icon";

export default function VerbositySelect({
  vscode,
  currentConversation,
}: {
  vscode: any;
  currentConversation: Conversation;
}) {
  const dispatch = useAppDispatch();
  const [showOptions, setShowOptions] = useState(false);

  const getHumanFriendlyLabel = (verbosity: Verbosity) => {
    switch (verbosity) {
      case Verbosity.code:
        return "Code";
      case Verbosity.concise:
        return "Concise";
      case Verbosity.normal:
        return "Normal";
      case Verbosity.full:
        return "Detailed";
    }
  };

  const getHumanFriendlyDescription = (verbosity: Verbosity) => {
    switch (verbosity) {
      case Verbosity.code:
        return "Only replies with code";
      case Verbosity.concise:
        return "Explanations are concise";
      case Verbosity.normal:
        return "Normal explanations";
      case Verbosity.full:
        return "Detailed, full explanations";
    }
  };

  return (
    <>
      <div className="relative">
        <button
          className="rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap"
          onClick={() => {
            setShowOptions(!showOptions);
          }}
        >
          <Icon icon="chat" className="w-3 h-3 mr-1" />
          {getHumanFriendlyLabel(
            currentConversation?.verbosity ?? Verbosity.normal
          )}
        </button>
        <div
          className={`fixed bottom-8 -ml-11 border text-menu bg-menu border-menu shadow-xl text-xs rounded
          ${showOptions ? "block" : "hidden"}
        `}
        >
          {Object.values(Verbosity).map((option) => (
            <button
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              key={option}
              onClick={() => {
                dispatch(
                  setVerbosity({
                    conversationId: currentConversation.id,
                    verbosity: option,
                  })
                );

                // Update settings
                vscode.postMessage({
                  type: "setVerbosity",
                  value: option,
                });

                // Close the menu
                setShowOptions(false);
              }}
            >
              {getHumanFriendlyDescription(option)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
