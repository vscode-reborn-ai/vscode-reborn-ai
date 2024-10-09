import classNames from "classnames";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { isInstructModel, useMaxCost } from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { setUseEditorSelection } from "../store/app";
import {
  clearMessages,
  setAutoscroll,
  setInProgress,
  updateUserInput,
} from "../store/conversation";
import { Conversation, MODEL_TOKEN_LIMITS } from "../types";
import Icon from "./Icon";
import ModelInput from "./ModelInput";
import ModelSelect from "./ModelSelect";
import MoreActionsMenu from "./MoreActionsMenu";
import TokenCountPopup from "./TokenCountPopup";
import VerbositySelect from "./VerbositySelect";

export default ({
  conversation: currentConversation,
  conversationList,
  vscode,
}: {
  conversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
}) => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const t = useAppSelector((state: any) => state.app.translations);
  const questionInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [useEditorSelection, setIncludeEditorSelection] = useState(false);
  const [showTokenBreakdown, setShowTokenBreakdown] = useState(false);
  const tokenCountRef = React.useRef<HTMLDivElement>(null);
  const [tokenCountLabel, setTokenCountLabel] = useState("0");
  const maxCost = useMaxCost(currentConversation);
  // Animation on token count value change
  const [tokenCountAnimation, setTokenCountAnimation] = useState(false);
  const tokenCountAnimationTimer = useRef(null);
  const backendMessenger = useMessenger(vscode);
  const models = useAppSelector((state: RootState) => state.app.models);
  // View options
  const showEditorSelection = useAppSelector(
    (state) => state.app.viewOptions.showEditorSelection
  );
  const showModelSelect = useAppSelector(
    (state) => state.app.viewOptions.showModelSelect
  );
  const showVerbosity = useAppSelector(
    (state) => state.app.viewOptions.showVerbosity
  );
  const showClear = useAppSelector((state) => state.app.viewOptions.showClear);
  const showTokenCount = useAppSelector(
    (state) => state.app.viewOptions.showTokenCount
  );

  // Check if the current model is in the model list
  // When APIs are changed, the current model might not be available
  const isCurrentModelAvailable = useMemo(() => {
    return (
      settings.manualModelInput ||
      models.length === 0 ||
      models.some((model) => model.id === currentConversation.model?.id)
    );
  }, [models, currentConversation.model]);

  // when includeEditorSelection changes, update the store (needed for token calculations elsewhere), one-way binding for now
  useEffect(() => {
    dispatch(setUseEditorSelection(useEditorSelection));
  }, [useEditorSelection]);

  useEffect(() => {
    // Clear the previous timer if there is one
    if (tokenCountAnimationTimer.current) {
      clearTimeout(tokenCountAnimationTimer.current);
    }

    // Set the animation to true
    setTokenCountAnimation(true);

    // Start a new timer
    tokenCountAnimationTimer.current = setTimeout(() => {
      setTokenCountAnimation(false);
    }, 500) as any;

    return () => clearTimeout(tokenCountAnimationTimer.current as any); // Cleanup on unmount
  }, [tokenCountLabel]);

  // on conversation change, focus on the question input, set the question input value to the user input
  useEffect(() => {
    if (questionInputRef.current && conversationList.length > 1) {
      questionInputRef.current.focus();
      questionInputRef.current.value = currentConversation?.userInput ?? "";
    }
  }, [currentConversation.id]);

  const askQuestion = () => {
    if (!isCurrentModelAvailable) {
      console.error("[Reborn AI] Model not available. Select a model first.");
      return;
    }

    const question = questionInputRef?.current?.value;

    if (question && question.length > 0) {
      // Set the conversation to in progress
      dispatch(
        setInProgress({
          conversationId: currentConversation.id,
          inProgress: true,
        })
      );

      backendMessenger.sendAddFreeTextQuestion({
        conversation: currentConversation,
        question: questionInputRef.current.value,
        includeEditorSelection: useEditorSelection,
      });

      questionInputRef.current.value = "";
      questionInputRef.current.rows = 1;

      // update the state
      dispatch(
        updateUserInput({
          conversationId: currentConversation.id,
          userInput: "",
        })
      );

      // re-enable autoscroll to send the user to the bottom of the conversation
      dispatch(
        setAutoscroll({
          conversationId: currentConversation.id,
          autoscroll: true,
        })
      );

      // If includeEditorSelection is enabled, disable it after the question is asked
      if (useEditorSelection) {
        setIncludeEditorSelection(false);
      }

      // reset the textarea height
      if (questionInputRef?.current?.parentNode) {
        (
          questionInputRef.current.parentNode as HTMLElement
        ).dataset.replicatedValue = "";
      }
    }
  };

  return (
    <footer
      className={`fixed z-20 bottom-0 w-full flex flex-col gap-y-1 pt-2 bg-gradient-to-t from-bg from-50% to-transparent
      ${settings?.minimalUI ? "pb-2" : "pb-1"}
    `}
    >
      <div className="px-4 flex items-center gap-x-2">
        <div className="bg flex-1 textarea-wrapper w-full flex items-center">
          {currentConversation.inProgress && (
            // show the text "Thinking..." when the conversation is in progress in place of the question input
            <div className="flex flex-row items-center text-sm px-3 py-2 mb-1 rounded border bg-input text-input w-full">
              <Icon
                icon="ripples"
                className="w-5 h-5 mr-2 text stroke-current"
              />
              <span>{t?.questionInputField?.thinking ?? "Thinking..."}</span>
              {isInstructModel(currentConversation.model) && (
                <span className="text-xs opacity-50 ml-2">
                  {t?.questionInputField?.streamingOnInstructModels ??
                    "(streaming is disabled on instruct models)"}
                </span>
              )}
            </div>
          )}
          {!currentConversation.inProgress && (
            <textarea
              rows={1}
              className="text-sm rounded-sm border border-input text-input bg-input resize-none w-full outline-0"
              id="question-input"
              placeholder="Ask a question..."
              ref={questionInputRef}
              disabled={currentConversation.inProgress}
              onInput={(e) => {
                const target = e.target as any;
                if (target) {
                  target.parentNode.dataset.replicatedValue = target?.value;
                }
              }}
              onKeyDown={(event: any) => {
                // avoid awkward newline before submitting question
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.isComposing
                ) {
                  event.preventDefault();
                }
              }}
              onKeyUp={(event: any) => {
                const question = questionInputRef?.current?.value;

                // update the state
                dispatch(
                  updateUserInput({
                    conversationId: currentConversation.id,
                    userInput: question ?? "",
                  })
                );

                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.isComposing
                ) {
                  askQuestion();
                } else if (
                  event.key === "Enter" &&
                  event.shiftKey &&
                  !event.isComposing
                ) {
                  // update the textarea height
                  const target = event.target as any;
                  if (target) {
                    target.parentNode.dataset.replicatedValue = target?.value;
                  }
                }
              }}
            ></textarea>
          )}
        </div>

        <div className="bg" id="question-input-buttons">
          {currentConversation.inProgress && (
            // show the "stop" button when the conversation is in progress
            <button
              title="Stop"
              className="px-2 py-1 h-full flex flex-row items-center border border-red-900 rounded hover:bg-button-secondary focus:bg-button-secondary"
              onClick={(e) => {
                backendMessenger.sendStopGenerating(currentConversation.id);

                // Set the conversation to not in progress
                dispatch(
                  setInProgress({
                    conversationId: currentConversation.id,
                    inProgress: false,
                  })
                );
              }}
            >
              <Icon icon="cancel" className="w-3 h-3 mr-1" />
              {t?.questionInputField?.stop ?? "Stop"}
            </button>
          )}
          {!currentConversation.inProgress && (
            <button
              title="Submit prompt"
              className={classNames(
                "ask-button rounded px-4 py-2 flex flex-row items-center text-button bg-button hover:bg-button-hover focus:bg-button-hover",
                {
                  "opacity-50 cursor-not-allowed": !isCurrentModelAvailable,
                }
              )}
              onClick={() => {
                askQuestion();
              }}
              disabled={
                currentConversation.inProgress || !isCurrentModelAvailable
              }
            >
              {isCurrentModelAvailable
                ? t?.questionInputField?.ask ?? "Ask"
                : "Select a model first"}
              <Icon icon="send" className="w-5 h-5 ml-1 hidden 2xs:block" />
            </button>
          )}
        </div>
      </div>
      {!settings?.minimalUI && (
        <div className="flex flex-wrap xs:flex-nowrap flex-row justify-between gap-x-1 px-4 overflow-x-auto">
          <div className="flex-grow flex flex-nowrap xs:flex-wrap flex-row gap-1">
            {showModelSelect && (
              <>
                {settings.manualModelInput ? (
                  <ModelInput
                    currentConversation={currentConversation}
                    vscode={vscode}
                    className="hidden xs:flex items-end"
                    tooltipId="footer-tooltip"
                  />
                ) : (
                  <ModelSelect
                    currentConversation={currentConversation}
                    vscode={vscode}
                    conversationList={conversationList}
                    className="hidden xs:flex items-end"
                    tooltipId="footer-tooltip"
                  />
                )}
              </>
            )}
            {showVerbosity && (
              <VerbositySelect
                currentConversation={currentConversation}
                vscode={vscode}
                className="hidden xs:flex items-end"
                tooltipId="footer-tooltip"
              />
            )}
            {showEditorSelection && (
              <button
                className={`rounded flex gap-1 items-center justify-start py-0.5 px-1 whitespace-nowrap
                ${
                  useEditorSelection
                    ? "bg-button text-button hover:bg-button-hover focus:bg-button-hover"
                    : "hover:bg-button-secondary hover:text-button-secondary focus:text-button-secondary focus:bg-button-secondary"
                }
              `}
                data-tooltip-id="footer-tooltip"
                data-tooltip-content="Include the code selected in your editor in the prompt?"
                onMouseDown={(e) => {
                  // Prevent flashing from textarea briefly losing focus
                  e.preventDefault();
                }}
                onClick={() => {
                  // focus the textarea
                  questionInputRef?.current?.focus();

                  setIncludeEditorSelection(!useEditorSelection);
                }}
              >
                <Icon icon="plus" className="w-3 h-3 hidden 2xs:block" />
                <span className="hidden 2xs:block">
                  {t?.questionInputField?.useEditorSelection ??
                    "Editor selection"}
                </span>
                <span className="block 2xs:hidden">
                  {t?.questionInputField?.useEditorSelectionShort ?? "Editor"}
                </span>
              </button>
            )}
            {showClear && (
              <button
                className={`rounded flex gap-1 items-center justify-start py-0.5 px-1 hover:bg-button-secondary hover:text-button-secondary focus:text-button-secondary focus:bg-button-secondary`}
                data-tooltip-id="footer-tooltip"
                data-tooltip-content="Clear all messages from conversation"
                onClick={() => {
                  // clear all messages from the current conversation
                  dispatch(
                    clearMessages({
                      conversationId: currentConversation.id,
                    })
                  );
                }}
              >
                <Icon icon="cancel" className="w-3 h-3 hidden 2xs:block" />
                {t?.questionInputField?.clear ?? "Clear"}
              </button>
            )}
            <Tooltip id="footer-tooltip" place="top" delayShow={800} />
          </div>
          <div className="flex flex-row items-start gap-2">
            {showTokenCount && (
              <div
                className={`rounded flex gap-1 items-end justify-start py-1 px-2 w-full text-[10px] whitespace-nowrap hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary transition-bg  ${
                  tokenCountAnimation
                    ? "duration-200 bg-blue-300 bg-opacity-20"
                    : "duration-500"
                }
                ${
                  parseInt(tokenCountLabel) >
                  (MODEL_TOKEN_LIMITS.has(
                    currentConversation.model?.id ?? "gpt-4-turbo"
                  )
                    ? MODEL_TOKEN_LIMITS.get(
                        currentConversation.model?.id ?? "gpt-4-turbo"
                      )?.context ?? 128000
                    : 128000)
                    ? "duration-200 bg-red-700 bg-opacity-20"
                    : ""
                }
              `}
                ref={tokenCountRef}
                tabIndex={0}
                // on hover showTokenBreakdown
                onMouseEnter={() => {
                  setShowTokenBreakdown(true);
                }}
                onMouseLeave={() => {
                  setShowTokenBreakdown(false);
                }}
                onFocus={() => {
                  setShowTokenBreakdown(true);
                }}
                onBlur={() => {
                  setShowTokenBreakdown(false);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Escape") {
                    setShowTokenBreakdown(false);
                  } else if (e.key === "Space") {
                    setShowTokenBreakdown(!showTokenBreakdown);
                  }
                }}
              >
                {"≤ $"}
                {maxCost?.toFixed(2) ?? "???"}
                <TokenCountPopup
                  showTokenBreakdown={showTokenBreakdown}
                  currentConversation={currentConversation}
                  conversationList={conversationList}
                  setTokenCountLabel={setTokenCountLabel}
                  vscode={vscode}
                />
              </div>
            )}
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full whitespace-nowrap hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              onClick={() => {
                setShowMoreActions(!showMoreActions);
              }}
              onKeyUp={(e) => {
                if (e.key === "Escape") {
                  setShowMoreActions(false);
                } else if (e.key === "ArrowDown") {
                  setShowMoreActions(true);
                  // Focus the first element in the more actions menu
                  const firstElem = document.querySelector(
                    "#more-actions-menu ul li"
                  ) as HTMLElement;
                  if (firstElem) {
                    firstElem.focus();
                  }
                } else if (e.key === "ArrowUp") {
                  setShowMoreActions(true);
                  // Focus the last element in the more actions menu
                  const lastElem = document.querySelector(
                    "#more-actions-menu ul li:last-child"
                  ) as HTMLElement;
                  if (lastElem) {
                    lastElem.focus();
                  }
                } else if (e.key === "Space") {
                  setShowMoreActions(!showMoreActions);
                }
              }}
            >
              <Icon icon="zap" className="w-3.5 h-3.5 hidden 2xs:block" />
              {t?.questionInputField?.moreActions ?? "More Actions"}
            </button>
          </div>
          <div className="flex items-end self-start">
            <MoreActionsMenu
              vscode={vscode}
              showMoreActions={showMoreActions}
              currentConversation={currentConversation}
              setShowMoreActions={setShowMoreActions}
              conversationList={conversationList}
            />
          </div>
        </div>
      )}
    </footer>
  );
};
