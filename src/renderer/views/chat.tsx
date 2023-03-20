import React, { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import Icon from "../components/Icon";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";

enum Author {
  user = "user",
  bot = "bot",
}

interface Message {
  id?: string;
  author: Author;
  text: string;
  date?: string;
  isError?: boolean;
  isStreaming?: boolean;
}

interface Conversation {
  id?: string;
  messages: Message[];
  title?: string;
  datetime?: string;
}

export default function Chat({
  postMessage,
}: {
  postMessage: (type: string, value?: any, language?: string) => void;
}) {
  const [showConversationList, setShowConversationList] = useState(false);
  const questionInputRef = React.createRef<HTMLTextAreaElement>();
  const [inProgress, setInProgress] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const initialConversation = {
    id: "",
    messages,
  } as Conversation;
  const [conversationList, setConversationList] = useState<Conversation[]>([
    initialConversation,
  ]);
  const [conversation, setConversation] =
    useState<Conversation>(initialConversation);

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
  }, [messages]);

  const addMessage = (message: Message) => {
    const messageExists = messages.find((m) => m.id === message.id);

    if (messageExists) {
      updateMessage(message);
    } else {
      setMessages((prev) => [...prev, message]);
    }
  };

  const updateMessage = (message: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
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

      postMessage("openNew", markdown, "markdown");
    }
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;

    console.log("Renderer - Received message from main process: ", message);

    switch (message.type) {
      case "showInProgress":
        setInProgress(message.inProgress);
        break;
      case "addQuestion":
        const question = {
          id:
            message.id ??
            `${messages.length}-${Math.floor(Math.random() * 1000)}`,
          author: Author.user,
          text: message.value,
          datetime: Date.now(),
        } as Message;

        addMessage(question);

        debugger;
        break;
      case "addResponse":
        if (message.value === "") {
          return;
        }

        let existingMessage =
          message.id && messages.find((m) => m.id === message.id);
        let updatedValue = "";

        if (!message.responseInMarkdown) {
          updatedValue = "```\r\n" + message.value + " \r\n ```";
        } else {
          updatedValue =
            message.value.split("```").length % 2 === 1
              ? message.value
              : message.value + "\n\n```\n\n";
        }

        const markedResponse = (window as any)?.marked.parse(updatedValue);
        let botResponse: Message;

        debugger;

        if (existingMessage) {
          // get the message from the conversation with the matching id
          botResponse =
            messages.find((m) => m.id === message.id) ??
            ({
              id: message.id,
              author: Author.bot,
              text: markedResponse,
              datetime: Date.now(),
            } as Message);

          if (botResponse) {
            botResponse.text = markedResponse;

            updateMessage(botResponse);
          } else {
            console.error(
              `Could not find message with id ${message.id} in conversation.`
            );
          }
        } else {
          botResponse = {
            id: message.id,
            author: Author.bot,
            text: markedResponse,
            datetime: Date.now(),
            // Check if message.done exists, only streaming if .done exists and is false
            isStreaming: message.done === undefined ? false : !message.done,
          } as Message;

          addMessage(botResponse);
        }

        if (message.done) {
          // const preCodeList = list.lastChild.querySelectorAll("pre > code");
          // preCodeList.forEach
          // TODO: Add codeBlockActions to the code blocks

          updateMessage({
            ...botResponse,
            isStreaming: false,
          });
        }

        break;
      case "addError":
        const messageValue =
          message.value ||
          "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to an OpenAI outage. Take a look at https://status.openai.com to see if there's an OpenAI outage.";

        const errorMessage = {
          id: message.id,
          author: Author.bot,
          text: messageValue,
          datetime: Date.now(),
          isError: true,
        } as Message;

        addMessage(errorMessage);

        // list.innerHTML += `<div class="p-4 self-end mt-4 pb-8 error-element-ext">
        //                 <h2 class="mb-5 flex">${aiSvg}ChatGPT</h2>
        //                 <div class="text-red-400">${marked.parse(
        //                   messageValue
        //                 )}</div>
        //             </div>`;
        break;
      case "clearConversation":
        postMessage("clearConversation");
        break;
      case "exportConversation":
        exportConversation();
        break;
      default:
        console.log('Renderer - Uncaught message type: "' + message.type + '"');
    }
  });

  return (
    <>
      {/* Introduction */}
      <IntroductionSplash
        className={messages?.length > 0 ? "hidden" : ""}
        postMessage={postMessage}
      />
      {/* Conversation messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((message: any, index: number) => {
            return (
              <div
                className="w-full p-4 self-end mt-4 question-element-ext relative input-background"
                key={index}
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
                  className={`overflow-y-auto
                    ${message.isError ? "text-red-400" : ""}
                    ${message.isStreaming ? "result-streaming" : ""}
                  `}
                >
                  {(window as any)?.marked.parse(message.text) ?? message.text}
                </div>
              </div>
            );
          })}
          <Tooltip id="message-tooltip" />
        </div>
      </div>
      {/* AI Response In Progress */}
      {inProgress && (
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
      <QuestionInputField
        inProgress={inProgress}
        questionInputRef={questionInputRef}
        postMessage={postMessage}
      />
    </>
  );
}
