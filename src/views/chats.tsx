import React, { useState } from "react";
import Icon from "../components/Icon";

export default function CustomPromptManager(props: { vscode: any }) {
  const [showModels, setShowModels] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(true);

  const postMessage = (type: string, value: any = "") => {
    const message = {
      type,
    } as { type: string; value?: any };

    if (value) {
      message.value = value;
    }

    props.vscode.postMessage(message);
  };

  return (
    <>
      <div
        className={`flex flex-col h-full justify-center px-6 w-full relative login-screen overflow-auto
          ${showIntroduction ? "" : "hidden"}
        `}
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
              <li className="features-li w-full border border-zinc-700 p-3 rounded-md">
                Access to your ChatGPT conversation history
              </li>
              <li className="features-li w-full border border-zinc-700 p-3 rounded-md">
                Improve your code, add tests & find bugs
              </li>
              <li className="features-li w-full border border-zinc-700 p-3 rounded-md">
                Copy or create new files automatically
              </li>
              <li className="features-li w-full border border-zinc-700 p-3 rounded-md">
                Syntax highlighting with auto language detection
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-4 h-full items-center justify-end text-center mb-8">
          <button
            id="list-conversations-link"
            className="hidden mb-4 btn btn-primary gap-2 justify-center p-3 rounded-md"
            title="You can access this feature via the kebab menu below. NOTE: Only available with Browser Auto-login method"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            &nbsp;Show conversations
          </button>
          <p className="max-w-sm text-center text-xs text-slate-500">
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

      <div className="flex-1 overflow-y-auto" id="qa-list"></div>

      <div
        className="flex-1 overflow-y-auto hidden"
        id="conversation-list"
      ></div>

      <div id="in-progress" className="pl-4 pt-2 items-center hidden">
        <div className="typing">Thinking</div>
        <div className="spinner">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>

        <button
          id="stop-button"
          className="btn btn-primary flex items-end p-1 pr-2 rounded-md ml-5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Stop responding
        </button>
      </div>

      <div className="p-4 flex items-center pt-2">
        <div className="flex-1 textarea-wrapper">
          <textarea
            rows={1}
            id="question-input"
            placeholder="Ask a question..."
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

                  this.value = "";
                }
              }
            }}
          ></textarea>
        </div>
        <div
          className={`absolute bottom-14 items-center more-menu right-8 border text-menu bg-menu border-menu shadow-xl text-xs
            ${showModels ? "block" : "hidden"}
          `}
        >
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              postMessage("setModel", "gpt-3.5-turbo");
            }}
          >
            GPT-3.5-TURBO (Fast, recommended)
          </button>
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              postMessage("setModel", "gpt-4");
            }}
          >
            GPT-4 (Better and larger input, but slower and more pricey)
          </button>
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              postMessage("setModel", "gpt-4-32k");
            }}
          >
            Not yet available? - GPT-4-32K (Extremely long input, but slower and
            even more pricey)
          </button>
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              postMessage("setModel", "text-davinci-003");
            }}
          >
            GPT-3 davinci-003 (Cheap/fast, but not as good as GPT-3.5/4)
          </button>
        </div>
        <div
          className={`absolute bottom-14 items-center more-menu right-8 border text-menu bg-menu border-menu shadow-xl text-xs
            ${showMoreActions ? "block" : "hidden"}
          `}
        >
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            id="clear-button"
            onClick={() => {
              const qaListElem = document.getElementById("qa-list");
              if (qaListElem) {
                qaListElem.innerHTML = "";
              } else {
                console.warn("qa-list does not exist!");
              }

              setShowIntroduction(true);

              postMessage("clearConversation");
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            &nbsp;New chat
          </button>
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            id="list-conversations-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            &nbsp;Show conversations
          </button>
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            id="settings-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            &nbsp;Update settings
          </button>
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            id="export-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            &nbsp;Export to markdown
          </button>
        </div>
        <div
          id="question-input-buttons"
          className="right-6 absolute p-0.5 ml-5 flex items-center gap-2"
        >
          <button
            title="Change models"
            className="rounded-lg p-0.5"
            onClick={() => {
              setShowModels(!showModels);
            }}
          >
            {/* Box icon from https://feathericons.com/ */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </button>
          <button
            title="More actions"
            className="rounded-lg p-0.5"
            onClick={() => {
              setShowMoreActions(!showMoreActions);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </button>

          <button
            title="Submit prompt"
            className="ask-button rounded-lg p-0.5"
            onClick={() => {
              if (this.value?.length > 0) {
                postMessage("addFreeTextQuestion", this.value);

                this.value = "";
              }
            }}
          >
            <Icon icon="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
