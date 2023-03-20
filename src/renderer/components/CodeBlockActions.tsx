import React from "react";
import { Tooltip } from "react-tooltip";
import Icon from "./Icon";

interface CodeBlockActionsProps {
  postMessage: (type: string, value?: any, language?: string) => void;
  code: string;
  className?: string;
}

const CodeBlockActions = ({
  postMessage,
  code,
  className,
}: CodeBlockActionsProps) => {
  const [showCopied, setShowCopied] = React.useState(false);
  const [showInserted, setShowInserted] = React.useState(false);

  return (
    <div
      className={`code-actions-wrapper flex gap-3 pr-2 pt-1 pb-1 flex-wrap items-center justify-end rounded-t-lg input-background
            ${className}
        `}
    >
      <button
        data-tooltip-id="code-actions-tooltip"
        data-tooltip-content="Copy to clipboard"
        className="code-element-ext p-1 pr-2 flex items-center rounded-lg"
        onClick={() => {
          navigator.clipboard.writeText(code).then(() => {
            setShowCopied(true);

            setTimeout(() => {
              setShowCopied(false);
            }, 1500);
          });
        }}
      >
        {showCopied ? (
          <span className="text-green-500">
            <Icon icon="check" className="w-4 h-4 mr-2" />
            Copied
          </span>
        ) : (
          <>
            <Icon icon="clipboard" className="w-4 h-4 mr-2" />
            Copy
          </>
        )}
      </button>
      <button
        data-tooltip-id="code-actions-tooltip"
        data-tooltip-content="Insert into the current file"
        className="edit-element-ext p-1 pr-2 flex items-center rounded-lg"
        onClick={() => {
          postMessage("editCode", code);

          setShowInserted(true);

          setTimeout(() => {
            setShowInserted(false);
          }, 1500);
        }}
      >
        {showInserted ? (
          <span className="text-green-500">
            <Icon icon="check" className="w-4 h-4 mr-2" />
            Inserted
          </span>
        ) : (
          <>
            <Icon icon="pencil" className="w-4 h-4 mr-2" />
            Insert
          </>
        )}
      </button>
      <button
        data-tooltip-id="code-actions-tooltip"
        data-tooltip-content="Create a new file with the below code"
        className="new-code-element-ext p-1 pr-2 flex items-center rounded-lg"
        onClick={() => {
          postMessage("openNew", code);
        }}
      >
        <Icon icon="plus" className="w-4 h-4 mr-2" />
        New
      </button>
      <Tooltip id="code-actions-tooltip" place="bottom" />
    </div>
  );
};

export default CodeBlockActions;
