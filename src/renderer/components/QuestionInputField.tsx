import React from "react";
import { Tooltip } from "react-tooltip";
import { setDebug } from "../actions/app";
import { updateUserInput } from "../actions/conversation";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Conversation, Role } from "../types";
import Icon from "./Icon";
import ModelSelect from "./ModelSelect";

export default ({
  conversation: currentConversation,
  vscode,
}: {
  conversation: Conversation;
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
          <textarea
            rows={1}
            className="text-sm rounded border border-input text-input bg-input resize-none w-[calc(100%-5rem)]"
            id="question-input"
            placeholder="Ask a question..."
            ref={questionInputRef}
            // disabled={currentConversation.inProgress}
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
        </div>
        {!currentConversation.inProgress && (
          <div
            id="question-input-buttons"
            className="right-6 absolute py-0.5 px-2 -mt-1 ml-5 flex items-center gap-2 rounded hover:bg-button-secondary focus:bg-button-secondary"
          >
            <button
              title="Submit prompt"
              className="ask-button rounded-lg p-0.5 flex flex-row items-center"
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
          </div>
        )}
      </div>
      <div className="flex flex-row justify-between gap-2 pb-1 px-4">
        <div className="flex flex-row gap-2">
          <ModelSelect
            currentConversation={currentConversation}
            vscode={vscode}
          />
        </div>
        <div className="flex flex-row gap-2">
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
              data-tooltip-content="Export the conversation to a markdown file"
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
          >
            <Icon icon="download" className="w-3 h-3" />
            Export
          </button>
        </div>
        <Tooltip id="footer-tooltip" place="top" delayShow={800} />
      </div>
    </footer>
  );
};
