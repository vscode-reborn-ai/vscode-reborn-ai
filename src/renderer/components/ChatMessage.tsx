import classNames from "classnames";
import React, { useRef } from "react";
import { useModelFriendlyName } from "../helpers";
import { useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { ChatMessage, Conversation, Role } from "../types";
import CodeBlock from "./CodeBlock";
import Icon from "./Icon";

// Error message component.
const ErrorMessageComponent = ({ message }: { message: ChatMessage }) => {
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );

  return (
    <div className="text p-4 bg-red-700 rounded bg-opacity-10">
      {(message.content ?? message.rawContent)
        .split("\n")
        .map((line: string, index: number) => (
          <p className="py-1" key={index}>
            {line}
          </p>
        ))}
      {message.rawContent.includes("Premature close") &&
        settings?.gpt3.apiBaseUrl.includes("localhost:5000") && (
          <p className="py-1 text-xs">
            It looks like you're running{" "}
            <code className="text-xs">text-generation-webui</code>. If you're
            getting "Premature close" errors, you may be forgetting to load a
            model in the webui before trying to use the API. To do that, go to{" "}
            <a href="http://127.0.0.1:7860">http://127.0.0.1:7860</a> &gt;
            Model.
          </p>
        )}
    </div>
  );
};

// Debug message component.
const DebugMessageComponent = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="text-xs text-gray-500">
      Message ID: {message?.id} <br />
      Message Author: {message?.role} <br />
      Message createdAt:{" "}
      {new Date(message?.createdAt ?? "").toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
      <br />
      Message done: {message?.done ? "true" : "false"}
      <br />
    </div>
  );
};

// Edit message textarea component.
const EditMessageComponent = ({
  message,
  editingMessageRef,
}: {
  message: ChatMessage;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
}) => {
  const hideName = useAppSelector(
    (state: RootState) => state.app.viewOptions.hideName
  );

  return (
    <div
      className={classNames("flex flex-col gap-y-2", {
        "max-w-[80%]": hideName,
      })}
    >
      <textarea
        className="w-full h-24 resize-none bg-input rounded p-2"
        defaultValue={
          message.role === Role.user ? message.rawContent : message.content
        }
        ref={editingMessageRef}
      />
    </div>
  );
};

// Message body content for user messages.
const UserMessageComponent = ({
  vscode,
  conversation,
  message,
  editingMessageID,
  editingMessageRef,
}: {
  vscode: any;
  conversation: Conversation;
  message: ChatMessage;
  editingMessageID: string | null;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
}) => {
  const showMarkdown = useAppSelector(
    (state: RootState) => state.app.viewOptions.showMarkdown
  );
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );

  return (
    <>
      {message.id === editingMessageID ? (
        <EditMessageComponent
          message={message}
          editingMessageRef={editingMessageRef}
        />
      ) : (
        <div
          className={classNames(
            "message-wrapper",
            message?.done ?? true ? "" : "result-streaming",
            {
              "max-w-[80%]": alignRight,
              "float-right": alignRight,
            }
          )}
        >
          {message.rawContent
            .replace(/\n/g, "<br/>")
            .split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
            .reduce((acc: any[], item: any) => {
              if (item) {
                acc.push(item);
              }
              return acc;
            }, [])
            .map((item: string, index: React.Key | null | undefined) => {
              if (item.startsWith("<pre><code") && !showMarkdown) {
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
                  <div key={index}>
                    {item
                      .replace(/<br\s*\/?>\n/gi, "<br>") // replace newlines next to <br> tags with just <br> tags (to avoid double newlines)
                      .split(/(?:\n|<br\s*\/?>)/gi) // split on newlines and <br> tags
                      .map((line: string, index: number) =>
                        showMarkdown ? (
                          <pre key={index} className="py-1 text-pretty">
                            {/* show markdown enabled -> render a preformatted block */}
                            {line}
                          </pre>
                        ) : (
                          <p key={index} className="my-0 text-pretty">
                            {/* if markdown view disabled -> render a paragraph */}
                            {line}
                          </p>
                        )
                      )}
                  </div>
                );
              }
            })}
          {message.questionCode && (
            <>
              {/* {showMarkdown ? (
                <div
                  className="bg-input rounded p-4"
                  dangerouslySetInnerHTML={{ __html: message.questionCode }}
                />
              ) : ( */}
              <CodeBlock
                code={message.questionCode}
                conversationId={conversation.id}
                vscode={vscode}
                startCollapsed={message.questionCode.split("\n").length > 3}
                role={Role.user}
              />
              {/* )} */}
            </>
          )}
        </div>
      )}
    </>
  );
};

