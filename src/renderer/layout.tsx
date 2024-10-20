import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import Tabs from "./components/Tabs";
import { useAppDispatch, useAppSelector } from "./hooks";
import { useBackendMessageHandler } from "./message-handler";
import { useMessenger } from "./send-to-backend";
import { RootState } from "./store";
import { ApiKeyStatus, setVSCode } from "./store/app";
import { setCurrentConversationId } from "./store/conversation";
import { Conversation } from "./types";
import ActionsView from "./views/actions";
import APIView from "./views/api";
import ChatView from "./views/chat";
import OpenAISetup from "./views/openai-setup";

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
  const viewOptions = useAppSelector(
    (state: RootState) => state.app.viewOptions
  );
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app?.apiKeyStatus
  );
  const chatGPTModels = useAppSelector((state: RootState) => state.app.models);
  const useEditorSelection = useAppSelector(
    (state: any) => state.app.useEditorSelection
  );
  const backendMessenger = useMessenger(vscode);
  const backendMessageHandler = useBackendMessageHandler(backendMessenger);
  // Ensure the handler doesn't change unless necessary
  const memoizedBackendMessageHandler = useCallback(backendMessageHandler, [
    backendMessageHandler,
  ]);
  const sync = useAppSelector((state: RootState) => state.app.sync);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    // Ask for the extension settings
    if (Object.keys(settings).length === 0) {
      backendMessenger.sendGetSettings();
    }
    // Ask for the view options
    backendMessenger.sendGetViewOptions();
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
        console.error("[Reborn AI] Error serializing vscode object", e);
      }
    }
  }, [vscode]);

  // Send updates on view options to the backend
  useEffect(() => {
    // Only run after the initial sync
    if (sync.receivedViewOptions) {
      backendMessenger.sendSetViewOptions(viewOptions);
    }
  }, [viewOptions, sync.receivedViewOptions]);

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

  useEffect(() => {
    // Remove in case it's already added, re-adding the event listener will cause the handler to be called twice
    window.removeEventListener("message", memoizedBackendMessageHandler);
    window.addEventListener("message", memoizedBackendMessageHandler);

    return () => {
      // unmount cleanup function
      window.removeEventListener("message", memoizedBackendMessageHandler);
    };
  }, [memoizedBackendMessageHandler]);

  // if api key status is "invalid" and the api url includes openai.com, and the path is not /api, redirect to /openai-setup
  useEffect(() => {
    if (
      settings?.gpt3.apiBaseUrl.toLowerCase().includes("openai.com") &&
      apiKeyStatus !== ApiKeyStatus.Unknown &&
      apiKeyStatus !== ApiKeyStatus.Pending &&
      apiKeyStatus !== ApiKeyStatus.Valid &&
      location.pathname !== "/api"
    ) {
      navigate("/openai-setup");
    }
  }, [apiKeyStatus]);

  // Keep the backend's conversation list in sync with the frontend's
  useEffect(() => {
    backendMessenger.sendConversationList(
      conversationList,
      currentConversation
    );
  }, [conversationList]);

  return (
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
        <Route path="/openai-setup" element={<OpenAISetup vscode={vscode} />} />
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
  );
}
