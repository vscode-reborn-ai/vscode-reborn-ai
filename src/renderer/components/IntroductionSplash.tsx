import React from "react";
import { useAppSelector } from "../hooks";
import Icon from "./Icon";

export default function ({
  vscode,
  className,
}: {
  vscode: any;
  className?: string;
}) {
  const chatGPTModels = useAppSelector((state: any) => state.app.chatGPTModels);
  const [ignoreWarningScreen, setIgnoreWarningScreen] = React.useState(true);

  // Ignore warning screen for 3 seconds as the extension gets what models are available
  // and then show the warning screen if there are no models available
  React.useEffect(() => {
    setTimeout(() => {
      setIgnoreWarningScreen(false);
    }, 3000);
  }, []);

  return (
    <div
      className={`flex flex-col gap-3.5 h-full justify-center items-center px-6 pb-24 w-full relative login-screen overflow-auto ${className}`}
    >
      {!ignoreWarningScreen && chatGPTModels.length === 0 ? (
        <>
          <Icon icon="help" className="w-16 h-16" />
          <div className="w-full max-w-lg flex flex-col gap-3.5 text-xs">
            <p className="text-center">
              It looks like your API key is not set up or is invalid.
            </p>
            <p className="text-center">
              Please go to the{" "}
              <button
                className="text-blue-500"
                onClick={() => {
                  vscode.postMessage({
                    type: "openSettings",
                  });
                }}
              >
                settings page
              </button>{" "}
              and enter a valid API key.
            </p>
          </div>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            ></path>
          </svg>
          <h2>Features</h2>
          <ul className="w-full max-w-lg grid grid-cols-1 xs:grid-cols-2 gap-3.5 text-xs">
            <li className="features-li w-full border p-3 rounded-md text-center">
              Optimize, refactor, and debug your code
            </li>
            <li className="features-li w-full border p-3 rounded-md text-center">
              Create tests, READMEs, and more
            </li>
            <li className="features-li w-full border p-3 rounded-md text-center">
              Automatic syntax highlighting
            </li>
            <li className="features-li w-full border p-3 rounded-md text-center">
              Run multiple chats at once
            </li>
          </ul>
          <p className="max-w-sm text-center text-[0.7rem] self-center">
            This is an API-only fork of{" "}
            <a href="https://github.com/gencay">@gencay's</a> discontinued{" "}
            <a
              className="whitespace-nowrap"
              href="https://github.com/gencay/vscode-chatgpt"
            >
              VSCode-ChatGPT extension.
            </a>
          </p>
        </>
      )}
    </div>
  );
}
