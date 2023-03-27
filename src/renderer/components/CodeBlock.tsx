import React, { useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { Role } from "../types";
import CodeBlockActionsButton from "./CodeBlockActionsButton";

interface CodeBlockProps {
  code: string;
  className?: string;
  conversationId: string;
  vscode: any;
  startCollapsed?: boolean; // This is meant to be a literal that is passed in, and not a state variable
  role?: Role;
}

export default ({
  conversationId: currentConversationId,
  code,
  className = "",
  vscode,
  startCollapsed = false,
  role,
}: CodeBlockProps) => {
  const [codeTextContent, setCodeTextContent] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const codeRef = React.useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    setExpanded(!startCollapsed);
  }, []);

  useEffect(() => {
    let textContent = codeRef.current?.innerText || "";

    // if it ends with a newline, remove it
    if (textContent.endsWith("\n")) {
      textContent = textContent.slice(0, -1);
    }

    setCodeTextContent(textContent);

    // set language based on hljs class
    const detectedLanguage = code.match(/language-(\w+)/)?.[1] || "";
    setLanguage(detectedLanguage);
  }, [code]);

  return (
    <pre
      className={`c-codeblock group bg-input my-4 relative rounded border bg-opacity-20
        ${className} ${!expanded ? "cursor-pointer" : ""}
      `}
    >
      {language && (
        <div className="absolute -top-5 right-4 text-[10px] text-tab-inactive-unfocused">
          {language}
        </div>
      )}
      {/* Added hover styles for the collapsed UI */}
      {expanded && (
        <div className="absolute z-10 top-[0.4em] right-2 flex gap-2 flex-wrap items-center justify-end rounded transition-opacity duration-75 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          <CodeBlockActionsButton
            vscode={vscode}
            codeTextContent={codeTextContent}
            iconName="clipboard"
            tooltipContent="Copy to clipboard"
            buttonText="Copy"
            buttonSuccessText="Copied"
            onClick={() => {
              navigator.clipboard.writeText(codeTextContent);
            }}
          />

          <CodeBlockActionsButton
            vscode={vscode}
            codeTextContent={codeTextContent}
            iconName="pencil"
            tooltipContent="Insert into the current file"
            buttonText="Insert"
            buttonSuccessText="Inserted"
            onClick={() => {
              vscode.postMessage({
                type: "editCode",
                value: codeTextContent,
                conversationId: currentConversationId,
              });
            }}
          />
          <CodeBlockActionsButton
            vscode={vscode}
            codeTextContent={codeTextContent}
            iconName="plus"
            tooltipContent="Create a new file with the below code"
            buttonText="New"
            buttonSuccessText="Created"
            onClick={() => {
              vscode.postMessage({
                type: "openNew",
                value: codeTextContent,
                conversationId: currentConversationId,
                // Handle HLJS language names that are different from VS Code's language IDs
                language: language
                  .replace("js", "javascript")
                  .replace("py", "python")
                  .replace("sh", "bash")
                  .replace("ts", "typescript"),
              });
            }}
          />
          <Tooltip id="code-actions-tooltip" place="bottom" delayShow={1500} />
        </div>
      )}
      {/* Render a collapsed UI if the prop is set to true */}
      {!expanded && (
        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 p-2 flex items-end justify-center">
          <div className="bg-input rounded">
            <button
              className="flex gap-x-1 pt-1.5 pb-1 px-2 text-xs rounded bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap"
              onClick={() => setExpanded(!expanded)}
            >
              {/* <Icon icon="caretDown" className="w-4 h-4" /> */}
              Expand
            </button>
          </div>
        </div>
      )}
      {startCollapsed && expanded && (
        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 p-2 flex items-end justify-center">
          <div className="bg-input rounded">
            <button
              className="flex gap-x-1 top-0 right-0 pt-1.5 pb-1 px-2 text-xs rounded bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap"
              onClick={() => setExpanded(!expanded)}
            >
              {/* <Icon icon="caretDown" className="w-4 h-4 transform rotate-180" /> */}
              Collapse
            </button>
          </div>
        </div>
      )}
      <code
        className={`block px-4 py-2 overflow-x-auto font-code text-code
          ${expanded ? "" : "h-14 collapsed-code-block"}
          ${role === Role.user ? "bg-sidebar" : ""}
        `}
        ref={codeRef}
        dangerouslySetInnerHTML={{
          __html: code
            .replace(/<pre><code[^>]*>/, "")
            .replace(/<\/code><\/pre>/, ""),
        }}
      />
    </pre>
  );
};
