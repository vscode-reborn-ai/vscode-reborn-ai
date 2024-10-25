import { AdjustmentsHorizontalIcon } from "@heroicons/react/16/solid";
import classNames from "classnames";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { setDebug } from "../store/app";
import {
  selectCurrentConversation,
  selectCurrentConversationId,
} from "../store/conversation";
import Icon from "./Icon";
import VerbositySelect from "./VerbositySelect";
import ViewOptions from "./ViewOptions";

export default React.memo(function MoreActionsMenu({
  vscode,
  showMoreActions,
  setShowMoreActions,
  className,
}: {
  vscode: any;
  showMoreActions: boolean;
  setShowMoreActions: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const currentConversation = useSelector(selectCurrentConversation);
  const conversationId = useSelector(selectCurrentConversationId);
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

  const changeLLMClickHandler = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // if the local API tab is already open, close it
      if (location.pathname === "/api") {
        e.preventDefault();
        navigate(`/chat/${encodeURI(conversationId ?? "")}`);
      }

      // close menu
      setShowMoreActions(false);
    },
    [conversationId, navigate, setShowMoreActions]
  );

  const actionsClickHandler = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // if the actions tab is already open, close it
      if (location.pathname === "/actions") {
        e.preventDefault();
        navigate(`/chat/${encodeURI(conversationId ?? "")}`);
      }
    },
    [conversationId, navigate]
  );

  const debugClickHandler = useCallback(() => {
    dispatch(setDebug(!debug));
  }, [debug, dispatch]);

  const settingsClickHandler = useCallback(() => {
    backendMessenger.sendOpenSettings();

    // close menu
    setShowMoreActions(false);
  }, [backendMessenger, setShowMoreActions]);

  const markdownExportClickHandler = useCallback(() => {
    if (!currentConversation) {
      console.error("No current conversation to export.");
      return;
    }

    backendMessenger.sendExportToMarkdown(currentConversation);

    // close menu
    setShowMoreActions(false);
  }, [backendMessenger, conversationId, setShowMoreActions]);

  const toggleViewOptions = useCallback(() => {
    setShowViewOptions(!showViewOptions);
  }, [showViewOptions]);

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
              onClick={changeLLMClickHandler}
              data-tooltip-id="local-api-tooltip"
              data-tooltip-content="Open the local API tab"
            >
              <Icon icon="box" className="w-3 h-3" />
              {t?.questionInputField?.changeLLM ?? "Change LLM"}
            </Link>
          </li>
          <li>
            <Link
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              to="/actions"
              onClick={actionsClickHandler}
            >
              <Icon icon="zap" className="w-3 h-3" />
              {t?.questionInputField?.actions ?? "Actions"}
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
                onClick={debugClickHandler}
              >
                <Icon icon="box" className="w-3 h-3" />
                {t?.questionInputField?.debug ?? "Debug"}
              </button>
            </li>
          )}
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              onClick={settingsClickHandler}
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
              onClick={markdownExportClickHandler}
            >
              <Icon icon="download" className="w-3 h-3" />
              {t?.questionInputField?.markdown ?? "Markdown"}
            </button>
          </li>
          {/* View */}
          <li>
            <button className="group w-full" onClick={toggleViewOptions}>
              <span className="w-full py-0.5 px-1 rounded flex gap-1 items-center justify-start group-hover:bg-button-secondary group-focus:bg-button-secondary group-hover:text-button-secondary group-focus:text-button-secondary">
                <AdjustmentsHorizontalIcon className="w-3 h-3" />
                {t?.questionInputField?.view ?? "View"}
              </span>
              {showViewOptions && (
                <ViewOptions className="fixed right-32 bottom-7" />
              )}
            </button>
          </li>
          <li className="block xs:hidden">
            {/* TODO: ADD BACK IN, REMOVED FOR DEBUG REASONS */}
            {/* <ModelSelect
              vscode={vscode}
              dropdownClassName="right-32 bottom-8 max-w-[calc(100vw-9rem)] z-20"
              tooltipId="more-actions-tooltip"
              setShowParentMenu={setShowMoreActions}
              renderModelList={showMoreActions}
            /> */}
          </li>
          <li className="block xs:hidden">
            <VerbositySelect
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
});
