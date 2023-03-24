import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import {
  addConversation,
  updateConversationModel,
} from "../actions/conversation";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Conversation, Model } from "../types";
import Icon from "./Icon";

export default function ModelSelect({
  currentConversation,
  conversationList,
  vscode,
}: {
  currentConversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showModels, setShowModels] = useState(false);
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const chatGPTModels = useAppSelector((state: any) => state.app.chatGPTModels);

  const createNewConversation = () => {
    let title = "Chat";
    let i = 2;

    while (
      conversationList.find((conversation) => conversation.title === title)
    ) {
      title = `Chat ${i}`;
      i++;
    }
    const newConversation = {
      id: `${title}-${Date.now()}`,
      title,
      messages: [],
      inProgress: false,
      createdAt: Date.now(),
      model:
        settings?.gpt3?.model ??
        currentConversation?.model ??
        Model.gpt_35_turbo,
      autoscroll: true,
    } as Conversation;

    dispatch(addConversation(newConversation));

    // switch to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);
  };

  const setModel = (model: Model) => {
    if (currentConversation.model !== model) {
      // Update settings
      vscode.postMessage({
        type: "setModel",
        value: model,
        conversationId: currentConversation.id,
      });

      // Model can't change partway through a conversation, so we need to create a new one
      if (currentConversation.messages.length > 0) {
        createNewConversation();
      } else {
        dispatch(
          updateConversationModel({
            conversationId: currentConversation.id,
            model,
          })
        );
      }
    }

    // Close the menu
    setShowModels(false);
  };

  return (
    <>
      <button
        data-tooltip-id="model-select-tooltip"
        data-tooltip-content="Change the model being used"
        className="rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap"
        onClick={() => {
          setShowModels(!showModels);
        }}
      >
        <Icon icon="box" className="w-3 h-3 mr-1" />
        {currentConversation.messages.length > 0
          ? currentConversation.model
          : settings?.gpt3?.model ?? "..."}
      </button>
      <Tooltip id="model-select-tooltip" place="top" delayShow={800} />
      <div
        className={`absolute bottom-12 items-center more-menu left-4 border text-menu bg-menu border-menu shadow-xl text-xs
            ${showModels ? "block" : "hidden"}
          `}
      >
        {chatGPTModels && chatGPTModels.includes(Model.gpt_35_turbo) && (
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              setModel(Model.gpt_35_turbo);
            }}
          >
            GPT-3.5-TURBO (Fast, recommended)
          </button>
        )}
        {chatGPTModels && chatGPTModels.includes(Model.gpt_4) ? (
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              setModel(Model.gpt_4);
            }}
          >
            GPT-4 (Better and larger input, but slower and more pricey)
          </button>
        ) : (
          <a
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            href="https://openai.com/waitlist/gpt-4-api"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              setShowModels(false);
            }}
          >
            Looking for GPT-4? You need to sign up on the waitlist here
          </a>
        )}
        {chatGPTModels && chatGPTModels.includes(Model.gpt_4_32k) ? (
          <button
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            onClick={() => {
              setModel(Model.gpt_4_32k);
            }}
          >
            GPT-4-32K (Extremely long input, but even more pricey than GPT-4)
          </button>
        ) : (
          <a
            className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
            href="https://community.openai.com/t/how-to-get-access-to-gpt-4-32k/"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              setShowModels(false);
            }}
          >
            OpenAI hasn't made GPT-4-32K available yet.
          </a>
        )}
      </div>
    </>
  );
}