// Message body content for bot messages.
const BotMessageComponent = ({
  vscode,
  conversation,
  message,
}: {
  vscode: any;
  conversation: Conversation;
  message: ChatMessage;
}) => {
  const showMarkdown = useAppSelector(
    (state: RootState) => state.app.viewOptions.showMarkdown
  );
  const codeOnly = useAppSelector(
    (state: RootState) => state.app.viewOptions.showCodeOnly
  );
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );

  return (
    <div
      className={classNames(
        "message-wrapper",
        message?.done ?? true ? "" : "result-streaming",
        {
          "max-w-[80%]": alignRight,
        }
      )}
    >
      {(showMarkdown
        ? message.rawContent.replace(/\n/g, "<br/>")
        : message.content
      )
        .split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
        .reduce((acc: any[], item: any) => {
          if (item) {
            acc.push(item);
          }
          return acc;
        }, [])
        .map((item: string, index: React.Key | null | undefined) => {
          if (item.startsWith("<pre><code") && !showMarkdown) {
            return (
              <CodeBlock
                code={item}
                key={index}
                conversationId={conversation.id}
                vscode={vscode}
              />
            );
          } else if (!codeOnly) {
            return showMarkdown ? (
              <div key={index}>
                {item
                  .replace(/<br\s*\/?>\n/gi, "<br>") // replace newlines next to <br> tags with just <br> tags (to avoid double newlines)
                  .split(/(?:\n|<br\s*\/?>)/gi) // split on newlines and <br> tags
                  .map((line: string, index: number) => (
                    <pre key={index} className="py-1 text-pretty">
                      {/* show markdown enabled -> render a preformatted block */}
                      {line}
                    </pre>
                  ))}
              </div>
            ) : (
              <div key={index} dangerouslySetInnerHTML={{ __html: item }} />
            );
          }
        })}
    </div>
  );
};

// Message body content component
const MessageBodyComponent = ({
  message,
  vscode,
  editingMessageID,
  conversation,
  editingMessageRef,
}: {
  message: ChatMessage;
  vscode: any;
  editingMessageID: string | null;
  conversation: Conversation;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
}) => {
  return (
    <>
      {message.role === Role.user ? (
        <UserMessageComponent
          vscode={vscode}
          conversation={conversation}
          message={message}
          editingMessageID={editingMessageID}
          editingMessageRef={editingMessageRef}
        />
      ) : (
        <BotMessageComponent
          vscode={vscode}
          conversation={conversation}
          message={message}
        />
      )}
    </>
  );
};

// Options / buttons at the top-right of each chat message.
const ChatMessageOptions = ({
  className,
  message,
  conversation,
  index,
  editingMessageID,
  setEditingMessageID,
  editingMessageRef,
  vscode,
}: {
  className?: string;
  message: ChatMessage;
  conversation: Conversation;
  index: number;
  editingMessageID: string | null;
  setEditingMessageID: (id: string) => void;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
  vscode: any;
}) => {
  const t = useAppSelector((state: RootState) => state.app.translations);
  const backendMessenger = useMessenger(vscode);

  const handleSendClick = () => {
    const newQuestion = editingMessageRef.current?.value ?? "";
    backendMessenger.sendAddFreeTextQuestion({
      conversation,
      question: newQuestion,
      includeEditorSelection: false,
      questionId: message.id,
      messageId: conversation.messages[index + 2]?.id ?? "",
      code: message?.questionCode ?? "",
    });
    setEditingMessageID("");
  };

  return (
    <div className={classNames("flex items-center", className)}>
      <div
        className={`send-cancel-elements-ext gap-2 ${
          editingMessageID === message.id ? "" : "hidden"
        }`}
      >
        <button
          className="send-element-ext p-1 pr-2 flex items-center"
          onClick={handleSendClick}
        >
          <Icon icon="send" className="w-3 h-3 mr-1" />
          {t?.chat?.send ?? "Send"}
        </button>
        <button
          className="cancel-element-ext p-1 pr-2 flex items-center"
          onClick={() => setEditingMessageID("")}
        >
          <Icon icon="cancel" className="w-3 h-3 mr-1" />
          {t?.chat?.cancel ?? "Cancel"}
        </button>
      </div>
      <button
        className={classNames("p-1.5 flex items-center rounded", {
          // Hide the pencil if current message is being edited
          hidden: editingMessageID === message.id,
        })}
        data-tooltip-id="message-tooltip"
        data-tooltip-content="Edit and resend this prompt"
        onClick={() => setEditingMessageID(message.id)}
      >
        <Icon icon="pencil" className="w-3 h-3" />
      </button>
    </div>
  );
};

