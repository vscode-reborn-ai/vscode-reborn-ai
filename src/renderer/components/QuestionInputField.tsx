import React from "react";
import { Tooltip } from "react-tooltip";
import Icon from "./Icon";
import ModelSelect from "./ModelSelect";

export default ({
  postMessage,
  questionInputRef,
  inProgress,
}: {
  postMessage: (type: string, value?: any, language?: string) => void;
  questionInputRef: any;
  inProgress: boolean;
}) => {
  return (
    <footer className="fixed bottom-0 w-full flex flex-col gap-y-1 pt-2 bg">
      <div className="px-4 flex items-center">
        <div className="flex-1 textarea-wrapper">
          <textarea
            rows={1}
            className="w-full text-sm rounded border border-input text-input bg-input resize-none"
            id="question-input"
            placeholder="Ask a question..."
            ref={questionInputRef}
            disabled={inProgress}
            onInput={(e) => {
              const target = e.target as any;
              if (target) {
                target.parentNode.dataset.replicatedValue = target?.value;
              }
            }}
            onKeyDown={(event: any) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
              ) {
                const target = event.target as any;

                if (target && target.value?.length > 0) {
                  postMessage("addFreeTextQuestion", target.value);

                  target.value = "";
                  target.rows = 1;
                } else {
                  console.warn("Ask - No target or target value");
                }
              }
            }}
          ></textarea>
        </div>
        {!inProgress && (
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
                  postMessage(
                    "addFreeTextQuestion",
                    questionInputRef.current.value
                  );

                  questionInputRef.current.value = "";
                }
              }}
            >
              Ask
              <Icon icon="send" className="w-5 h-5 ml-1" />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-row justify-between gap-2 py-1 px-4">
        <div className="flex flex-row gap-2">
          <ModelSelect postMessage={postMessage} />
        </div>
        <div className="flex flex-row gap-2">
          <button
            className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary"
            onClick={() => {
              postMessage("openSettings");
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
