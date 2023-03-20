import React from "react";
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
    <footer className="fixed bottom-0 w-full flex flex-col gap-y-1">
      <div className="px-4 flex items-center">
        <div className="flex-1 textarea-wrapper">
          <textarea
            rows={1}
            className="rounded-sm border text-input bg-secondary"
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
            className="right-6 absolute p-0.5 ml-5 flex items-center gap-2"
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
      <div className="flex flex-row gap-2 py-1 px-4">
        <ModelSelect postMessage={postMessage} />
      </div>
    </footer>
  );
};
