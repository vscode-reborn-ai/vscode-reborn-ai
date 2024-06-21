import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRenameTabTitleWithAI } from "./helpers";
import { useAppDispatch, useAppSelector } from "./hooks";
import { RootState } from "./store";
import { ActionRunState, setActionError, setActionState } from "./store/action";
import { setApiKeyStatus, setExtensionSettings, setModels, setTranslations } from "./store/app";
import { addMessage, setInProgress, setModel, setVerbosity, updateConversationMessages, updateConversationTitle, updateConversationTokenCount, updateMessage, updateMessageContent } from "./store/conversation";
import { ActionNames, ChatMessage, Conversation, Role } from "./types";
import { ActionCompleteMessage, ActionErrorMessage, AddErrorMessage, AddMessageMessage, BaseFrontendMessage, FrontendMessageType, MessagesUpdatedMessage, ModelsUpdateMessage, SetConversationModelMessage, SetTranslationsMessage, SettingsUpdateMessage, ShowInProgressMessage, StreamMessageMessage, UpdateApiKeyStatusMessage, UpdateMessageMessage, UpdateTokenCountMessage } from "./types-messages";

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

  // Update the model for each conversation when the models list is updated
  useEffect(() => {
    // For each conversation, if the model id is found in the new models list, update the model
    conversationList.forEach((conversation) => {
      if (models.some((model) => model.id === conversation.model?.id)) {
        const updatedModel = models.find(
          (model) => model.id === conversation.model?.id
        );

        if (updatedModel) {
          dispatch(
            setModel({
              conversationId: conversation.id,
              model: updatedModel,
            })
          );
        }
      }
    });
  }, [models]);

  return (event: any) => {
    if (debug) {
      console.info("[Reborn AI] Renderer - Received message from main process: ", event.data);
    }

    let message = event.data as ModelsUpdateMessage | SetConversationModelMessage | SettingsUpdateMessage | SetTranslationsMessage | UpdateApiKeyStatusMessage | MessagesUpdatedMessage | ShowInProgressMessage | UpdateMessageMessage | AddMessageMessage | StreamMessageMessage | AddErrorMessage | ActionCompleteMessage | ActionErrorMessage | UpdateTokenCountMessage;

    switch (message.type) {
      case FrontendMessageType.showInProgress:
        const showInProgressData = message as ShowInProgressMessage;

        dispatch(
          setInProgress({
            conversationId: showInProgressData?.conversationId ?? currentConversationId,
            inProgress: showInProgressData?.inProgress ?? true,
          })
        );
        break;
      case FrontendMessageType.addMessage:
        const addMessageData = message as AddMessageMessage;

        const question: ChatMessage = {
          id: addMessageData.chatMessage?.id ?? uuidv4(),
          role: addMessageData.chatMessage?.role ?? Role.user,
          content: addMessageData.chatMessage?.content ?? "",
          rawContent: addMessageData.chatMessage?.rawContent ?? "",
          createdAt: addMessageData.chatMessage?.createdAt ?? Date.now(),
          done: true,
          questionCode: addMessageData?.chatMessage?.code
            ? (window as any)?.marked.parse(
              `\`\`\`${addMessageData?.chatMessage?.editorLanguage ?? ''}\n${addMessageData?.chatMessage?.code}\n\`\`\``
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
        const updateMessageData = message as UpdateMessageMessage;

        if (updateMessageData?.chatMessage) {
          dispatch(
            updateMessage({
              conversationId: updateMessageData?.conversationId ?? currentConversationId,
              messageId: updateMessageData?.chatMessage?.id ?? "",
              message: updateMessageData?.chatMessage,
            })
          );

          if (
            updateMessageData?.chatMessage?.role === Role.assistant &&
            (message?.chatMessage?.done || updateMessageData?.chatMessage?.content.length > 200)
          ) {
            const conversation = conversationList.find(
              (conversation) => conversation.id === currentConversationId
            );

            if (conversation && !conversation?.aiRenamedTitle) {
              renameTabTitleWithAI(conversation);
            }
          }
        } else {
          console.error("[Reborn AI] updateMessage event: No message provided");
        }

        break;
      case FrontendMessageType.messagesUpdated:
        const messagesUpdatedData = message as MessagesUpdatedMessage;

        dispatch(
          updateConversationMessages({
            conversationId: messagesUpdatedData?.conversationId ?? currentConversationId,
            messages: messagesUpdatedData.chatMessages ?? [],
          })
        );

        break;
      case FrontendMessageType.streamMessage:
        const streamMessageData = message as StreamMessageMessage;

        dispatch(
          updateMessageContent({
            conversationId: streamMessageData?.conversationId ?? currentConversationId,
            messageId: streamMessageData?.chatMessageId ?? "",
            content: streamMessageData?.content ?? "",
            done: false,
          })
        );

        if (streamMessageData.content?.length > 200) {
          const conversation = conversationList.find(
            (conversation) => conversation.id === currentConversationId
          );

          if (conversation && !conversation?.aiRenamedTitle) {
            renameTabTitleWithAI(conversation, streamMessageData.content);
          }
        }
        break;
      case FrontendMessageType.addError:
        const addErrorData = message as AddErrorMessage;
        const errorMessageText = "An error occurred. If this issue persists please clear your session token with `Reborn AI: Reset session` command and/or restart your Visual Studio Code. If you still experience issues, it may be due to an OpenAI outage. Take a look at https://status.openai.com to see if there's an OpenAI outage.";
        const errorMessage: ChatMessage = {
          id: addErrorData.id,
          role: Role.assistant,
          content: addErrorData.value ?? errorMessageText,
          rawContent: addErrorData.value ?? errorMessageText,
          createdAt: Date.now(),
          isError: true,
        };

        dispatch(
          addMessage({
            conversationId: addErrorData?.conversationId ?? currentConversationId,
            message: errorMessage,
          })
        );
        break;
      case FrontendMessageType.settingsUpdate:
        const settingsUpdateData = message as SettingsUpdateMessage;

        if (!settingsUpdateData?.config) {
          console.warn("[Reborn AI] Renderer - No settings provided in settingsUpdate message");
          return;
        }

        dispatch(setExtensionSettings({ newSettings: settingsUpdateData.config }));

        const currentConversation = conversationList.find(
          (conversation) => conversation.id === currentConversationId
        );

        if (!currentConversation?.model || !currentConversation?.verbosity) {
          if (!!models?.length) {
            dispatch(
              setModel({
                conversationId: currentConversationId,
                model: models.find((model) => model.id === (settingsUpdateData.config.gpt3?.model ?? settings?.gpt3?.model)
                ) ?? models[0],
              })
            );
          } else {
            dispatch(
              setModel({
                conversationId: currentConversationId,
                model: {
                  id: settingsUpdateData.config.gpt3?.model,
                  // dummy values
                  created: 0,
                  object: "model",
                  owned_by: Role.system,
                }
              })
            );
          }

          dispatch(
            setVerbosity({
              conversationId: currentConversationId,
              verbosity: settingsUpdateData.config.verbosity,
            })
          );
        }
        break;
      case FrontendMessageType.modelsUpdate:
        const modelsUpdateData = message as ModelsUpdateMessage;

        dispatch(
          setModels({
            models: modelsUpdateData.models ?? [],
          })
        );

        break;
      case FrontendMessageType.updateApiKeyStatus:
        const apiKeyStatusData = message as UpdateApiKeyStatusMessage;

        dispatch(setApiKeyStatus(apiKeyStatusData.status));
        break;
      case FrontendMessageType.tokenCount:
        const tokenCountData = message as UpdateTokenCountMessage;

        dispatch(
          updateConversationTokenCount({
            conversationId: tokenCountData.conversationId ?? currentConversationId,
            tokenCount: tokenCountData.tokenCount ?? {
              messages: 0,
              userInput: 0,
              minTotal: 0,
            },
          })
        );
        break;
      case FrontendMessageType.setTranslations:
        const translationsData = message as SetTranslationsMessage;

        if (translationsData?.translations) {
          dispatch(setTranslations(JSON.parse(translationsData.translations)));
        }
        break;
      case FrontendMessageType.actionComplete:
        const actionCompleteData = message as ActionCompleteMessage;

        dispatch(
          setActionState({
            actionId: actionCompleteData?.actionId,
            state: ActionRunState.idle,
          })
        );

        switch (actionCompleteData?.actionId) {
          case ActionNames.createConversationTitle:
            const newTitle = actionCompleteData?.actionResult?.newTitle;

            if (newTitle) {
              dispatch(
                updateConversationTitle({
                  conversationId: actionCompleteData?.actionResult?.conversationId,
                  title: newTitle,
                })
              );
            }
            break;
          default:
            console.warn(`[Reborn AI] Renderer - Unhandled result from action: ${actionCompleteData?.actionId}`);
        }
        break;
      case FrontendMessageType.actionError:
        const actionErrorData = message as ActionErrorMessage;

        dispatch(setActionError({ error: actionErrorData?.error, actionId: actionErrorData?.actionId }));
        break;
      case FrontendMessageType.setConversationModel:
        const setConversationModelData = message as SetConversationModelMessage;

        dispatch(setModel({
          conversationId: setConversationModelData.conversationId,
          model: setConversationModelData.model
        }));
        break;
      default:
        console.error('[Reborn AI] Renderer - Uncaught message type: ', (message as BaseFrontendMessage)?.type);
    }
  };
};