const Name = ({
  message,
  modelFriendlyName,
}: {
  message: ChatMessage;
  modelFriendlyName?: string;
}) => {
  const t = useAppSelector((state: RootState) => state.app.translations);
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );

  return (
    <h2
      className={classNames("flex-grow flex items-center gap-2", {
        "flex-row-reverse": message.role === Role.user && alignRight,
      })}
    >
      {message.role === Role.user ? (
        <>
          <Icon icon="user" className="w-6 h-6" />
          <span>{t?.chat?.you ?? "You"}</span>
        </>
      ) : (
        <>
          <Icon icon="box" className="w-6 h-6" />
          <span>{modelFriendlyName ?? "ChatGPT"}</span>
        </>
      )}
    </h2>
  );
};

interface MessageComponentProps {
  message: ChatMessage;
  conversation: Conversation;
  index: number;
  vscode: any;
}

// Message wrapper component
const ChatMessageComponent: React.FC<MessageComponentProps> = ({
  message,
  conversation,
  index,
  vscode,
}) => {
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const [editingMessageID, setEditingMessageID] = React.useState<string | null>(
    null
  );
  const editingMessageRef = useRef<HTMLTextAreaElement>(null);
  const hideName = useAppSelector((state) => state.app.viewOptions.hideName);
  const networkLogs = useAppSelector(
    (state) => state.app.viewOptions.showNetworkLogs
  );
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );
  const models = useAppSelector((state: RootState) => state.app.models);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );

  const modelFriendlyName = useModelFriendlyName(
    conversation,
    models,
    settings
  );

  return (
    <div
      className={`group/chat-message w-full flex flex-col gap-y-4 p-4 self-end question-element-ext relative ${
        message.role === Role.user ? "bg-input" : "bg-sidebar"
      }`}
      key={message.id}
    >
      {hideName ? (
        <>
          {message.role === Role.user && (
            <ChatMessageOptions
              className="absolute top-0 right-2 invisible group-hover/chat-message:visible group-focus-within/chat-message:visible"
              message={message}
              conversation={conversation}
              index={index}
              editingMessageID={editingMessageID}
              setEditingMessageID={setEditingMessageID}
              editingMessageRef={editingMessageRef}
              vscode={vscode}
            />
          )}
        </>
      ) : (
        <header
          className={classNames("flex items-center gap-2", {
            "flex-row-reverse": message.role === Role.user && alignRight,
          })}
        >
          <Name message={message} modelFriendlyName={modelFriendlyName} />
          {message.role === Role.user && (
            <ChatMessageOptions
              className="invisible group-hover/chat-message:visible group-focus-within/chat-message:visible"
              message={message}
              conversation={conversation}
              index={index}
              editingMessageID={editingMessageID}
              setEditingMessageID={setEditingMessageID}
              editingMessageRef={editingMessageRef}
              vscode={vscode}
            />
          )}
        </header>
      )}
      {message.isError ? (
        <ErrorMessageComponent message={message} />
      ) : (
        <div>
          <MessageBodyComponent
            message={message}
            conversation={conversation}
            vscode={vscode}
            editingMessageID={editingMessageID}
            editingMessageRef={editingMessageRef}
          />
          {(debug || networkLogs) && (
            <DebugMessageComponent message={message} />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessageComponent;
