import React from "react";

export default function ({
  postMessage,
  className,
}: {
  postMessage: (type: string, value?: any, language?: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col h-full justify-center px-6 pb-24 w-full relative login-screen overflow-auto ${className}`}
    >
      <div className="flex items-start text-center features-block my-5">
        <div className="flex flex-col gap-3.5 flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
            className="w-6 h-6 m-auto"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            ></path>
          </svg>
          <h2>Features</h2>
          <ul className="flex flex-col gap-3.5 text-xs">
            <li className="features-li w-full border p-3 rounded-md">
              Access to your ChatGPT conversation history
            </li>
            <li className="features-li w-full border p-3 rounded-md">
              Improve your code, add tests & find bugs
            </li>
            <li className="features-li w-full border p-3 rounded-md">
              Copy or create new files automatically
            </li>
            <li className="features-li w-full border p-3 rounded-md">
              Syntax highlighting with auto language detection
            </li>
          </ul>
          <p className="max-w-sm text-center text-xs self-center">
            This is a fork of <a href="https://github.com/gencay">@gencay's</a>{" "}
            discontinued{" "}
            <a href="https://github.com/gencay/vscode-chatgpt">
              VSCode-ChatGPT extension.
            </a>
            <br />
            <button
              onClick={() => {
                postMessage("openSettings");
              }}
              className="text-link hover:text-link-active focus:text-link-active"
            >
              Update settings
            </button>
            &nbsp; | &nbsp;
            <button
              onClick={() => {
                postMessage("openSettingsPrompt");
              }}
              className="text-link hover:text-link-active focus:text-link-active"
            >
              Update prompts
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
