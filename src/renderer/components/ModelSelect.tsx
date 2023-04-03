import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addConversation,
  removeConversation,
  updateConversationModel,
} from "../actions/conversation";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Conversation, Model, Verbosity } from "../types";
import Icon from "./Icon";

export default function ModelSelect({
  currentConversation,
  conversationList,
  vscode,
  className,
  dropdownClassName,
  tooltipId,
  showParentMenu,
}: {
  currentConversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
  className?: string;
  dropdownClassName?: string;
  tooltipId?: string;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: any) => state.app.translations);
  const [showModels, setShowModels] = useState(false);
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const chatGPTModels = useAppSelector((state: any) => state.app.chatGPTModels);

  const createNewConversation = (model: Model) => {
    let title = t?.modelSelect?.chat ?? "Chat";
    let i = 2;

    while (
      conversationList.find((conversation) => conversation.title === title)
    ) {
      title = `${t?.modelSelect?.chat ?? "Chat"} ${i}`;
      i++;
    }
    const newConversation = {
      id: `${title}-${Date.now()}`,
      title,
      messages: [],
      inProgress: false,
      createdAt: Date.now(),
      model,
      autoscroll: true,
      verbosity:
        settings?.verbosity ??
        currentConversation?.verbosity ??
        Verbosity.normal,
    } as Conversation;

    dispatch(addConversation(newConversation));

    // switch to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);

    // If multiple conversations are disabled, remove all but the new conversation
    if (settings?.disableMultipleConversations) {
      for (const conversation of conversationList) {
        if (conversation.id !== newConversation.id) {
          dispatch(removeConversation(conversation.id));
        }
      }
    }
  };

  const setModel = (model: Model) => {
    // Update settings
    vscode.postMessage({
      type: "setModel",
      value: model,
      conversationId: currentConversation.id,
    });

    // Model can't change partway through a conversation, so we need to create a new one
    // if (
    //   currentConversation.model !== model &&
    //   currentConversation.messages.length > 0
    // ) {
    //   createNewConversation(model);
    // } else {
    dispatch(
      updateConversationModel({
        conversationId: currentConversation.id,
        model,
      })
    );
    // }

    // Close the menu
    setShowModels(false);
  };

  return (
    <>
      <div className={`${className}`}>
        <button
          className={`rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap hover:text-button-secondary focus:text-button-secondary`}
          onClick={() => {
            setShowModels(!showModels);
          }}
          data-tooltip-id={tooltipId ?? "footer-tooltip"}
          data-tooltip-content="Change the AI model being used"
        >
          <Icon icon="box" className="w-3 h-3 mr-1" />
          {currentConversation.messages.length > 0
            ? currentConversation.model
            : settings?.gpt3?.model ?? "..."}
        </button>
        <div
          className={`fixed items-center more-menu border text-menu bg-menu border-menu shadow-xl text-xs rounded
            ${showModels ? "block" : "hidden"}
            ${dropdownClassName ? dropdownClassName : "bottom-8 left-4 z-10"}
          `}
        >
          {chatGPTModels && chatGPTModels.includes(Model.gpt_35_turbo) && (
            <button
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_35_turbo);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              <code>gpt-3.5-turbo</code>{" "}
              {t?.modelSelect?.gpt35TurboNote ?? "(Fast, recommended)"}
            </button>
          )}
          {chatGPTModels && chatGPTModels.includes(Model.gpt_4) ? (
            <button
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_4);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              <code>gpt-4</code>{" "}
              {t?.modelSelect?.gpt4Note ??
                "(Better and larger input, but slower and more pricey)"}
            </button>
          ) : (
            <a
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              href="https://openai.com/waitlist/gpt-4-api"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                setShowModels(false);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              {t?.modelSelect?.gpt4UnavailableNote ??
                "Looking for GPT-4? You need to sign up on the waitlist here"}
            </a>
          )}
          {chatGPTModels && chatGPTModels.includes(Model.gpt_4_32k) ? (
            <button
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_4_32k);
              }}
            >
              <code>gpt-4-32k</code>{" "}
              {t?.modelSelect?.gpt432kNote ??
                "(Extremely long input, but even more pricey than GPT-4)"}
            </button>
          ) : (
            <a
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              href="https://community.openai.com/t/how-to-get-access-to-gpt-4-32k/"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                setShowModels(false);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              {t?.modelSelect?.gpt432kUnavailableNote ??
                "You can sign up for updates here"}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
