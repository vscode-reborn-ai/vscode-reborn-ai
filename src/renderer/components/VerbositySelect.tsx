import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { setVerbosity } from "../store/conversation";
import { Conversation, Verbosity } from "../types";
import Icon from "./Icon";

export default function VerbositySelect({
  vscode,
  currentConversation,
  className,
  dropdownClassName,
  tooltipId,
  showParentMenu,
}: {
  vscode: any;
  currentConversation: Conversation;
  className?: string;
  dropdownClassName?: string;
  tooltipId?: string;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [showOptions, setShowOptions] = useState(false);
  const backendMessenger = useMessenger(vscode);

  const getHumanFriendlyLabel = (verbosity: Verbosity) => {
    switch (verbosity) {
      case Verbosity.code:
        return t?.verbosity?.codeLabel ?? "Code";
      case Verbosity.concise:
        return t?.verbosity?.conciseLabel ?? "Concise";
      case Verbosity.normal:
        return t?.verbosity?.normalLabel ?? "Normal";
      case Verbosity.full:
        return t?.verbosity?.fullLabel ?? "Detailed";
    }
  };

  const getHumanFriendlyDescription = (verbosity: Verbosity) => {
    switch (verbosity) {
      case Verbosity.code:
        return t?.verbosity?.codeDescription ?? "Only reply with code";
      case Verbosity.concise:
        return t?.verbosity?.conciseDescription ?? "Concise explanations";
      case Verbosity.normal:
        return t?.verbosity?.normalDescription ?? "Normal explanations";
      case Verbosity.full:
        return t?.verbosity?.fullDescription ?? "Detailed, full explanations";
    }
  };

  return (
    <>
      <div
        className={`${className}`}
        data-tooltip-id={tooltipId ?? "footer-tooltip"}
        data-tooltip-content={
          t?.verbosity?.parentTooltip ??
          "Change the verbosity of the AI's responses"
        }
      >
        <button
          className="rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap hover:text-button-secondary focus:text-button-secondary"
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
          className={`fixed border text-menu bg-menu border-menu shadow-xl text-xs rounded z-10
          ${showOptions ? "block" : "hidden"}
          ${dropdownClassName ? dropdownClassName : "mb-8 -ml-11"}
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
                backendMessenger.sendSetVerbosity(option);

                // Close the menu
                setShowOptions(false);

                // Close parent menu if it exists
                if (showParentMenu) {
                  showParentMenu(false);
                }
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
