import { v4 as uuidv4 } from "uuid";
import { useAppDispatch, useAppSelector } from "./hooks";
import { RootState } from "./store";
import { ActionRunState, setActionError, setActionState } from "./store/action";
import { setApiKeyStatus, setExtensionSettings, setModels, setTranslations } from "./store/app";
import { addMessage, setInProgress, setModel, setVerbosity, updateConversationMessages, updateConversationTitle, updateConversationTokenCount, updateMessage, updateMessageContent } from "./store/conversation";
import { ActionNames, ChatMessage, Conversation, Role } from "./types";
import { ActionCompleteMessage, ActionErrorMessage, AddErrorMessage, AddMessageMessage, BaseFrontendMessage, FrontendMessageType, MessagesUpdatedMessage, ModelsUpdateMessage, SetTranslationsMessage, SettingsUpdateMessage, ShowInProgressMessage, StreamMessageMessage, UpdateApiKeyStatusMessage, UpdateMessageMessage, UpdateTokenCountMessage } from "./types-messages";
import { useRenameTabTitleWithAI } from "./utils";

export const useBackendMessageHandler = (backendMessenger: any) => {
  const dispatch = useAppDispatch();
  const currentConversationId = useAppSelector(
    (state: RootState) => state.conversation.currentConversationId
  ) as string; // Assume there is always a current conversation
  const conversationList = Object.values(
    useAppSelector((state: RootState) => state.conversation.conversations)
  ) as Conversation[];

  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const models = useAppSelector((state: RootState) => state.app.models);
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app?.apiKeyStatus
  );
  const vscode = useAppSelector((state: RootState) => state.app.vscode);
  const renameTabTitleWithAI = useRenameTabTitleWithAI(backendMessenger, settings);

  return (event: any) => {
    if (debug) {
      console.log("Renderer - Received message from main process: ", event.data);
    }

    let message = event.data as ModelsUpdateMessage | SettingsUpdateMessage | SetTranslationsMessage | UpdateApiKeyStatusMessage | MessagesUpdatedMessage | ShowInProgressMessage | UpdateMessageMessage | AddMessageMessage | StreamMessageMessage | AddErrorMessage | ActionCompleteMessage | ActionErrorMessage | UpdateTokenCountMessage;

    switch (message.type) {
      case FrontendMessageType.showInProgress:
        dispatch(
          setInProgress({
            conversationId: message?.conversationId ?? currentConversationId,
            inProgress: message?.inProgress ?? true,
          })
        );
        break;
      case FrontendMessageType.addMessage:
        const question: ChatMessage = {
          id: message.chatMessage?.id ?? uuidv4(),
          role: message.chatMessage?.role ?? Role.user,
          content: message.chatMessage?.content ?? "",
          rawContent: message.chatMessage?.rawContent ?? "",
          createdAt: message.chatMessage?.createdAt ?? Date.now(),
          done: true,
          questionCode: message?.chatMessage?.code
            ? (window as any)?.marked.parse(
              `\`\`\`${message?.chatMessage?.editorLanguage ?? ''}\n${message?.chatMessage?.code}\n\`\`\``
            )
            : "",
        };

        dispatch(
          addMessage({
            conversationId: currentConversationId,
            message: question,
          })
        );

        break;
      case FrontendMessageType.updateMessage:
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
              renameTabTitleWithAI(conversation);
            }
          }
        } else {
          console.error("updateMessage event: No message provided");
        }

        break;
      case FrontendMessageType.messagesUpdated:
        dispatch(
          updateConversationMessages({
            conversationId: message?.conversationId ?? currentConversationId,
            messages: message.chatMessages ?? [],
          })
        );

        break;
      case FrontendMessageType.streamMessage:
        dispatch(
          updateMessageContent({
            conversationId: message?.conversationId ?? currentConversationId,
            messageId: message?.chatMessageId ?? "",
            content: message?.content ?? "",
            done: false,
          })
        );

        if (message.content?.length > 200) {
          const conversation = conversationList.find(
            (conversation) => conversation.id === currentConversationId
          );

          if (conversation && !conversation?.aiRenamedTitle) {
            renameTabTitleWithAI(conversation, message.content);
          }
        }
        break;
      case FrontendMessageType.addError:
        const errorMessageText = "An error occurred. If this issue persists please clear your session token with `ChatGPT: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to an OpenAI outage. Take a look at https://status.openai.com to see if there's an OpenAI outage.";
        const errorMessage: ChatMessage = {
          id: message.id,
          role: Role.assistant,
          content: message.value ?? errorMessageText,
          rawContent: message.value ?? errorMessageText,
          createdAt: Date.now(),
          isError: true,
        };

        dispatch(
          addMessage({
            conversationId: message?.conversationId ?? currentConversationId,
            message: errorMessage,
          })
        );
        break;
      case FrontendMessageType.settingsUpdate:
        dispatch(setExtensionSettings({ newSettings: message.config }));

        const currentConversation = conversationList.find(
          (conversation) => conversation.id === currentConversationId
        );

        if (!currentConversation?.model || !currentConversation?.verbosity) {
          if (!!models?.length) {
            dispatch(
              setModel({
                conversationId: currentConversationId,
                model: models.find((model) => model.id === message.config.gpt3?.model) ?? models[0],
              })
            );
          } else {
            dispatch(
              setModel({
                conversationId: currentConversationId,
                model: {
                  id: message.config.gpt3?.model,
                  // dummy values
                  created: 0,
                  object: "model",
                  owned_by: "system",
                }
              })
            );
          }

          dispatch(
            setVerbosity({
              conversationId: currentConversationId,
              verbosity: message.config.verbosity,
            })
          );
        }
        break;
      case FrontendMessageType.modelsUpdate:
        dispatch(
          setModels({
            models: message.models,
          })
        );
        break;
      case FrontendMessageType.updateApiKeyStatus:
        dispatch(setApiKeyStatus(message.status));
        break;
      case FrontendMessageType.tokenCount:
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
        break;
      case FrontendMessageType.setTranslations:
        if (message?.translations) {
          dispatch(setTranslations(JSON.parse(message.translations)));
        }
        break;
      case FrontendMessageType.actionComplete:
        dispatch(
          setActionState({
            actionId: message?.actionId,
            state: ActionRunState.idle,
          })
        );

        switch (message?.actionId) {
          case ActionNames.createConversationTitle:
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
            console.warn(`Renderer - Unhandled result from action: ${message?.actionId}`);
        }
        break;
      case FrontendMessageType.actionError:
        dispatch(setActionError({ error: message?.error, actionId: message?.actionId }));
        break;
      default:
        console.error('Renderer - Uncaught message type: ', (message as BaseFrontendMessage)?.type);
    }
  };
};
