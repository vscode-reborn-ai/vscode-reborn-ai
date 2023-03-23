import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import Tabs from "./components/Tabs";
// import { Author, Conversation, Message } from "./renderer-types";
import { Conversation, Message, Model, Role } from "../types";
import { addMessage, unEscapeHTML, updateMessage } from "./utils";
import Chat from "./views/chat";

export default function Layout({
  vscode,
  debug,
}: {
  vscode: any;
  debug: boolean;
}) {
  const initialConversation = {
    id: `Chat-${Date.now()}`,
    title: "Chat",
    messages: [],
    createdAt: Date.now(),
    inProgress: false,
    model: Model.gpt_35_turbo,
  } as Conversation;

  const [conversationList, setConversationList] = useState<Conversation[]>([
    initialConversation,
  ]);
  const [currentConversation, setCurrentConversation] =
    useState(initialConversation);

  // Handle messages sent from the extension to the webview
  const handleMessages = (event: any) => {
    const message = event.data;

    console.log("Renderer - Received message from main process: ", message);

    const conversation =
      conversationList.find(
        (conversation) => conversation.id === message.conversationId
      ) ?? currentConversation;

    switch (message.type) {
      case "showInProgress":
        const updatedConversationList = conversationList.map((c) =>
          c.id === conversation.id
            ? {
                ...conversation,
                inProgress: message.inProgress,
              }
            : c
        );

        setConversationList(updatedConversationList);
        break;
      case "addQuestion":
        const question = {
          id:
            message.id ??
            `${conversation.messages.length}-${Math.floor(
              Math.random() * 1000
            )}`,
          role: Role.user,
          content: message.value,
          createdAt: Date.now(),
        } as Message;

        addMessage(question, conversation, setConversationList);

        break;
      case "addResponse":
        if (message.value === "") {
          return;
        }

        console.log("Renderer - Adding response: ", message);

        let existingMessage =
          message.id && conversation.messages.find((m) => m.id === message.id);
        let updatedValue = "";

        if (!message.responseInMarkdown) {
          updatedValue = "```\r\n" + unEscapeHTML(message.value) + " \r\n ```";
        } else {
          updatedValue =
            message.value.split("```").length % 2 === 1
              ? message.value
              : message.value + "\n\n```\n\n";
        }

        const markedResponse = (window as any)?.marked.parse(updatedValue);
        let botResponse: Message;

        if (existingMessage) {
          console.log("Updating existing message");
          // get the message from the conversation with the matching id
          botResponse =
            conversation.messages.find((m) => m.id === message.id) ??
            ({
              id: message.id,
              role: Role.assistant,
              content: markedResponse,
              createdAt: Date.now(),
            } as Message);

          if (botResponse) {
            botResponse.content = markedResponse;
            botResponse.updatedAt = Date.now();

            updateMessage(botResponse, conversation, setConversationList);
          } else {
            console.error(
              `Could not find message with id ${message.id} in conversation.`
            );
          }
        } else {
          botResponse = {
            id: message.id,
            role: Role.assistant,
            content: markedResponse,
            createdAt: Date.now(),
            // Check if message.done exists, only streaming if .done exists and is false
            done: message?.done ?? true,
          } as Message;

          addMessage(botResponse, conversation, setConversationList);
        }

        if (message.done) {
          updateMessage(
            {
              ...botResponse,
              done: true,
            } as Message,
            conversation,
            setConversationList
          );
        }

        break;
      case "addError":
        const messageValue =
          message.value ||
          "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to an OpenAI outage. Take a look at https://status.openai.com to see if there's an OpenAI outage.";

        const errorMessage = {
          id: message.id,
          role: Role.assistant,
          content: messageValue,
          createdAt: Date.now(),
          isError: true,
        } as Message;

        addMessage(errorMessage, conversation, setConversationList);
        break;
      default:
        console.log('Renderer - Uncaught message type: "' + message.type + '"');
    }
  };

  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname.startsWith("/chat/")) {
      setCurrentConversation(
        conversationList.find(
          (conversation) =>
            location.pathname === `/chat/${encodeURI(conversation.id)}`
        ) ?? initialConversation
      );
    }
  }, [location.pathname]);

  // Only add the event listener once
  useEffect(() => {
    // Remove in case it's already added, re-adding the event listener will cause the handler to be called twice
    window.removeEventListener("message", handleMessages);

    console.log("Renderer - Adding message event listener");
    window.addEventListener("message", handleMessages);

    return () => {
      // unmount cleanup function
      window.removeEventListener("message", handleMessages);
    };
  }, [conversationList, currentConversation]); // These are important or the handler uses outdated state data

  return (
    <>
      <Tabs
        vscode={vscode}
        conversationList={conversationList}
        setConversationList={setConversationList}
        currentConversation={currentConversation}
      />
      <Routes>
        {/* <Route path="/prompts" element={<Prompts vscode={vscode} />} /> */}
        {/* <Route path="/actions" element={<Actions vscode={vscode} />} /> */}
        {conversationList.map((conversation) => (
          <Route
            key={conversation.id}
            path={`/chat/${conversation.id}`}
            index={conversation.id === initialConversation.id}
            element={
              <Chat
                vscode={vscode}
                conversation={conversation}
                setConversationList={setConversationList}
                debug={debug}
              />
            }
          />
        ))}
        <Route
          path="/"
          element={
            <Navigate to={`/chat/${initialConversation.id}`} replace={true} />
          }
        />
        {/* <Route path="/options" element={<Options vscode={vscode} />} /> */}
      </Routes>
    </>
  );
}
