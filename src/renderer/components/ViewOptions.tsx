import classNames from "classnames";
import React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { toggleViewOption } from "../store/app";
import { ViewOptionsState } from "../store/types";
import Icon from "./Icon";

interface ViewOptionsToggleProps {
  className?: string;
}

const currentViewOptions: {
  label: string;
  key: keyof ViewOptionsState;
}[] = [
  { label: "Hide Name", key: "hideName" },
  { label: "Code Only", key: "showCodeOnly" },
  { label: "Show Markdown", key: "showMarkdown" },
  { label: "Align Right", key: "alignRight" },
  // Not yet implemented
  // { label: "Compact UI", key: "showCompact" },
  // Not yet implemented
  // { label: "Network Logs", key: "showNetworkLogs" },
  { label: "Show Model Name", key: "showModelName" },
];

const userUIOptions: {
  label: string;
  key: keyof ViewOptionsState;
}[] = [
  { label: "Model Select Button", key: "showModelSelect" },
  { label: "Verbosity Button", key: "showVerbosity" },
  { label: "Editor Selection", key: "showEditorSelection" },
  { label: "Clear Button", key: "showClear" },
  { label: "Token Count", key: "showTokenCount" },
];

export default function ViewOptionsToggle({
  className,
}: ViewOptionsToggleProps) {
  const dispatch = useAppDispatch();
  const viewOptionStates = useAppSelector((state) => state.app.viewOptions);

  return (
    <div
      className={classNames(
        "ViewOptionsToggle",
        "z-20 p-2 bg-menu rounded border border-menu",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <header>
        <p className="mb-1 text-xs text-gray-500">Modify the chat UI.</p>
      </header>
      <div className="flex gap-4">
        <ul className="flex-1 flex flex-col gap-1">
          {currentViewOptions.map((option) => (
            <li key={option.key}>
              <button
                className="w-full flex gap-1 items-center py-0.5 px-1 whitespace-nowrap rounded hover:bg-button-secondary focus:bg-button-secondary focus:underline hover:text-button-secondary focus:text-button-secondary"
                onClick={() => dispatch(toggleViewOption(option.key))}
              >
                <Icon
                  icon={viewOptionStates[option.key] ? "check" : "close"}
                  className="w-3 h-3"
                />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
        <ul className="flex-1 flex flex-col gap-1">
          {userUIOptions.map((option) => (
            <li key={option.key}>
              <button
                className="w-full flex gap-1 items-center py-0.5 px-1 whitespace-nowrap rounded hover:bg-button-secondary focus:bg-button-secondary focus:underline hover:text-button-secondary focus:text-button-secondary"
                onClick={() => dispatch(toggleViewOption(option.key))}
              >
                <Icon
                  icon={viewOptionStates[option.key] ? "check" : "close"}
                  className="w-3 h-3"
                />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
