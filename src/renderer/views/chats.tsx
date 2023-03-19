import React, { useState } from "react";
import Icon from "../components/Icon";
import ModelSelect from "../components/ModelSelect";
import { getVSCodeAPI } from "../utils";

enum Author {
  user = "user",
  bot = "bot",
}

interface Message {
  id?: string;
  author: Author;
  text: string;
  date?: string;
}

interface Conversation {
  id?: string;
  messages: Message[];
  title?: string;
  datetime?: string;
}

export default function CustomPromptManager() {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const questionInputRef = React.createRef<HTMLTextAreaElement>();

  const initialConversation = {
    id: "",
    messages: [],
  } as Conversation;
  const [conversationList, setConversationList] = useState<Conversation[]>([
    initialConversation,
  ]);
  const [conversation, setConversation] =
    useState<Conversation>(initialConversation);
  const vscode = getVSCodeAPI();

  (window as any).marked.setOptions({
    renderer: new (window as any).marked.Renderer(),
    highlight: function (code: any, _lang: any) {
      return (window as any).hljs.highlightAuto(code).value;
    },
    langPrefix: "hljs language-",
    pedantic: false,
    gfm: true,
    breaks: true,
    sanitize: false,
    smartypants: false,
    xhtml: false,
  });

  document.addEventListener("click", (e: any) => {
    const targetButton = e.target.closest("button");

    if (targetButton?.id === "export-button") {
      e.preventDefault();
      exportConversation();
      return;
    }

    if (
      targetButton?.id === "list-conversations-button" ||
      targetButton?.id === "list-conversations-link"
    ) {
      e.preventDefault();

      postMessage("listConversations");
      return;
    }

    if (targetButton?.id === "show-conversation-button") {
      e.preventDefault();

      postMessage("showConversation", targetButton.getAttribute("data-id"));

      setShowConversationList(true);

      const introEl = document.getElementById("introduction");
      if (introEl) {
        introEl.classList.add("hidden");
      }

      const conListEl = document.getElementById("conversation-list");
      if (conListEl) {
        conListEl.classList.add("hidden");
      }

      return;
    }

    if (targetButton?.id === "refresh-conversations-button") {
      e.preventDefault();

      postMessage("listConversations");
      return;
    }

    if (targetButton?.id === "close-conversations-button") {
      e.preventDefault();

      setShowConversationList(false);

      return;
    }

    if (targetButton?.id === "stop-button") {
      e.preventDefault();
      postMessage("stopGenerating");

      return;
    }

    if (targetButton?.classList?.contains("resend-element-ext")) {
      e.preventDefault();
      const question = targetButton.closest(".question-element-ext");
      const elements = targetButton.nextElementSibling;

      if (elements) {
        elements.classList.remove("hidden");
      }

      if (question.lastElementChild) {
        question.lastElementChild.setAttribute("contenteditable", true);
      }

      targetButton.classList.add("hidden");

      return;
    }

    if (targetButton?.classList?.contains("send-element-ext")) {
      e.preventDefault();

      const question = targetButton.closest(".question-element-ext");
      const elements = targetButton.closest(".send-cancel-elements-ext");
      if (elements) {
        const resendElement =
          targetButton.parentElement.parentElement.firstElementChild;
        elements.classList.add("hidden");
        if (resendElement) {
          resendElement.classList.remove("hidden");
        }
      }
      if (question?.lastElementChild) {
        question.lastElementChild.setAttribute("contenteditable", false);
        const textContent = question.lastElementChild.textContent;
        if (textContent?.length > 0) {
          vscode.postMessage({
            type: "addFreeTextQuestion",
            value: textContent,
          });
        }
      }

      return;
    }

    if (targetButton?.classList?.contains("cancel-element-ext")) {
      e.preventDefault();
      const question = targetButton.closest(".question-element-ext");
      const elements = targetButton.closest(".send-cancel-elements-ext");
      const resendElement =
        targetButton.parentElement.parentElement.firstElementChild;
      if (elements && resendElement && question.lastElementChild) {
        elements.classList.add("hidden");
        resendElement.classList.remove("hidden");
        question.lastElementChild.setAttribute("contenteditable", false);
      }

      return;
    }

    if (targetButton?.classList?.contains("code-element-ext")) {
      e.preventDefault();
      navigator.clipboard
        .writeText(
          targetButton.parentElement?.nextElementSibling?.lastChild?.textContent
        )
        .then(() => {
          targetButton.innerHTML = `${checkSvg} Copied`;

          setTimeout(() => {
            targetButton.innerHTML = `${Clipboard} Copy`;
          }, 1500);
        });

      return;
    }

    if (targetButton?.classList?.contains("edit-element-ext")) {
      e.preventDefault();
      vscode.postMessage({
        type: "editCode",
        value:
          targetButton.parentElement?.nextElementSibling?.lastChild
            ?.textContent,
      });

      return;
    }

    if (targetButton?.classList?.contains("new-code-element-ext")) {
      e.preventDefault();
      vscode.postMessage({
        type: "openNew",
        value:
          targetButton.parentElement?.nextElementSibling?.lastChild
            ?.textContent,
      });

      return;
    }
  });

  const clearConversation = () => {
    const qaListElem = document.getElementById("qa-list");
    if (qaListElem) {
      console.warn("Element exists!");
      qaListElem.innerHTML = "";
    } else {
      console.warn("Element does not exist!");
    }

    document.getElementById("introduction")?.classList?.remove("hidden");

    vscode.postMessage({
      type: "clearConversation",
    });
  };

  const exportConversation = () => {
    if ((window as any).turndownService) {
      const turndownService = new (window as any).turndownService({
        codeBlockStyle: "fenced",
      });
      turndownService.remove("no-export");
      let markdown = turndownService.turndown(
        document.getElementById("qa-list")
      );

      postMessage("openNew", markdown, "markdown");
    }
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;
    const list = document.getElementById("qa-list");

    let stopBtn = document.getElementById("stop-button");
    let inProgressElm = document.getElementById("in-progress");
    let questionInput = document.getElementById("question-input");
    let questionInputBtns = document.getElementById("question-input-buttons");

    switch (message.type) {
      case "showInProgress":
        if (message.showStopButton && stopBtn) {
          stopBtn.classList.remove("hidden");
        } else if (stopBtn) {
          stopBtn.classList.add("hidden");
        }

        if (
          message.inProgress &&
          inProgressElm &&
          questionInput &&
          questionInputBtns
        ) {
          inProgressElm.classList.remove("hidden");
          questionInput.setAttribute("disabled", true);
          questionInputBtns.classList.add("hidden");
        } else if (inProgressElm && questionInput && questionInputBtns) {
          inProgressElm.classList.add("hidden");
          questionInput.removeAttribute("disabled");
          questionInputBtns.classList.remove("hidden");
        }

        break;
      case "addQuestion":
        list.classList.remove("hidden");
        document.getElementById("introduction")?.classList?.add("hidden");
        document.getElementById("conversation-list")?.classList?.add("hidden");

        const escapeHtml = (unsafe: {
          replaceAll: (
            arg0: string,
            arg1: string
          ) => {
            (): any;
            new (): any;
            replaceAll: {
              (arg0: string, arg1: string): {
                (): any;
                new (): any;
                replaceAll: {
                  (arg0: string, arg1: string): {
                    (): any;
                    new (): any;
                    replaceAll: {
                      (arg0: string, arg1: string): {
                        (): any;
                        new (): any;
                        replaceAll: {
                          (arg0: string, arg1: string): any;
                          new (): any;
                        };
                      };
                      new (): any;
                    };
                  };
                  new (): any;
                };
              };
              new (): any;
            };
          };
        }) => {
          return unsafe
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
        };

        const question = {
          id: message.id,
          author: Author.user,
          text: message.text,
        } as Message;

        list.innerHTML += ``;

        if (message.autoScroll) {
          list.lastChild?.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
        break;
      case "addResponse":
        let existingMessage = message.id && document.getElementById(message.id);
        let updatedValue = "";

        const unEscapeHtml = (unsafe: {
          replaceAll: (
            arg0: string,
            arg1: string
          ) => {
            (): any;
            new (): any;
            replaceAll: {
              (arg0: string, arg1: string): {
                (): any;
                new (): any;
                replaceAll: {
                  (arg0: string, arg1: string): {
                    (): any;
                    new (): any;
                    replaceAll: {
                      (arg0: string, arg1: string): {
                        (): any;
                        new (): any;
                        replaceAll: {
                          (arg0: string, arg1: string): any;
                          new (): any;
                        };
                      };
                      new (): any;
                    };
                  };
                  new (): any;
                };
              };
              new (): any;
            };
          };
        }) => {
          return unsafe
            .replaceAll("&amp;", "&")
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">")
            .replaceAll("&quot;", '"')
            .replaceAll("&#039;", "'");
        };

        if (!message.responseInMarkdown) {
          updatedValue = "```\r\n" + unEscapeHtml(message.value) + " \r\n ```";
        } else {
          updatedValue =
            message.value.split("```").length % 2 === 1
              ? message.value
              : message.value + "\n\n```\n\n";
        }

        const markedResponse = marked.parse(updatedValue);

        if (existingMessage) {
          existingMessage.innerHTML = markedResponse;
        } else {
          list.innerHTML += `<div class="p-4 self-end mt-4 pb-8 answer-element-ext">
                        <h2 class="mb-5 flex">${aiSvg}ChatGPT</h2>
                        <div class="result-streaming" id="${message.id}">${markedResponse}</div>
                    </div>`;
        }

        if (message.done) {
          const preCodeList = list.lastChild.querySelectorAll("pre > code");

          preCodeList.forEach(
            (preCode: {
              classList: {
                add: (
                  arg0: string,
                  arg1: string,
                  arg2: string,
                  arg3: string,
                  arg4: string,
                  arg5: string
                ) => void;
              };
              parentElement: {
                classList: { add: (arg0: string, arg1: string) => void };
              };
              parentNode: {
                previousSibling: any;
                parentNode: {
                  insertBefore: (arg0: HTMLElement, arg1: any) => void;
                  prepend: (arg0: HTMLElement) => void;
                };
              };
            }) => {
              preCode.classList.add(
                "input-background",
                "p-4",
                "pb-2",
                "block",
                "whitespace-pre",
                "overflow-x-scroll"
              );
              preCode.parentElement.classList.add(
                "pre-code-element",
                "relative"
              );

              const buttonWrapper = document.createElement("no-export");
              buttonWrapper.classList.add(
                "code-actions-wrapper",
                "flex",
                "gap-3",
                "pr-2",
                "pt-1",
                "pb-1",
                "flex-wrap",
                "items-center",
                "justify-end",
                "rounded-t-lg",
                "input-background"
              );

              // Create copy to clipboard button
              const copyButton = document.createElement("button");
              copyButton.title = "Copy to clipboard";
              copyButton.innerHTML = `${Clipboard} Copy`;

              copyButton.classList.add(
                "code-element-ext",
                "p-1",
                "pr-2",
                "flex",
                "items-center",
                "rounded-lg"
              );

              const insert = document.createElement("button");
              insert.title = "Insert the below code to the current file";
              insert.innerHTML = `${insert} Insert`;

              insert.classList.add(
                "edit-element-ext",
                "p-1",
                "pr-2",
                "flex",
                "items-center",
                "rounded-lg"
              );

              const newTab = document.createElement("button");
              newTab.title = "Create a new file with the below code";
              newTab.innerHTML = `${plusSvg} New`;

              newTab.classList.add(
                "new-code-element-ext",
                "p-1",
                "pr-2",
                "flex",
                "items-center",
                "rounded-lg"
              );

              buttonWrapper.append(copyButton, insert, newTab);

              if (preCode.parentNode.previousSibling) {
                preCode.parentNode.parentNode.insertBefore(
                  buttonWrapper,
                  preCode.parentNode.previousSibling
                );
              } else {
                preCode.parentNode.parentNode.prepend(buttonWrapper);
              }
            }
          );

          const existingMessage = document.getElementById(message.id);

          if (existingMessage) {
            existingMessage.classList.remove("result-streaming");
          } else {
            console.warn(
              "The element with id " + message.id + " does not exist."
            );
          }
        }

        if (
          message.autoScroll &&
          (message.done || markedResponse.endsWith("\n"))
        ) {
          list.lastChild?.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }

        break;
      case "addError":
        if (!list.innerHTML) {
          return;
        }

        const messageValue =
          message.value ||
          "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to outage on https://openai.com services.";

        setConversation([
          ...conversation,
          { type: "error", value: messageValue },
        ]);

        // list.innerHTML += `<div class="p-4 self-end mt-4 pb-8 error-element-ext">
        //                 <h2 class="mb-5 flex">${aiSvg}ChatGPT</h2>
        //                 <div class="text-red-400">${marked.parse(
        //                   messageValue
        //                 )}</div>
        //             </div>`;

        if (message.autoScroll) {
          list.lastChild?.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
        break;
      case "clearConversation":
        clearConversation();
        break;
      case "exportConversation":
        exportConversation();
        break;
      case "loginSuccessful":
        document.getElementById("login-button")?.classList?.add("hidden");
        if (message.showConversations) {
          const conversationsLink = document.getElementById(
            "list-conversations-link"
          );
          if (conversationsLink) {
            conversationsLink.classList.remove("hidden");
          } else {
            console.warn("conversations link does not exist!");
          }
        }

        break;
      case "listConversations":
        list.classList.add("hidden");
        document.getElementById("introduction")?.classList?.add("hidden");
        const conversationList = document.getElementById("conversation-list");
        conversationList.classList.remove("hidden");
        const conversation_list = message.conversations.items.map(
          (conversation: {
            create_time: string | number | Date;
            id: any;
            title: string;
          }) => {
            const chatDate = new Date(
              conversation.create_time
            ).toLocaleString();
            return `<button id="show-conversation-button" data-id="${
              conversation.id
            }" data-title="${conversation.title.replace(
              /"/g,
              ""
            )}" data-time="${chatDate}" class="flex py-3 px-3 items-center gap-3 relative rounded-lg input-background cursor-pointer break-all group">${textSvg}<div class="flex flex-col items-start gap-2 truncate"><span class="text-left font-bold">${
              conversation.title
            }</span><div class="text-xs text-left">${chatDate}</div></div></button>`;
          }
        );
        conversationList.innerHTML = `<div class="flex flex-col gap-4 text-sm relative overflow-y-auto p-8">
                    <div class="flex justify-center gap-4">
                        <button id="refresh-conversations-button" title="Reload conversations" class="p-1 pr-2 flex items-center rounded-lg">${refreshSvg}&nbsp;Reload</button>
                        <button id="close-conversations-button" title="Close conversations panel" class="p-1 pr-2 flex items-center rounded-lg">${closeSvg}&nbsp;Close</button>
                    </div>
                    <div class="flex flex-col gap-4">${conversation_list.join(
                      ""
                    )}</div>
                </div>`;
        break;
      default:
        break;
    }
  });

  return (
    <>
      <div
        className={`flex flex-col h-full justify-center px-6 pb-24 w-full relative login-screen overflow-auto
          ${conversation?.messages?.length > 0 ? "" : "hidden"}
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

      <div className="flex-1 overflow-y-auto" id="qa-list">
        <>
          {showConversationList && (
            <>
              {/* <div className="flex flex-col p-6 pt-2">
                <h2 className="text-lg">
                  ${targetButton.getAttribute("data-title")}
                </h2>
                <span className="text-xs">
                  Started on: ${targetButton.getAttribute("data-time")}
                </span>
              </div>
              <div
                className="flex-1 overflow-y-auto hidden"
                id="conversation-list"
              ></div> */}
              <div className="flex flex-col gap-4 text-sm relative overflow-y-auto p-8">
                <div className="flex justify-center gap-4">
                  <button
                    id="refresh-conversations-button"
                    title="Reload conversations"
                    className="p-1 pr-2 flex items-center rounded-lg"
                  >
                    <Icon icon="refresh" className="w-6 h-6 mr-2" />
                    Reload
                  </button>
                  <button
                    id="close-conversations-button"
                    title="Close conversations panel"
                    className="p-1 pr-2 flex items-center rounded-lg"
                  >
                    <Icon icon="close" className="w-6 h-6 mr-2" />
                    Close
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {conversationList.map((conversation, index) => {
                    return (
                      <div
                        className="flex flex-col gap-4 p-4 border border-zinc-700 rounded-md"
                        id={`conversation-${index}`}
                      >
                        <div className="flex justify-between">
                          <h2 className="text-lg">{conversation.title}</h2>
                          <span className="text-xs">
                            Started on: {conversation.datetime}
                          </span>

                          <button
                            title="Delete this conversation"
                            className="delete-element-ext p-1.5 flex items-center rounded-lg absolute right-6 top-6"
                          >
                            <Icon icon="trash" className="w-6 h-6 mr-2" />
                          </button>

                          <button
                            title="Open this conversation"
                            className="open-element-ext p-1.5 flex items-center rounded-lg absolute right-6 top-6"
                          >
                            <Icon icon="open" className="w-6 h-6 mr-2" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {conversation.messages.map((message: any, index: number) => {
            <div className="p-4 self-end mt-4 question-element-ext relative input-background">
              <h2 className="mb-5 flex">
                {message.author === Author.user ? (
                  <>
                    <Icon icon="user" className="w-6 h-6 mr-2" />
                    You
                  </>
                ) : (
                  <>
                    <Icon icon="ai" className="w-6 h-6 mr-2" />
                    ChatGPT
                  </>
                )}
              </h2>
              <div className="mb-2 flex items-center">
                <button
                  title="Edit and resend this prompt"
                  className="resend-element-ext p-1.5 flex items-center rounded-lg absolute right-6 top-6"
                >
                  <Icon icon="pencil" className="w-3 h-3" />
                </button>
                <div className="hidden send-cancel-elements-ext gap-2">
                  <button
                    title="Send this prompt"
                    className="send-element-ext p-1 pr-2 flex items-center"
                  >
                    <Icon icon="send" className="w-3 h-3 mr-1" />
                    Send
                  </button>
                  <button
                    title="Cancel"
                    className="cancel-element-ext p-1 pr-2 flex items-center"
                  >
                    <Icon icon="cancel" className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto">{message.value}</div>
            </div>;
          })}
        </>
      </div>

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

      <footer className="fixed bottom-0 w-full flex flex-col">
        <div className="px-4 flex items-center">
          <div className="flex-1 textarea-wrapper">
            <textarea
              rows={1}
              id="question-input"
              placeholder="Ask a question..."
              ref={questionInputRef}
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
              {/* TODO: localize */}
              Ask
              <Icon icon="send" className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
        <div className="flex flex-row gap-2 py-1 px-4">
          <ModelSelect />
        </div>
      </footer>
    </>
  );
}
