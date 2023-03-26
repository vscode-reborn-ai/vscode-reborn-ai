import React, { useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { setAutoscroll, updateMessageContent } from "../actions/conversation";
import CodeBlock from "../components/CodeBlock";
import Icon from "../components/Icon";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Conversation, Message, Role } from "../types";

export default function Chat({
  conversation,
  conversationList,
  vscode,
}: {
  conversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
}) {
  const dispatch = useAppDispatch();
  const debug = useAppSelector((state: any) => state.app.debug);
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const conversationListRef = React.useRef<HTMLDivElement>(null);
  const [editingMessageID, setEditingMessageID] = React.useState<string | null>(
    null
  );
  const editingMessageRef = React.useRef<HTMLTextAreaElement>(null);

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
    if (conversation.autoscroll) {
      conversationListRef.current?.scrollTo({
        top: conversationListRef.current.scrollHeight,
        behavior: "auto",
      });
    }
  }, [conversation.messages]);

  // if the user scrolls up while in progress, disable autoscroll
  const handleScroll = () => {
    if (conversationListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        conversationListRef.current;
      if (scrollTop < scrollHeight - clientHeight) {
        // disable autoscroll if the user scrolls up
        dispatch(
          setAutoscroll({
            conversationId: conversation.id,
            autoscroll: false,
          })
        );
      } else {
        // re-enable autoscroll if the user scrolls to the bottom
        dispatch(
          setAutoscroll({
            conversationId: conversation.id,
            autoscroll: true,
          })
        );
      }
    }
  };

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
      {debug && (
        <div className="text-gray-500 text-[10px] font-mono">
          Conversation ID: {conversation?.id}
          <br />
          Conversation Title: {conversation?.title}
          <br />
          Conversation Datetime:{" "}
          {new Date(conversation?.createdAt ?? "").toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
          <br />
          Conversation Model: {conversation?.model}
          <br />
          Conversation inProgress: {conversation?.inProgress ? "true" : "false"}
        </div>
      )}
      {/* Introduction */}
      <IntroductionSplash
        className={conversation.messages?.length > 0 ? "hidden" : ""}
        vscode={vscode}
      />
      {/* Conversation messages */}
      <div
        className="flex-1 overflow-y-auto"
        ref={conversationListRef}
        onScroll={handleScroll}
      >
        <div
          className={`flex flex-col 
          ${settings?.minimalUI ? "pb-20" : "pb-24"}
        `}
        >
          {conversation.messages.map((message: Message, index: number) => {
            return (
              <div
                className={`w-full flex flex-col gap-y-4 p-4 self-end question-element-ext relative
                  ${message.role === Role.user ? "bg-input" : "bg-sidebar"}
                `}
                key={message.id}
              >
                <header className="flex items-center">
                  <h2 className="flex-grow flex items-center">
                    {message.role === Role.user ? (
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
                  {message.role === Role.user && (
                    <div className="flex items-center">
                      <div
                        className={`send-cancel-elements-ext gap-2
                        ${editingMessageID === message.id ? "" : "hidden"}
                      `}
                      >
                        <button
                          className="send-element-ext p-1 pr-2 flex items-center"
                          data-tooltip-id="message-tooltip"
                          data-tooltip-content="Send this prompt"
                          onClick={() => {
                            const newQuestion =
                              editingMessageRef.current?.value;

                            vscode.postMessage({
                              type: "addFreeTextQuestion",
                              value: newQuestion,
                              questionId: message.id,
                              // get message that comes after this one
                              messageId:
                                conversation.messages[index + 1]?.id ?? "",
                              lastBotMessageId:
                                conversation.messages.find(
                                  (m) => m.role === Role.assistant
                                )?.id ?? "",
                              conversation,
                            });

                            dispatch(
                              updateMessageContent({
                                conversationId: conversation.id,
                                messageId: message.id,
                                content: newQuestion ?? message.content,
                                done: true,
                              })
                            );

                            setEditingMessageID("");
                          }}
                        >
                          <Icon icon="send" className="w-3 h-3 mr-1" />
                          Send
                        </button>
                        <button
                          className="cancel-element-ext p-1 pr-2 flex items-center"
                          data-tooltip-id="message-tooltip"
                          data-tooltip-content="Cancel"
                          onClick={() => {
                            setEditingMessageID("");
                          }}
                        >
                          <Icon icon="cancel" className="w-3 h-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                      <button
                        className="p-1.5 flex items-center rounded"
                        data-tooltip-id="message-tooltip"
                        data-tooltip-content="Edit and resend this prompt"
                        onClick={() => {
                          setEditingMessageID(message.id);
                        }}
                      >
                        <Icon icon="pencil" className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </header>
                <div
                  className={`
                    ${message.isError ? "text-red-400" : ""}
                    ${message?.done ?? true ? "" : "result-streaming"}
                  `}
                >
                  {message.id === editingMessageID ? (
                    // show textarea to edit message
                    <div className="flex flex-col gap-y-2">
                      <textarea
                        className="w-full h-24 resize-none bg-input rounded p-2"
                        defaultValue={message.content}
                        ref={editingMessageRef}
                      />
                    </div>
                  ) : (
                    <div className="message-wrapper">
                      {message.content
                        .split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
                        .reduce((acc: any[], item: any) => {
                          if (item) {
                            acc.push(item);
                          }
                          return acc;
                        }, [])
                        .map(
                          (
                            item: string,
                            index: React.Key | null | undefined
                          ) => {
                            if (item.startsWith("<pre><code")) {
                              return (
                                <CodeBlock
                                  code={item}
                                  key={index}
                                  conversationId={conversation.id}
                                  vscode={vscode}
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
                  )}
                  {debug && (
                    <div className="text-xs text-gray-500">
                      Message ID: {message?.id}
                      <br />
                      Message Author: {message?.role}
                      <br />
                      Message createdAt:{" "}
                      {new Date(message?.createdAt ?? "").toLocaleString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      )}
                      <br />
                      Message done: {message?.done ? "true" : "false"}
                      <br />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <Tooltip id="message-tooltip" />
        </div>
      </div>
      {/* Question Input */}
      <QuestionInputField
        conversation={conversation}
        vscode={vscode}
        conversationList={conversationList}
      />
    </>
  );
}
