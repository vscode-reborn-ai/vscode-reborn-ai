import React, { useRef, useState } from "react";
import { useOnClickOutside } from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { setReasoningEffort } from "../store/conversation";
import { Conversation, ReasoningEffort } from "../types";
import Icon from "./Icon";

interface ReasoningEffortSelectProps {
  vscode: any;
  currentConversation: Conversation;
  className?: string;
  dropdownClassName?: string;
  tooltipId?: string;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ReasoningEffortSelect({
  vscode,
  currentConversation,
  className,
  dropdownClassName,
  tooltipId,
  showParentMenu,
}: ReasoningEffortSelectProps) {
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const settings = useAppSelector((state: RootState) => state.app.extensionSettings);
  const [showOptions, setShowOptions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useOnClickOutside(dropdownRef, () => setShowOptions(false), buttonRef);

  const backendMessenger = useMessenger(vscode);

  const getLabel = (effort: ReasoningEffort) => {
    switch (effort) {
      case ReasoningEffort.Low:
        return t?.reasoningEffort?.lowLabel ?? "Low";
      case ReasoningEffort.Medium:
        return t?.reasoningEffort?.mediumLabel ?? "Medium";
      case ReasoningEffort.High:
        return t?.reasoningEffort?.highLabel ?? "High";
    }
  };

  const getDescription = (effort: ReasoningEffort) => {
    switch (effort) {
      case ReasoningEffort.Low:
        return (
          t?.reasoningEffort?.lowDescription ??
          "Fast and cheap, but spends the least time reasoning"
        );
      case ReasoningEffort.Medium:
        return (
          t?.reasoningEffort?.mediumDescription ??
          "Balanced speed and reasoning quality"
        );
      case ReasoningEffort.High:
        return (
          t?.reasoningEffort?.highDescription ??
          "Best reasoning quality, but slow and expensive"
        );
    }
  };

  const currentEffort =
    currentConversation.reasoningEffort ??
    settings?.reasoningEffort ??
    ReasoningEffort.Medium;

  return (
    <div
      ref={dropdownRef}
      className={className}
      data-tooltip-id={tooltipId ?? "footer-tooltip"}
      data-tooltip-content={
        t?.reasoningEffort?.parentTooltip ??
        "Adjust the reasoning effort (quality vs. cost)"
      }
    >
      <button
        ref={buttonRef}
        className="rounded py-0.5 px-1 flex items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap"
        onClick={() => setShowOptions((prev) => !prev)}
      >
        <Icon icon="cpu" className="w-3 h-3 mr-1" />
        {getLabel(currentEffort)}
      </button>

      <div
        className={[
          "fixed border text-menu bg-menu border-menu shadow-xl text-xs rounded z-10",
          showOptions ? "block" : "hidden",
          dropdownClassName ?? "mb-8 -ml-11",
        ].join(" ")}
      >
        <div className="px-2 py-1 border-b text-xs font-semibold">
          {t?.reasoningEffort?.title ?? "Reasoning Effort"}
        </div>
        {Object.values(ReasoningEffort).map((option) => (
          <button
            key={option}
            className="flex gap-2 items-center p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              // 1) update Redux
              dispatch(
                setReasoningEffort({
                  conversationId: currentConversation.id,
                  reasoningEffort: option,
                })
              );

              // 2) send to backend
              backendMessenger.sendSetReasoningEffort(option);

              // 3) close menus
              setShowOptions(false);
              showParentMenu?.(false);
            }}
          >
            <div className="flex flex-col items-start gap-0.5">
              <header className="font-bold">
                {getLabel(option)}
              </header>
              {getDescription(option)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
