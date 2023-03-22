import React, { useEffect } from "react";
import { Tooltip } from "react-tooltip";
import CodeBlock from "../components/CodeBlock";
import Icon from "../components/Icon";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";
import { Author, Conversation } from "../renderer-types";

export default function Chat({
  vscode,
  conversation,
  setConversationList,
}: {
  vscode: any;
  conversation: Conversation;
  setConversationList: React.Dispatch<React.SetStateAction<Conversation[]>>;
}) {
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

  useEffect(() => {
    const list = document.getElementById("conversation-list");

    if (list) {
      (list.lastChild as any)?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [conversation.messages]);

  // TODO:
  // document.addEventListener("click", (e: any) => {
  //   const targetButton = e.target.closest("button");

  //   if (targetButton?.classList?.contains("resend-element-ext")) {
  //     e.preventDefault();
  //     const question = targetButton.closest(".question-element-ext");
  //     const elements = targetButton.nextElementSibling;

  //     if (elements) {
  //       elements.classList.remove("hidden");
  //     }

  //     if (question.lastElementChild) {
  //       question.lastElementChild.setAttribute("contenteditable", true);
  //     }

  //     targetButton.classList.add("hidden");

  //     return;
  //   }

  //   if (targetButton?.classList?.contains("send-element-ext")) {
  //     e.preventDefault();

  //     const question = targetButton.closest(".question-element-ext");
  //     const elements = targetButton.closest(".send-cancel-elements-ext");
  //     if (elements) {
  //       const resendElement =
  //         targetButton.parentElement.parentElement.firstElementChild;
  //       elements.classList.add("hidden");
  //       if (resendElement) {
  //         resendElement.classList.remove("hidden");
  //       }
  //     }
  //     if (question?.lastElementChild) {
  //       question.lastElementChild.setAttribute("contenteditable", false);
  //       const textContent = question.lastElementChild.textContent;
  //       if (textContent?.length > 0) {
  //         vscode.postMessage({
  //           type: "addFreeTextQuestion",
  //           value: textContent,
  //         });
  //       }
  //     }

  //     return;
  //   }

  //   if (targetButton?.classList?.contains("cancel-element-ext")) {
  //     e.preventDefault();
  //     const question = targetButton.closest(".question-element-ext");
  //     const elements = targetButton.closest(".send-cancel-elements-ext");
  //     const resendElement =
  //       targetButton.parentElement.parentElement.firstElementChild;
  //     if (elements && resendElement && question.lastElementChild) {
  //       elements.classList.add("hidden");
  //       resendElement.classList.remove("hidden");
  //       question.lastElementChild.setAttribute("contenteditable", false);
  //     }

  //     return;
  //   }
  // });

  const exportConversation = () => {
    if ((window as any).turndownService) {
      const turndownService = new (window as any).turndownService({
        codeBlockStyle: "fenced",
      });
      turndownService.remove("no-export");
      let markdown = turndownService.turndown(
        document.getElementById("qa-list")
      );

      vscode.postMessage({
        type: "openNew",
        value: markdown,
        language: "markdown",
        conversationId: conversation.id,
      });
    }
  };

  return (
    <>
      {/* Introduction */}
      <IntroductionSplash
        className={conversation.messages?.length > 0 ? "hidden" : ""}
        vscode={vscode}
      />
      {/* Conversation messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 pb-40" id="conversation-list">
          {conversation.messages.map((message: any) => {
            return (
              <div
                className="w-full p-4 self-end mt-4 question-element-ext relative input-background"
                key={message.id}
              >
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
                    className="resend-element-ext p-1.5 flex items-center rounded-lg absolute right-6 top-6"
                    data-tooltip-id="message-tooltip"
                    data-tooltip-content="Edit and resend this prompt"
                  >
                    <Icon icon="pencil" className="w-3 h-3" />
                  </button>
                  <div className="hidden send-cancel-elements-ext gap-2">
                    <button
                      className="send-element-ext p-1 pr-2 flex items-center"
                      data-tooltip-id="message-tooltip"
                      data-tooltip-content="Send this prompt"
                    >
                      <Icon icon="send" className="w-3 h-3 mr-1" />
                      Send
                    </button>
                    <button
                      className="cancel-element-ext p-1 pr-2 flex items-center"
                      data-tooltip-id="message-tooltip"
                      data-tooltip-content="Cancel"
                    >
                      <Icon icon="cancel" className="w-3 h-3 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
                <div
                  className={`
                    ${message.isError ? "text-red-400" : ""}
                    ${message.isStreaming ? "result-streaming" : ""}
                  `}
                >
                  <div className="message-wrapper">
                    {message.text
                      .split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
                      .reduce((acc: any[], item: any) => {
                        if (item) {
                          acc.push(item);
                        }
                        return acc;
                      }, [])
                      .map(
                        (item: string, index: React.Key | null | undefined) => {
                          if (item.startsWith("<pre><code")) {
                            return (
                              <CodeBlock
                                code={item}
                                vscode={vscode}
                                key={index}
                                currentConversation={conversation}
                              />
                            );
                          } else {
                            return (
                              <div
                                key={index}
                                dangerouslySetInnerHTML={{ __html: item }}
                              />
                            );
                          }
                        }
                      )}
                  </div>
                </div>
              </div>
            );
          })}
          <Tooltip id="message-tooltip" />
        </div>
      </div>
      {/* AI Response In Progress */}
      {conversation.inProgress && (
        <div id="in-progress" className="pl-4 pt-2 items-center hidden">
          <div className="typing">Thinking</div>
          <div className="spinner">
            <div className="bounce1"></div>
            <div className="bounce2"></div>
            <div className="bounce3"></div>
          </div>

          <button
            className="btn btn-primary flex items-end p-1 pr-2 rounded-md ml-5"
            onClick={() => {
              postMessage("stopGenerating");
            }}
          >
            <Icon icon="cancel" className="w-5 h-5 mr-2" />
            Stop responding
          </button>
        </div>
      )}
      {/* Question Input */}
      <QuestionInputField vscode={vscode} currentConversation={conversation} />
    </>
  );
}
