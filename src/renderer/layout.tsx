import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import { v4 as uuidv4 } from "uuid";
import "../../styles/main.css";
import ApiKeySetup from "./components/ApiKeySetup";
import Tabs from "./components/Tabs";
import { useAppDispatch, useAppSelector } from "./hooks";
import { ActionRunState, setActionError, setActionState } from "./store/action";
import {
  ApiKeyStatus,
  setApiKeyStatus,
  setChatGPTModels,
  setExtensionSettings,
  setTranslations,
} from "./store/app";
import {
  addMessage,
  setAutoscroll,
  setCurrentConversationId,
  setInProgress,
  setModel,
  setVerbosity,
  updateConversationMessages,
  updateConversationTokenCount,
  updateMessage,
  updateMessageContent,
} from "./store/conversation";
import { Conversation, Message, Model, Role } from "./types";
import { unEscapeHTML } from "./utils";
import Actions from "./views/actions";
import Chat from "./views/chat";

export default function Layout({ vscode }: { vscode: any }) {
  const dispatch = useAppDispatch();
  const currentConversationId = useAppSelector(
    (state: any) => state.conversation.currentConversationId
  );
  const currentConversation = useAppSelector(
    (state: any) => state.conversation.currentConversation
  );
  const conversationList = Object.values(
    useAppSelector((state: any) => state.conversation.conversations)
  ) as Conversation[];

  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const debug = useAppSelector((state: any) => state.app.debug);
  const apiKeyStatus = useAppSelector((state: any) => state.app?.apiKeyStatus);
  const chatGPTModels = useAppSelector((state: any) => state.app.chatGPTModels);
  const useEditorSelection = useAppSelector(
    (state: any) => state.app.useEditorSelection
  );

  useLayoutEffect(() => {
    // Ask for the extension settings
    if (Object.keys(settings).length === 0) {
      vscode.postMessage({
        type: "getSettings",
      });
    }
    // Ask for ChatGPT models
    if (chatGPTModels.length === 0) {
      vscode.postMessage({
        type: "getChatGPTModels",
      });
    }
    if (apiKeyStatus === ApiKeyStatus.Unknown) {
      // Ask for the API key status
      vscode.postMessage({
        type: "getApiKeyStatus",
      });
    }
  }, []);

  useEffect(() => {
    // When the current conversation changes, send a message to the extension to let it know
    vscode.postMessage({
      type: "setCurrentConversation",
      conversation: currentConversation,
    });
  }, [currentConversationId]);

  // Debounce token count updates
  const debounceTimeout = useRef<any>(null);
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      // Get new token count
      vscode.postMessage({
        type: "getTokenCount",
        conversation: currentConversation,
        useEditorSelection,
      });
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

  // Handle messages sent from the extension to the webview
  const handleMessages = (event: any) => {
    // TODO: Split this into separate interfaces
    const data = event.data as {
      type: string;
      value?: any;
      id?: string;
      messages?: Message[];
      messageId?: string;
      message?: Message;
      tokenCount?: {
        messages: number;
        userInput: number;
        maxTotal: number;
        minTotal: number;
      };
      // For questions
      code?: string;
      editorLanguage?: string;
      // Streaming
      done?: boolean;
      content?: string;
      // In the case of the showInProgress event
      inProgress?: boolean;
      conversationId?: string;
      responseInMarkdown?: boolean;
      // Actions
      error?: string;
      actionId?: string;
    };

    // Handle requests from editor
    if (data.conversationId === "") {
      data.conversationId = currentConversationId;
      // if the request is from the editor, turn on auto-scroll
      // only run if the conversation is not already in progress
      if (
        !conversationList.find(
          (conversation) => conversation.id === data.conversationId
        )?.inProgress
      ) {
        dispatch(
          setAutoscroll({
            conversationId: data?.conversationId ?? currentConversationId,
            autoscroll: true,
          })
        );
      }
    }

    if (debug) {
      console.log("Renderer - Received message from main process: ", data);
    }

    switch (data.type) {
      case "showInProgress":
        if (debug) {
          console.log("in progress: ", data.inProgress);
        }

        dispatch(
          setInProgress({
            conversationId: data?.conversationId ?? currentConversationId,
            inProgress: data?.inProgress ?? true,
          })
        );
        break;
      case "addQuestion":
        const question = {
          id: uuidv4(),
          role: Role.user,
          content: data.value,
          createdAt: Date.now(),
          done: true,
          questionCode: data?.code
            ? (window as any)?.marked.parse(
                `\`\`\`${data?.editorLanguage}\n${data.code}\n\`\`\``
              )
            : "",
        } as Message;

        dispatch(
          addMessage({
            conversationId: data?.conversationId ?? currentConversationId,
            message: question,
          })
        );

        break;
      // Update a single message
      case "updateMessage":
        if (data?.message) {
          dispatch(
            updateMessage({
              conversationId: data?.conversationId ?? currentConversationId,
              messageId: data?.message?.id ?? "",
              message: data?.message,
            })
          );
        } else {
          console.error("updateMessage event: No message provided");
        }

        break;
      // Update all messages in a conversation
      case "messagesUpdated":
        dispatch(
          updateConversationMessages({
            conversationId: data?.conversationId ?? currentConversationId,
            messages: data.messages ?? [],
          })
        );

        break;
      case "addMessage":
        if (data?.message) {
          dispatch(
            addMessage({
              conversationId: data?.conversationId ?? currentConversationId,
              message: data.message,
            })
          );
        } else {
          console.error("addMessage event: No message to add");
        }

        break;
      case "streamMessage":
        dispatch(
          updateMessageContent({
            conversationId: data?.conversationId ?? currentConversationId,
            messageId: data?.messageId ?? "",
            content: data?.content ?? "",
            done: false,
          })
        );

        break;
      case "addResponse":
        if (data.value === "") {
          return;
        }

        if (debug) {
          console.log("Renderer - Adding response: ", data);
        }

        let existingMessage =
          (data.id &&
            conversationList
              .find((conversation) => conversation.id === currentConversationId)
              ?.messages.find((message) => message.id === data.id)) ??
          null;

        const markedResponse = (window as any)?.marked.parse(
          !data.responseInMarkdown
            ? "```\r\n" + unEscapeHTML(data.value) + " \r\n ```"
            : (data?.value ?? "").split("```").length % 2 === 1
            ? data.value
            : data.value + "\n\n```\n\n"
        );

        if (existingMessage) {
          if (data.id) {
            dispatch(
              updateMessageContent({
                conversationId: data?.conversationId ?? currentConversationId,
                messageId: data.id,
                content: markedResponse,
                rawContent: data.value,
                done: data.done === undefined ? true : data.done,
              })
            );
          } else {
            console.warn(
              "Renderer - Cannot updated message - No message id found"
            );

            // Attempt graceful fallback -
            // Try adding a new message to the current conversation
            const botResponse = {
              id: uuidv4(),
              role: Role.assistant,
              content: markedResponse,
              rawContent: data.value,
              createdAt: Date.now(),
              // Check if message.done exists, only streaming if .done exists and is false
              done: data.done === undefined ? true : data.done,
            } as Message;

            dispatch(
              addMessage({
                conversationId: data?.conversationId ?? currentConversationId,
                message: botResponse,
              })
            );
          }
        } else {
          const botResponse = {
            id: data.id,
            role: Role.assistant,
            content: markedResponse,
            rawContent: data.value,
            createdAt: Date.now(),
            // Check if message.done exists, only streaming if .done exists and is false
            done: data.done === undefined ? true : data.done,
          } as Message;

          if (debug) {
            console.log(
              "dispatching addMessage with botResponse: ",
              botResponse,
              "\nconversationId: ",
              data?.conversationId
            );
          }

          dispatch(
            addMessage({
              conversationId: data?.conversationId ?? currentConversationId,
              message: botResponse,
            })
          );
        }
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

        dispatch(
          addMessage({
            conversationId: data?.conversationId ?? currentConversationId,
            message: errorMessage,
          })
        );
        break;
      case "settingsUpdate":
        if (debug) {
          console.log("Renderer - Settings update: ", data.value);
        }

        dispatch(setExtensionSettings({ newSettings: data.value }));

        const currentConversation = conversationList.find(
          (conversation) => conversation.id === currentConversationId
        );

        // if the current conversation verbosity and model haven't been set yet, set them based on the settings
        if (!currentConversation?.model || !currentConversation?.verbosity) {
          dispatch(
            setModel({
              conversationId: currentConversationId,
              model: data.value.gpt3?.model,
            })
          );
          dispatch(
            setVerbosity({
              conversationId: currentConversationId,
              verbosity: data.value.verbosity,
            })
          );
        }
        break;
      case "chatGPTModels":
        if (debug) {
          console.log("Renderer - ChatGPT models: ", data.value);
        }

        //  convert model object array from OpenAI to array of Model objects
        if (data?.value?.map) {
          dispatch(
            setChatGPTModels({
              models: data?.value as Model[],
            })
          );
        } else {
          console.error(
            "Renderer - Could not get ChatGPT models, data.value is not an array"
          );
        }
        break;
      case "updateApiKeyStatus":
        let keyStatus: ApiKeyStatus;

        if (data.value) {
          keyStatus = ApiKeyStatus.Valid;
        } else if (apiKeyStatus === ApiKeyStatus.Unknown) {
          keyStatus = ApiKeyStatus.Unset;
        } else if (apiKeyStatus === ApiKeyStatus.Pending) {
          keyStatus = ApiKeyStatus.Invalid;
        } else if (apiKeyStatus === ApiKeyStatus.Valid) {
          keyStatus = ApiKeyStatus.Unset;
        } else {
          keyStatus = apiKeyStatus;
        }

        if (debug) {
          console.log("Renderer - API key status:", keyStatus);
        }

        dispatch(setApiKeyStatus(keyStatus));
        break;
      case "tokenCount":
        if (debug) {
          console.log("Renderer - Conversation token count:", data.tokenCount);
        }

        dispatch(
          updateConversationTokenCount({
            conversationId: data.conversationId ?? currentConversationId,
            tokenCount: data.tokenCount ?? {
              messages: 0,
              userInput: 0,
              maxTotal: 0,
              minTotal: 0,
            },
          })
        );
      case "setTranslations":
        if (debug) {
          console.log("Renderer - Translations:", data.value);
        }

        if (data?.value) {
          dispatch(setTranslations(JSON.parse(data.value)));
        }
        break;
      case "actionComplete":
        if (data?.actionId) {
          dispatch(
            setActionState({
              actionId: data?.actionId,
              state: ActionRunState.idle,
            })
          );
        }
        break;
      case "actionError":
        const actionId = data?.actionId;
        const actionError = data?.error;

        if (debug) {
          console.log("Renderer - Action error:", actionError);
        }

        if (actionId && actionError) {
          dispatch(setActionError({ error: actionError, actionId }));
        }

        break;
      default:
        console.error('Renderer - Uncaught message type: "' + data.type + '"');
    }
  };

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
    window.removeEventListener("message", handleMessages);
    window.addEventListener("message", handleMessages);

    return () => {
      // unmount cleanup function
      window.removeEventListener("message", handleMessages);
    };
  }, [conversationList, currentConversationId]); // These are important or the handler uses outdated state data

  return (
    <>
      {apiKeyStatus === ApiKeyStatus.Unknown ||
      apiKeyStatus === ApiKeyStatus.Valid ? (
        <>
          {!settings?.minimalUI && !settings?.disableMultipleConversations && (
            <Tabs
              conversationList={conversationList}
              currentConversationId={currentConversationId}
            />
          )}
          <Routes>
            {/* <Route path="/prompts" element={<Prompts vscode={vscode} />} /> */}
            <Route path="/actions" element={<Actions vscode={vscode} />} />
            {conversationList &&
              conversationList.map &&
              conversationList.map((conversation: Conversation) => (
                <Route
                  key={conversation.id}
                  path={`/chat/${conversation.id}`}
                  index={conversation.id === currentConversationId}
                  element={
                    <Chat
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
      ) : (
        <ApiKeySetup vscode={vscode} />
      )}
    </>
  );
}
