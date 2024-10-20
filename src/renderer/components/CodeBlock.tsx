import classNames from "classnames";
import React, { useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { Role } from "../types";
import CodeBlockActionsButton from "./CodeBlockActionsButton";

interface CodeBlockProps {
  code: string;
  className?: string;
  conversationId?: string;
  vscode: any;
  startCollapsed?: boolean; // This is meant to be a literal that is passed in, and not a state variable
  role?: Role;
  margins?: boolean;
}

export default ({
  conversationId: currentConversationId,
  code,
  className = "",
  vscode,
  startCollapsed = false,
  role,
  margins = true,
}: CodeBlockProps) => {
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [codeTextContent, setCodeTextContent] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const codeRef = React.useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const backendMessenger = useMessenger(vscode);

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
      className={classNames(
        "c-codeblock group/codeblock bg-input relative rounded border bg-opacity-20",
        className,
        {
          "cursor-pointer": !expanded,
          "my-4": margins,
        }
      )}
    >
      {language && (
        <div className="absolute -top-5 right-4 text-[10px] text-tab-inactive-unfocused">
          {language}
        </div>
      )}
      {/* Added hover styles for the collapsed UI */}
      {expanded && (
        <div className="sticky h-0 z-10 top-0 -mt-[1px] pr-2 border-t">
          <div className="pt-1 flex flex-wrap items-center justify-end gap-2 transition-opacity duration-75 opacity-0 pointer-events-none group-hover/codeblock:opacity-100 group-focus-within/codeblock:opacity-100">
            <CodeBlockActionsButton
              vscode={vscode}
              codeTextContent={codeTextContent}
              iconName="clipboard"
              tooltipContent={t?.codeBlock?.copyTooltip ?? "Copy to clipboard"}
              buttonText={t?.codeBlock?.copy ?? "Copy"}
              buttonSuccessText={t?.codeBlock?.copied ?? "Copied"}
              onClick={() => {
                navigator.clipboard.writeText(codeTextContent);
              }}
            />

            {currentConversationId && (
              <>
                <CodeBlockActionsButton
                  vscode={vscode}
                  codeTextContent={codeTextContent}
                  iconName="pencil"
                  tooltipContent={
                    t?.codeBlock?.insertTooltip ??
                    "Insert into the current file"
                  }
                  buttonText={t?.codeBlock?.insert ?? "Insert"}
                  buttonSuccessText={t?.codeBlock?.inserted ?? "Inserted"}
                  onClick={() => {
                    if (currentConversationId) {
                      backendMessenger.sendEditCode(codeTextContent);
                    }
                  }}
                />
                <CodeBlockActionsButton
                  vscode={vscode}
                  codeTextContent={codeTextContent}
                  iconName="plus"
                  tooltipContent={
                    t?.codeBlock?.newTooltip ??
                    "Create a new file with the below code"
                  }
                  buttonText={t?.codeBlock?.new ?? "New"}
                  buttonSuccessText={t?.codeBlock?.created ?? "Created"}
                  onClick={() => {
                    // Handle HLJS language names that are different from VS Code's language IDs
                    const lang = language
                      .replace("js", "javascript")
                      .replace("py", "python")
                      .replace("sh", "bash")
                      .replace("ts", "typescript");
                    backendMessenger.sendOpenNew(codeTextContent, lang);
                  }}
                />
              </>
            )}
            <Tooltip
              id="code-actions-tooltip"
              place="bottom"
              delayShow={1500}
            />
          </div>
        </div>
      )}
      {/* Render a collapsed UI if the prop is set to true */}
      {!expanded && (
        <div className="opacity-0 group-hover/codeblock:opacity-100 absolute inset-0 p-2 flex items-end justify-center">
          <div className="bg-input rounded">
            <button
              className="flex gap-x-1 pt-1.5 pb-1 px-2 text-xs rounded bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap"
              onClick={() => setExpanded(!expanded)}
            >
              {t?.codeBlock?.expand ?? "Expand"}
            </button>
          </div>
        </div>
      )}
      {startCollapsed && expanded && (
        <div className="opacity-0 group-hover/codeblock:opacity-100 absolute inset-0 p-2 flex items-end justify-center">
          <div className="bg-input rounded">
            <button
              className="flex gap-x-1 top-0 right-0 pt-1.5 pb-1 px-2 text-xs rounded bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover whitespace-nowrap"
              onClick={() => setExpanded(!expanded)}
            >
              {t?.codeBlock?.collapse ?? "Collapse"}
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
