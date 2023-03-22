import React from "react";
import { Tooltip } from "react-tooltip";
import Icon from "./Icon";

interface CodeBlockProps {
  postMessage: (type: string, value?: any, language?: string) => void;
  code: string;
  className?: string;
}

const CodeBlock = ({ postMessage, code, className }: CodeBlockProps) => {
  const [showCopied, setShowCopied] = React.useState(false);
  const [showInserted, setShowInserted] = React.useState(false);

  return (
    <pre
      className={`c-codeblock group bg-secondary my-4 relative rounded border bg-opacity-20
        ${className}
      `}
    >
      <div className="absolute bg top-2 right-4 flex gap-2 flex-wrap items-center justify-end rounded transition-opacity duration-75 opacity-0 group-hover:opacity-100">
        <button
          data-tooltip-id="code-actions-tooltip"
          data-tooltip-content="Copy to clipboard"
          className="code-element-ext p-1 pr-2 flex items-center rounded-lg"
          onClick={() => {
            console.log("copying code to clipboard");
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
      <code
        className="block p-2 overflow-x-auto"
        dangerouslySetInnerHTML={{
          __html: code,
        }}
      />
    </pre>
  );
};

export default CodeBlock;
