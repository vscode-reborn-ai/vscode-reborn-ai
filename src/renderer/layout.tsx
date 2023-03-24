import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import Tabs from "./components/Tabs";
// import { Author, Conversation, Message } from "./renderer-types";
import { Conversation, Message, Model, Role } from "./types";
import { addMessage, unEscapeHTML, updateMessage } from "./utils";
import Chat from "./views/chat";

export default function Layout({
  vscode,
  debug,
  setDebug,
}: {
  vscode: any;
  debug: boolean;
  setDebug: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const initialConversation = {
    id: `Chat-${Date.now()}`,
    title: "Chat",
    messages: [],
    createdAt: Date.now(),
    inProgress: false,
    model: Model.gpt_35_turbo,
    autoscroll: true,
  } as Conversation;

  const [conversationList, setConversationList] = useState<Conversation[]>([
    initialConversation,
  ]);
  const [currentConversation, setCurrentConversation] =
    useState(initialConversation);
  setCurrentConversation({
    ...currentConversation,
    setConversation: setCurrentConversation,
  });

  // Handle messages sent from the extension to the webview
  const handleMessages = (event: any) => {
    const data = event.data as {
      type: string;
      value?: string;
      id?: string;
      // In the case of the addResponse event
      done?: boolean;
      // In the case of the showInProgress event
      inProgress?: boolean;
      conversationId?: string;
      responseInMarkdown?: boolean;
    };

    console.log("Renderer - Received message from main process: ", data);

    const relevantConversation =
      conversationList.find(
        (conversation) => conversation.id === data.conversationId
      ) ?? currentConversation;

    switch (data.type) {
      case "showInProgress":
        console.log("in progress: ", data.inProgress);
        setConversationList((prev) => {
          return prev.map((conversation) => {
            if (conversation.id === relevantConversation.id) {
              const updatedConversation = {
                ...conversation,
                inProgress: data?.inProgress ?? true,
              };
              // Use the latest conversation object to avoid stale data
              const latestConversation = conversationList.find(
                (c) => c.id === conversation.id
              );
              if (latestConversation) {
                Object.assign(updatedConversation, latestConversation);
              }

              console.log(
                "showInProgress - updatedConversation: ",
                updatedConversation
              );

              return updatedConversation;
            }
            return conversation;
          });
        });

        break;
      case "addQuestion":
        const question = {
          id:
            data.id ??
            `${relevantConversation.messages.length}-${Math.floor(
              Math.random() * 1000
            )}`,
          role: Role.user,
          content: data.value,
          createdAt: Date.now(),
          done: true,
        } as Message;

        addMessage(question, relevantConversation.id, setConversationList);

        break;
      case "addResponse":
        if (data.value === "") {
          return;
        }

        console.log("Renderer - Adding response: ", data);

        let existingMessage =
          data.id &&
          relevantConversation.messages.find((m) => m.id === data.id);
        let updatedValue = "";

        if (!data.responseInMarkdown) {
          updatedValue = "```\r\n" + unEscapeHTML(data.value) + " \r\n ```";
        } else if (data.value) {
          updatedValue =
            data.value.split("```").length % 2 === 1
              ? data.value
              : data.value + "\n\n```\n\n";
        }

        const markedResponse = (window as any)?.marked.parse(updatedValue);
        let botResponse: Message;

        if (existingMessage) {
          console.log("Updating existing message");
          // get the message from the conversation with the matching id
          botResponse =
            relevantConversation.messages.find((m) => m.id === data.id) ??
            ({
              id: data.id,
              role: Role.assistant,
              content: markedResponse,
              createdAt: Date.now(),
            } as Message);

          if (botResponse) {
            botResponse.content = markedResponse;
            botResponse.updatedAt = Date.now();

            updateMessage(
              botResponse,
              relevantConversation.id,
              setConversationList
            );
          } else {
            console.error(
              `Could not find message with id ${data.id} in conversation.`
            );
          }
        } else {
          botResponse = {
            id: data.id,
            role: Role.assistant,
            content: markedResponse,
            createdAt: Date.now(),
            // Check if message.done exists, only streaming if .done exists and is false
            done: data?.done ?? true,
          } as Message;

          addMessage(botResponse, relevantConversation.id, setConversationList);
        }

        if (data.done) {
          updateMessage(
            {
              ...botResponse,
              done: true,
            } as Message,
            relevantConversation.id,
            setConversationList
          );
        }

        console.log(
          "Renderer - Added response: ",
          botResponse,
          "messages: ",
          relevantConversation.messages,
          "conversation: ",
          relevantConversation
        );

        break;
      case "addError":
        const messageValue =
          data.value ||
          "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to an OpenAI outage. Take a look at https://status.openai.com to see if there's an OpenAI outage.";

        const errorMessage = {
          id: data.id,
          role: Role.assistant,
          content: messageValue,
          createdAt: Date.now(),
          isError: true,
        } as Message;

        addMessage(errorMessage, relevantConversation.id, setConversationList);
        break;
      default:
        console.log('Renderer - Uncaught message type: "' + data.type + '"');
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
                setDebug={setDebug}
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
