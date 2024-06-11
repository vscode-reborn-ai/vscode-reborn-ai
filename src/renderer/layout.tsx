import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import ApiKeySetup from "./components/ApiKeySetup";
import Tabs from "./components/Tabs";
import { useAppDispatch, useAppSelector } from "./hooks";
import { useBackendMessageHandler } from "./message-handler";
import { useMessenger } from "./sent-to-backend";
import { RootState } from "./store";
import { ApiKeyStatus, setVSCode } from "./store/app";
import { setCurrentConversationId } from "./store/conversation";
import { Conversation } from "./types";
import ActionsView from "./views/actions";
import APIView from "./views/api";
import ChatView from "./views/chat";

export default function Layout({ vscode }: { vscode: any }) {
  const dispatch = useAppDispatch();
  const currentConversationId = useAppSelector(
    (state: any) => state.conversation.currentConversationId
  );
  const currentConversation = useAppSelector(
    (state: any) => state.conversation.currentConversation
  );
  const conversationList = Object.values(
    useAppSelector((state: RootState) => state.conversation.conversations)
  ) as Conversation[];

  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app?.apiKeyStatus
  );
  const chatGPTModels = useAppSelector((state: RootState) => state.app.models);
  const useEditorSelection = useAppSelector(
    (state: any) => state.app.useEditorSelection
  );
  const backendMessenger = useMessenger(vscode);
  const backendMessageHandler = useBackendMessageHandler(backendMessenger);

  useLayoutEffect(() => {
    // Ask for the extension settings
    if (Object.keys(settings).length === 0) {
      backendMessenger.sendGetSettings();
    }
    // Ask for ChatGPT models
    if (chatGPTModels.length === 0) {
      backendMessenger.sendGetModels();
    }
    if (apiKeyStatus === ApiKeyStatus.Unknown) {
      // Ask for the API key status
      backendMessenger.sendGetApiKeyStatus();
    }
  }, []);

  useEffect(() => {
    if (vscode) {
      try {
        // check if serializeable
        const serialized = JSON.stringify(vscode);
        dispatch(setVSCode(serialized));
      } catch (e) {
        console.error("Error serializing vscode object", e);
      }
    }
  }, [vscode]);

  useEffect(() => {
    // When the current conversation changes, send a message to the extension to let it know
    backendMessenger.sendSetCurrentConversation(currentConversation);
  }, [currentConversationId]);

  // Debounce token count updates
  const debounceTimeout = useRef<any>(null);
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      // Get new token count
      backendMessenger.sendGetTokenCount(
        currentConversation,
        useEditorSelection
      );
    }, 500); // Debounce delay in milliseconds

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [
    currentConversation.userInput,
    currentConversation.messages,
    currentConversation.model,
    useEditorSelection,
  ]);

  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname.startsWith("/chat/") && conversationList?.find) {
      dispatch(
        setCurrentConversationId({
          conversationId:
            conversationList?.find(
              (conversation: Conversation) =>
                location.pathname === `/chat/${encodeURI(conversation.id)}`
            )?.id ?? conversationList[0]?.id,
        })
      );
    }
  }, [location.pathname]);

  // Only add the event listener once
  useEffect(() => {
    // Remove in case it's already added, re-adding the event listener will cause the handler to be called twice
    window.removeEventListener("message", backendMessageHandler);
    window.addEventListener("message", backendMessageHandler);

    return () => {
      // unmount cleanup function
      window.removeEventListener("message", backendMessageHandler);
    };
  }, [conversationList, currentConversationId]); // These are important or the handler uses outdated state data

  return (
    <>
      {settings?.gpt3.apiBaseUrl.includes("openai.com") &&
      apiKeyStatus !== ApiKeyStatus.Unknown &&
      apiKeyStatus !== ApiKeyStatus.Valid &&
      location.pathname !== "/api" ? (
        <ApiKeySetup vscode={vscode} />
      ) : (
        <>
          {!settings?.minimalUI && !settings?.disableMultipleConversations && (
            <Tabs
              conversationList={conversationList}
              currentConversationId={currentConversationId}
            />
          )}
          <Routes>
            {/* <Route path="/prompts" element={<Prompts vscode={vscode} />} /> */}
            <Route path="/actions" element={<ActionsView vscode={vscode} />} />
            <Route path="/api" element={<APIView vscode={vscode} />} />
            {conversationList &&
              conversationList.map &&
              conversationList.map((conversation: Conversation) => (
                <Route
                  key={conversation.id}
                  path={`/chat/${conversation.id}`}
                  index={conversation.id === currentConversationId}
                  element={
                    <ChatView
                      conversation={conversation}
                      vscode={vscode}
                      conversationList={conversationList}
                    />
                  }
                />
              ))}
            <Route
              path="/"
              element={
                <Navigate
                  to={`/chat/${conversationList[0]?.id ?? "chat"}`}
                  replace={true}
                />
              }
            />
            {/* <Route path="/options" element={<Options vscode={vscode} />} /> */}
          </Routes>
        </>
      )}
    </>
  );
}
