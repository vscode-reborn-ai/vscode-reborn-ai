import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import { setDebug } from "../actions/app";
import {
  setAutoscroll,
  setInProgress,
  updateUserInput,
} from "../actions/conversation";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Conversation, Role } from "../types";
import Icon from "./Icon";
import ModelSelect from "./ModelSelect";
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
  const debug = useAppSelector((state: any) => state.app.debug);
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const questionInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [includeEditorSelection, setIncludeEditorSelection] = useState(false);

  // on conversation change, focus on the question input, set the questoin input value to the user input
  React.useEffect(() => {
    if (questionInputRef.current) {
      questionInputRef.current.focus();
      questionInputRef.current.value = currentConversation?.userInput ?? "";
    }
  }, [currentConversation]);

  const askQuestion = () => {
    const question = questionInputRef?.current?.value;

    if (question && question.length > 0) {
      vscode.postMessage({
        type: "addFreeTextQuestion",
        value: questionInputRef.current.value,
        conversation: currentConversation,
        conversationId: currentConversation.id,
        lastBotMessageId:
          currentConversation.messages.find((m) => m.role === Role.assistant)
            ?.id ?? "",
        includeEditorSelection,
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
      if (includeEditorSelection) {
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
      className={`fixed bottom-0 w-full flex flex-col gap-y-1 pt-2 bg
      ${settings?.minimalUI ? "pb-2" : "pb-1"}
    `}
    >
      <div className="px-4 flex items-center">
        <div className="flex-1 textarea-wrapper">
          {currentConversation.inProgress && (
            // show the text "Thinking..." when the conversation is in progress in place of the question input
            <div className="flex flex-row items-center text-sm px-3 py-2 mb-1 rounded border text-input w-[calc(100%-6rem)]">
              <Icon icon="ripples" className="w-5 h-5 mr-2" />
              <span>Thinking...</span>
            </div>
          )}
          {!currentConversation.inProgress && (
            <textarea
              rows={1}
              className="text-sm rounded border border-input text-input bg-input resize-none w-[calc(100%-6rem)] outline-0"
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

        <div
          id="question-input-buttons"
          className="right-6 absolute -mt-[6px] ml-5"
        >
          {currentConversation.inProgress && (
            // show the "stop" button when the conversation is in progress
            <button
              title="Stop"
              className="px-2 py-1 flex flex-row items-center border border-red-900 rounded hover:bg-button-secondary focus:bg-button-secondary"
              onClick={(e) => {
                vscode.postMessage({
                  type: "stopGenerating",
                  conversationId: currentConversation.id,
                });

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
              Stop
            </button>
          )}
          {!currentConversation.inProgress && (
            <button
              title="Submit prompt"
              className="ask-button rounded px-4 py-2 flex flex-row items-center bg-button hover:bg-button-hover focus:bg-button-hover"
              onClick={() => {
                askQuestion();
              }}
            >
              Ask
              <Icon icon="send" className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
      {!settings?.minimalUI && (
        <div className="flex flex-row justify-between gap-2 px-4 overflow-x-auto">
          <div className="flex flex-row gap-2">
            <ModelSelect
              currentConversation={currentConversation}
              vscode={vscode}
              conversationList={conversationList}
              className="hidden xs:block"
            />
            <VerbositySelect
              currentConversation={currentConversation}
              vscode={vscode}
              className="hidden xs:block"
            />
            {/* include editor selection toggle */}
            <button
              className={`rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full
                ${
                  includeEditorSelection
                    ? "bg-button text-button"
                    : "text-button-secondary button-secondary hover:bg-button-secondary focus:bg-button-secondary"
                }
              `}
              data-tooltip-id="footer-tooltip"
              data-tooltip-content="Include the code selected in your editor in the prompt?"
              onClick={() => {
                setIncludeEditorSelection(!includeEditorSelection);
              }}
            >
              <Icon icon="plus" className="w-3 h-3" />
              Use editor selection
            </button>
            <Tooltip id="footer-tooltip" place="top" delayShow={800} />
          </div>
          {/* floating menu */}
          <div
            className={`fixed bottom-8 right-4 p-2 bg-menu rounded border border-menu ${
              showMoreActions ? "" : "hidden"
            }`}
          >
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  className={`flex gap-1 items-center py-0.5 px-1 whitespace-nowrap hover:underline focus-within:underline`}
                  data-tooltip-id="more-actions-tooltip"
                  data-tooltip-content="Report a bug or suggest a feature in GitHub"
                  href="https://github.com/Christopher-Hayes/vscode-chatgpt-reborn/issues/new/choose"
                  target="_blank"
                >
                  <Icon icon="help" className="w-3 h-3" />
                  Feedback
                </a>
              </li>
              {process.env.NODE_ENV === "development" && (
                <li>
                  <button
                    className={`rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full
                ${
                  debug
                    ? "bg-red-900 text-white"
                    : "hover:bg-button-secondary focus:bg-button-secondary"
                }
              `}
                    data-tooltip-id="more-actions-tooltip"
                    data-tooltip-content="Toggle debug mode"
                    onClick={() => {
                      dispatch(setDebug(!debug));
                    }}
                  >
                    <Icon icon="box" className="w-3 h-3" />
                    Debug
                  </button>
                </li>
              )}
              <li>
                <button
                  className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary"
                  onClick={() => {
                    vscode.postMessage({
                      type: "openSettings",
                      conversationId: currentConversation.id,
                    });
                  }}
                  data-tooltip-id="more-actions-tooltip"
                  data-tooltip-content="Open extension settings"
                >
                  <Icon icon="cog" className="w-3 h-3" />
                  Settings
                </button>
              </li>
              <li>
                <button
                  className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary"
                  data-tooltip-id="more-actions-tooltip"
                  data-tooltip-content="Export the conversation to a markdown file"
                  onClick={() => {
                    vscode.postMessage({
                      type: "exportToMarkdown",
                      conversationId: currentConversation.id,
                      conversation: currentConversation,
                    });
                  }}
                >
                  <Icon icon="download" className="w-3 h-3" />
                  Export
                </button>
              </li>
              <li>
                <button
                  className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full whitespace-nowrap hover:bg-button-secondary focus:bg-button-secondary"
                  data-tooltip-id="more-actions-tooltip"
                  data-tooltip-content="Reset your OpenAI API key"
                  onClick={() => {
                    vscode.postMessage({
                      type: "resetApiKey",
                    });
                  }}
                >
                  <Icon icon="cancel" className="w-3 h-3" />
                  Reset API Key
                </button>
              </li>
              <li className="block xs:hidden">
                <ModelSelect
                  currentConversation={currentConversation}
                  vscode={vscode}
                  conversationList={conversationList}
                  dropdownClassName="-right-[1px] w-[calc(100vw-2rem)] bottom-8"
                />
              </li>
              <li className="block xs:hidden">
                <VerbositySelect
                  currentConversation={currentConversation}
                  vscode={vscode}
                  dropdownClassName="-right-[1px] w-[calc(100vw-2rem)] bottom-8"
                />
              </li>
            </ul>
            <Tooltip id="more-actions-tooltip" place="left" delayShow={800} />
          </div>
          <div className="flex flex-row gap-2">
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full whitespace-nowrap hover:bg-button-secondary focus:bg-button-secondary"
              onClick={() => {
                setShowMoreActions(!showMoreActions);
              }}
            >
              <Icon icon="zap" className="w-3.5 h-3.5" />
              More Actions
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
