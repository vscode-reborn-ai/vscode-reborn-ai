import React, { useEffect, useMemo } from "react";
import { Tooltip } from "react-tooltip";
import CodeBlock from "../components/CodeBlock";
import Icon from "../components/Icon";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";
import { getModelFriendlyName } from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { setAutoscroll, updateMessageContent } from "../store/conversation";
import { ChatMessage, Conversation, Role } from "../types";

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
  const t = useAppSelector((state: RootState) => state.app.translations);
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const conversationListRef = React.useRef<HTMLDivElement>(null);
  const models = useAppSelector((state: RootState) => state.app.models);
  const [editingMessageID, setEditingMessageID] = React.useState<string | null>(
    null
  );
  const editingMessageRef = React.useRef<HTMLTextAreaElement>(null);
  const backendMessenger = useMessenger(vscode);

  const modelFriendlyName = useMemo(() => {
    return getModelFriendlyName(conversation, models, settings);
  }, [conversation, models, settings]);

  (window as any)?.marked?.setOptions({
    renderer: new ((window as any)?.marked).Renderer(),
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
      if (scrollTop < scrollHeight - clientHeight && conversation.autoscroll) {
        // disable autoscroll if the user scrolls up
        dispatch(
          setAutoscroll({
            conversationId: conversation.id,
            autoscroll: false,
          })
        );
      } else if (
        !conversation.autoscroll &&
        scrollTop >= scrollHeight - clientHeight
      ) {
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

  useEffect(() => {
    // check if the scroll listener is already attached
    if (conversationListRef.current && !conversationListRef.current.onscroll) {
      // attach the scroll listener
      conversationListRef.current.addEventListener("scroll", handleScroll, {
        passive: true, // do not block scrolling
      });
    }
  }, [conversationListRef.current]);

  return (
    <div className="overflow-y-auto flex-1">
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
          Conversation Model: {conversation.model?.id}
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
      <div ref={conversationListRef}>
        <div
          className={`flex flex-col 
          ${settings?.minimalUI ? "pb-20" : "pb-24"}
        `}
        >
          {conversation.messages
            .filter(
              (message: ChatMessage) =>
                debug || (message.role !== Role.system && message.content)
            )
            .map((message: ChatMessage, index: number) => {
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
                          {t?.chat?.you ?? "You"}
                        </>
                      ) : (
                        <>
                          <Icon icon="box" className="w-6 h-6 mr-2" />
                          {/* {t?.chat?.ai ?? "ChatGPT"} */}
                          {modelFriendlyName ?? "ChatGPT"}
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
                                editingMessageRef.current?.value ?? "";

                              backendMessenger.sendAddFreeTextQuestion({
                                conversation,
                                question: newQuestion,
                                includeEditorSelection: false,
                                questionId: message.id,
                                // get message that comes after this one
                                // Note - "2" is used here because the system message at [0] is removed before this map() function is called
                                messageId:
                                  conversation.messages[index + 2]?.id ?? "",
                                code: message?.questionCode ?? "",
                              });

                              dispatch(
                                updateMessageContent({
                                  conversationId: conversation.id,
                                  messageId: message.id,
                                  content: newQuestion ?? message.content,
                                  rawContent: newQuestion ?? message.rawContent,
                                  done: true,
                                })
                              );

                              setEditingMessageID("");
                            }}
                          >
                            <Icon icon="send" className="w-3 h-3 mr-1" />
                            {t?.chat?.send ?? "Send"}
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
                            {t?.chat?.cancel ?? "Cancel"}
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
                  {message.isError ? (
                    <div className="text p-4 bg-red-700 rounded bg-opacity-10">
                      {(message.content ?? message.rawContent)
                        .split("\n")
                        .map((line: string, index: number) => (
                          <p className="py-1" key={index}>
                            {line}
                          </p>
                        ))}
                      {message.rawContent.includes("Premature close") &&
                        settings?.gpt3.apiBaseUrl.includes(
                          "localhost:5000"
                        ) && (
                          <p className="py-1 text-xs">
                            It looks like you're running{" "}
                            <code className="text-xs">
                              text-generation-webui
                            </code>
                            . If you're getting "Premature close" errors, you
                            may be forgetting to load a model in the webui
                            before trying to use the API. To do that, go to{" "}
                            <a href="http://127.0.0.1:7860">
                              http://127.0.0.1:7860
                            </a>{" "}
                            &gt; Model.
                          </p>
                        )}
                    </div>
                  ) : (
                    <div>
                      {message.id === editingMessageID ? (
                        // show textarea to edit message
                        <div className="flex flex-col gap-y-2">
                          <textarea
                            className="w-full h-24 resize-none bg-input rounded p-2"
                            defaultValue={
                              message.role === Role.user
                                ? message.rawContent
                                : message.content
                            }
                            ref={editingMessageRef}
                          />
                        </div>
                      ) : (
                        <div
                          className={`message-wrapper
                          ${message?.done ?? true ? "" : "result-streaming"}
                        `}
                        >
                          {(message.role === Role.user
                            ? message.rawContent
                            : message.content
                          )
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
                                  return message.role !== Role.user ? (
                                    <div
                                      key={index}
                                      dangerouslySetInnerHTML={{ __html: item }}
                                    />
                                  ) : (
                                    <div key={index}>{item}</div>
                                  );
                                }
                              }
                            )}
                          {message.questionCode && (
                            <CodeBlock
                              code={message.questionCode}
                              conversationId={conversation.id}
                              vscode={vscode}
                              startCollapsed={
                                message.questionCode.split("\n").length > 3
                              }
                              role={Role.user}
                            />
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
                  )}
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
    </div>
  );
}
