import { v4 as uuidv4 } from "uuid";
import { useAppDispatch, useAppSelector } from "./hooks";
import { RootState } from "./store";
import { ActionRunState, setActionError, setActionState } from "./store/action";
import { ApiKeyStatus, setApiKeyStatus, setExtensionSettings, setModels, setTranslations } from "./store/app";
import { addMessage, setInProgress, setModel, setVerbosity, updateConversationMessages, updateConversationTitle, updateConversationTokenCount, updateMessage, updateMessageContent } from "./store/conversation";
import { ActionNames, ChatMessage, Conversation, Role } from "./types";
import { ActionCompleteMessage, ActionErrorMessage, AddErrorMessage, AddMessageMessage, BaseFrontendMessage, FrontendMessageType, MessagesUpdatedMessage, ModelsUpdateMessage, SetTranslationsMessage, SettingsUpdateMessage, ShowInProgressMessage, StreamMessageMessage, UpdateApiKeyStatusMessage, UpdateMessageMessage, UpdateTokenCountMessage } from "./types-messages";
import { useRenameTabTitleWithAI } from "./utils";

export const useBackendMessageHandler = (backendMessenger: any) => {
  const dispatch = useAppDispatch();
  const currentConversationId = useAppSelector(
    (state: any) => state.conversation.currentConversationId
  );
  // const currentConversation = useAppSelector(
  //   (state: any) => state.conversation.currentConversation
  // );
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
  // const chatGPTModels = useAppSelector(
  //   (state: RootState) => state.app.models
  // );
  // const useEditorSelection = useAppSelector(
  //   (state: any) => state.app.useEditorSelection
  // );
  const vscode = useAppSelector((state: RootState) => state.app.vscode);

  return (event: any) => {
    // Handle messages sent from the extension to the webview
    // TODO: Split this into separate interfaces
    // const data = event.data as {
    //   type: string;
    //   value?: any;
    //   id?: string;
    //   messages?: ChatMessage[];
    //   messageId?: string;
    //   message?: ChatMessage;
    //   tokenCount?: {
    //     messages: number;
    //     userInput: number;
    //     minTotal: number;
    //   };
    //   // For questions
    //   code?: string;
    //   editorLanguage?: string;
    //   // Streaming
    //   done?: boolean;
    //   content?: string;
    //   // In the case of the showInProgress event
    //   inProgress?: boolean;
    //   conversationId?: string;
    //   responseInMarkdown?: boolean;
    //   // Actions
    //   error?: string;
    //   actionId?: string;
    //   actionResult?: any;
    // };
    // Upcast to any of the possible message types
    // The switch will then downcast to the correct type
    let message = event.data as ModelsUpdateMessage | SettingsUpdateMessage | SetTranslationsMessage | UpdateApiKeyStatusMessage | MessagesUpdatedMessage | ShowInProgressMessage | UpdateMessageMessage | AddMessageMessage | StreamMessageMessage | AddErrorMessage | ActionCompleteMessage | ActionErrorMessage | UpdateTokenCountMessage;

    // Handle requests from editor
    // if (data.conversationId === "") {
    //   data.conversationId = currentConversationId;
    //   // if the request is from the editor, turn on auto-scroll
    //   // only run if the conversation is not already in progress
    //   if (
    //     !conversationList.find(
    //       (conversation) => conversation.id === data.conversationId
    //     )?.inProgress
    //   ) {
    //     dispatch(
    //       setAutoscroll({
    //         conversationId: data?.conversationId ?? currentConversationId,
    //         autoscroll: true,
    //       })
    //     );
    //   }
    // }

    if (debug) {
      console.log("Renderer - Received message from main process: ", message);
    }

    switch (message.type) {
      case FrontendMessageType.showInProgress:
        message = message as ShowInProgressMessage;

        if (debug) {
          console.log("in progress: ", message.inProgress);
        }

        dispatch(
          setInProgress({
            conversationId: message?.conversationId ?? currentConversationId,
            inProgress: message?.inProgress ?? true,
          })
        );
        break;
      case FrontendMessageType.addMessage:
        message = message as AddMessageMessage;

        const question = {
          id: uuidv4(),
          role: Role.user,
          content: message.chatMessage?.content ?? "",
          rawContent: message.chatMessage?.rawContent ?? "",
          createdAt: Date.now(),
          done: true,
          questionCode: message?.chatMessage?.code
            ? (window as any)?.marked.parse(
              `\`\`\`${message?.chatMessage?.editorLanguage ?? ''}\n${message?.chatMessage?.code}\n\`\`\``
            )
            : "",
        } as ChatMessage;

        dispatch(
          addMessage({
            conversationId: /* message?.conversationId ?? */ currentConversationId,
            message: question,
          })
        );

        break;
      // Update a single message
      case FrontendMessageType.updateMessage:
        message = message as UpdateMessageMessage;

        if (message?.chatMessage) {
          dispatch(
            updateMessage({
              conversationId: message?.conversationId ?? currentConversationId,
              messageId: message?.chatMessage?.id ?? "",
              message: message?.chatMessage,
            })
          );

          if (
            message?.chatMessage?.role === Role.assistant &&
            (message?.chatMessage?.done || message?.chatMessage?.content.length > 200)
          ) {
            const conversation = conversationList.find(
              (conversation) => conversation.id === currentConversationId
            );

            if (conversation && !conversation?.aiRenamedTitle) {
              useRenameTabTitleWithAI(backendMessenger, conversation, settings);
            }
          }
        } else {
          console.error("updateMessage event: No message provided");
        }

        break;
      // Update all messages in a conversation
      case FrontendMessageType.messagesUpdated:
        message = message as MessagesUpdatedMessage;

        dispatch(
          updateConversationMessages({
            conversationId: message?.conversationId ?? currentConversationId,
            messages: message.chatMessages ?? [],
          })
        );

        break;
      case FrontendMessageType.addMessage:
        message = message as AddMessageMessage;

        if (message?.chatMessage) {
          dispatch(
            addMessage({
              conversationId: message?.conversationId ?? currentConversationId,
              message: message.chatMessage,
            })
          );
        } else {
          console.error("addMessage event: No message to add");
        }

        break;
      case FrontendMessageType.streamMessage:
        message = message as StreamMessageMessage;

        dispatch(
          updateMessageContent({
            conversationId: message?.conversationId ?? currentConversationId,
            messageId: message?.chatMessageId ?? "",
            content: message?.content ?? "",
            done: false,
          })
        );

        // Is the message done or over 200 characters?
        const messageLength = message?.content?.length ?? 0;
        if (messageLength > 200) {
          const conversation = conversationList.find(
            (conversation) => conversation.id === currentConversationId
          );

          if (conversation && !conversation?.aiRenamedTitle) {
            useRenameTabTitleWithAI(backendMessenger, conversation, settings, message.content);
          }
        }
        break;
      case FrontendMessageType.addError:
        message = message as AddErrorMessage;

        const messageValue =
          message.value ||
          "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to an OpenAI outage. Take a look at https://status.openai.com to see if there's an OpenAI outage.";

        const errorMessage = {
          id: message.id,
          role: Role.assistant,
          content: messageValue,
          createdAt: Date.now(),
          isError: true,
        } as ChatMessage;

        dispatch(
          addMessage({
            conversationId: message?.conversationId ?? currentConversationId,
            message: errorMessage,
          })
        );
        break;
      case FrontendMessageType.settingsUpdate:
        message = message as SettingsUpdateMessage;

        if (debug) {
          console.log("Renderer - Settings update: ", message.config);
        }

        dispatch(setExtensionSettings({ newSettings: message.config }));

        const currentConversation = conversationList.find(
          (conversation) => conversation.id === currentConversationId
        );

        // if the current conversation verbosity and model haven't been set yet, set them based on the settings
        if (!currentConversation?.model || !currentConversation?.verbosity) {
          dispatch(
            setModel({
              conversationId: currentConversationId,
              model: message.config.gpt3?.model,
            })
          );
          dispatch(
            setVerbosity({
              conversationId: currentConversationId,
              verbosity: message.config.verbosity,
            })
          );
        }
        break;
      case FrontendMessageType.modelsUpdate:
        message = message as ModelsUpdateMessage;

        if (debug) {
          console.log("Renderer - ChatGPT models: ", message.models);
        }

        dispatch(
          setModels({
            models: message.models,
          })
        );
        break;
      case FrontendMessageType.updateApiKeyStatus:
        message = message as UpdateApiKeyStatusMessage;

        let keyStatus: ApiKeyStatus;

        if (message.status) {
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
      case FrontendMessageType.tokenCount:
        message = message as UpdateTokenCountMessage;

        if (debug) {
          console.log("Renderer - Conversation token count:", message.tokenCount);
        }

        dispatch(
          updateConversationTokenCount({
            conversationId: message.conversationId ?? currentConversationId,
            tokenCount: message.tokenCount ?? {
              messages: 0,
              userInput: 0,
              minTotal: 0,
            },
          })
        );
      case FrontendMessageType.setTranslations:
        message = message as SetTranslationsMessage;

        if (debug) {
          console.log("Renderer - Translations:", message.translations);
        }

        if (message?.translations) {
          dispatch(setTranslations(JSON.parse(message.translations)));
        }
        break;
      case FrontendMessageType.actionComplete:
        message = message as ActionCompleteMessage;

        if (message?.actionId) {
          dispatch(
            setActionState({
              actionId: message?.actionId,
              state: ActionRunState.idle,
            })
          );

          // Handle action results (where the action has a result)
          switch (message?.actionId) {
            case ActionNames.createConversationTitle:
              // Update the conversation title
              const newTitle = message?.actionResult?.newTitle;

              if (newTitle) {
                dispatch(
                  updateConversationTitle({
                    conversationId: message?.actionResult?.conversationId,
                    title: newTitle,
                  })
                );
              }
              break;
            default:
              console.warn(
                `Renderer - Unhandled result from action: ${message?.actionId}`
              );
          }
        }
        break;
      case FrontendMessageType.actionError:
        message = message as ActionErrorMessage;

        const actionId = message?.actionId;
        const actionError = message?.error;

        if (debug) {
          console.log("Renderer - Action error:", actionError);
        }

        if (actionId && actionError) {
          dispatch(setActionError({ error: actionError, actionId }));
        }

        break;
      default:
        console.error('Renderer - Uncaught message type: ', (message as BaseFrontendMessage)?.type);
    }
  };
};
