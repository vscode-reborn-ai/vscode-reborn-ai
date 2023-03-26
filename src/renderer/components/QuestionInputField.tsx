import React from "react";
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
  const questionInputRef = React.useRef<HTMLTextAreaElement>(null);

  // on conversation change, focus on the question input, set the questoin input value to the user input
  React.useEffect(() => {
    if (questionInputRef.current) {
      questionInputRef.current.focus();
      questionInputRef.current.value = currentConversation?.userInput ?? "";
    }
  }, [currentConversation]);

  return (
    <footer className="fixed bottom-0 w-full flex flex-col gap-y-1 pt-2 bg">
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
                  if (question && question.length > 0) {
                    vscode.postMessage({
                      type: "addFreeTextQuestion",
                      value: questionInputRef.current.value,
                      conversation: currentConversation,
                      conversationId: currentConversation.id,
                      lastBotMessageId:
                        currentConversation.messages.find(
                          (m) => m.role === Role.assistant
                        )?.id ?? "",
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

                    // reset the textarea height
                    const target = event.target as any;
                    if (target) {
                      target.parentNode.dataset.replicatedValue = "";
                    }
                  } else {
                    console.warn("Ask - No target or target value");
                  }
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
              onClick={(e) => {
                const question = questionInputRef?.current?.value;

                if (question && question.length > 0) {
                  vscode.postMessage({
                    type: "addFreeTextQuestion",
                    value: questionInputRef.current.value,
                    conversationId: currentConversation.id,
                    conversation: currentConversation,
                    lastBotMessageId:
                      currentConversation.messages.find(
                        (m) => m.role === Role.assistant
                      )?.id ?? "",
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

                  // reset the textarea height
                  if (
                    questionInputRef.current &&
                    (questionInputRef.current?.parentNode as any)?.dataset
                  ) {
                    (
                      questionInputRef.current.parentNode as any
                    ).dataset.replicatedValue = "";
                  }
                } else {
                  console.warn(
                    "QuestionInputField - No target or target value"
                  );
                }
              }}
            >
              Ask
              <Icon icon="send" className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-row justify-between gap-2 pb-1 px-4 overflow-x-auto">
        <div className="flex flex-row gap-2">
          <ModelSelect
            currentConversation={currentConversation}
            vscode={vscode}
            conversationList={conversationList}
          />
        </div>
        <div className="flex flex-row gap-2">
          <a
            className={`flex gap-1 items-center py-0.5 px-1 whitespace-nowrap hover:underline focus-within:underline`}
            data-tooltip-id="footer-tooltip"
            data-tooltip-content="Report a bug or suggest a feature in GitHub"
            href="https://github.com/Christopher-Hayes/vscode-chatgpt-reborn/issues/new/choose"
            target="_blank"
          >
            <Icon icon="help" className="w-3 h-3" />
            Feedback
          </a>
          {process.env.NODE_ENV === "development" && (
            <button
              className={`rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full
                ${
                  debug
                    ? "bg-red-900 text-white"
                    : "hover:bg-button-secondary focus:bg-button-secondary"
                }
              `}
              data-tooltip-id="footer-tooltip"
              data-tooltip-content="Toggle debug mode"
              onClick={() => {
                dispatch(setDebug(!debug));
              }}
            >
              <Icon icon="box" className="w-3 h-3" />
              Debug
            </button>
          )}
          <button
            className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary"
            onClick={() => {
              vscode.postMessage({
                type: "openSettings",
                conversationId: currentConversation.id,
              });
            }}
            data-tooltip-id="footer-tooltip"
            data-tooltip-content="Open extension settings"
          >
            <Icon icon="cog" className="w-3 h-3" />
            Settings
          </button>
          <button
            className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary"
            data-tooltip-id="footer-tooltip"
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
        </div>
        <Tooltip id="footer-tooltip" place="top" delayShow={800} />
      </div>
      {/* AI Response In Progress
      {currentConversation.inProgress && (
        <div id="in-progress" className="fixed bottom-8 pl-4 pt-2 items-center">
          <div className="typing">Thinking</div>
          <div className="spinner">
            <div className="bounce1"></div>
            <div className="bounce2"></div>
            <div className="bounce3"></div>
          </div>

          <button
            className="btn btn-primary flex items-end p-1 pr-2 rounded-md ml-5"
            onClick={() => {
              postMessage("stopGenerating");
            }}
          >
            <Icon icon="cancel" className="w-5 h-5 mr-2" />
            Stop responding
          </button>
        </div>
      )} */}
    </footer>
  );
};
