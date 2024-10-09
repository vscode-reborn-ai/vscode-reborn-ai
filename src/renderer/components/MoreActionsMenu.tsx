import { AdjustmentsHorizontalIcon } from "@heroicons/react/16/solid";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { setDebug } from "../store/app";
import { Conversation } from "../types";
import Icon from "./Icon";
import ModelSelect from "./ModelSelect";
import VerbositySelect from "./VerbositySelect";
import ViewOptions from "./ViewOptions";

export default function MoreActionsMenu({
  currentConversation,
  conversationList,
  vscode,
  showMoreActions,
  setShowMoreActions,
  className,
}: {
  currentConversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
  showMoreActions: boolean;
  setShowMoreActions: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const navigate = useNavigate();
  const backendMessenger = useMessenger(vscode);
  const [showViewOptions, setShowViewOptions] = useState(false);

  // When the show more actions menu is shown, hide the view options menu
  // So, if the user leaves the view options menu open on close, it won't be shown on open
  useEffect(() => {
    if (showMoreActions) {
      setShowViewOptions(false);
    }
  }, [showMoreActions]);

  return (
    <>
      <div
        id="more-actions-menu"
        className={classNames(
          "MoreActionsMenu",
          "fixed z-20 right-4 p-2 bg-menu rounded border border-menu overflow-hidden max-w-[calc(100vw-2em)]",
          className,
          {
            hidden: !showMoreActions,
          }
        )}
      >
        <ul className="flex flex-col gap-1">
          <li>
            <a
              className="flex gap-1 items-center py-0.5 px-1 whitespace-nowrap hover:underline focus-within:underline"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content="Report a bug or suggest a feature in GitHub"
              href="https://github.com/vscode-reborn-ai/vscode-reborn-ai/issues/new/choose"
              target="_blank"
            >
              <Icon icon="help" className="w-3 h-3" />
              {t?.questionInputField?.feedback ?? "Feedback"}
            </a>
          </li>
          <li>
            <Link
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              to="/api"
              onClick={(e) => {
                // if the local API tab is already open, close it
                if (location.pathname === "/api") {
                  e.preventDefault();
                  navigate(`/chat/${encodeURI(currentConversation.id)}`);
                }

                // close menu
                setShowMoreActions(false);
              }}
              data-tooltip-id="local-api-tooltip"
              data-tooltip-content="Open the local API tab"
            >
              <Icon icon="box" className="w-3 h-3" />
              {t?.questionInputField?.localAPI ?? "Change LLM"}
            </Link>
          </li>
          <li>
            <Link
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              to="/actions"
              onClick={(e) => {
                // if the actions tab is already open, close it
                if (location.pathname === "/actions") {
                  e.preventDefault();
                  navigate(`/chat/${encodeURI(currentConversation.id)}`);
                }
              }}
            >
              <Icon icon="zap" className="w-3 h-3" />
              Actions
            </Link>
          </li>
          {process.env.NODE_ENV === "development" && (
            <li>
              <button
                className={classNames(
                  "DebugButton",
                  "rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full",
                  debug
                    ? "bg-red-900 text-white"
                    : "hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
                )}
                data-tooltip-id="more-actions-tooltip"
                data-tooltip-content="Toggle debug mode"
                onClick={() => {
                  dispatch(setDebug(!debug));
                }}
              >
                <Icon icon="box" className="w-3 h-3" />
                {t?.questionInputField?.debug ?? "Debug"}
              </button>
            </li>
          )}
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              onClick={() => {
                backendMessenger.sendOpenSettings();

                // close menu
                setShowMoreActions(false);
              }}
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content="Open extension settings"
            >
              <Icon icon="cog" className="w-3 h-3" />
              {t?.questionInputField?.settings ?? "Settings"}
            </button>
          </li>
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content="Export the conversation to a markdown file"
              onClick={() => {
                backendMessenger.sendExportToMarkdown(currentConversation);

                // close menu
                setShowMoreActions(false);
              }}
            >
              <Icon icon="download" className="w-3 h-3" />
              {t?.questionInputField?.markdown ?? "Markdown"}
            </button>
          </li>
          {/*
          The more actions menu is starting to get cluttered.
          "Reset API key" is redundant when the "LLM Settings" page exists.
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full whitespace-nowrap hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content="Reset your OpenAI API key."
              onClick={() => {
                backendMessenger.sendResetApiKey();

                // close menu
                setShowMoreActions(false);

                // navigate to the /api tab
                navigate("/api");
              }}
            >
              <Icon icon="cancel" className="w-3 h-3" />
              {t?.questionInputField?.resetAPIKey ?? "Reset API Key"}
            </button>
          </li> */}
          {/* View */}
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              onClick={() => {
                setShowViewOptions(!showViewOptions);
              }}
            >
              <AdjustmentsHorizontalIcon className="w-3 h-3" />
              View
              {showViewOptions && (
                <ViewOptions className="fixed right-32 bottom-7" />
              )}
            </button>
          </li>
          <li className="block xs:hidden">
            <ModelSelect
              currentConversation={currentConversation}
              vscode={vscode}
              conversationList={conversationList}
              dropdownClassName="right-32 bottom-8 max-w-[calc(100vw-9rem)] z-20"
              tooltipId="more-actions-tooltip"
              showParentMenu={setShowMoreActions}
            />
          </li>
          <li className="block xs:hidden">
            <VerbositySelect
              currentConversation={currentConversation}
              vscode={vscode}
              dropdownClassName="right-32 bottom-8 max-w-[calc(100vw-9rem)] z-20"
              tooltipId="more-actions-tooltip"
              showParentMenu={setShowMoreActions}
            />
          </li>
        </ul>
      </div>
      <Tooltip
        id="more-actions-tooltip"
        className="z-10"
        place="left"
        delayShow={800}
      />
    </>
  );
}
