import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { updateConversationModel } from "../store/conversation";
import {
  Conversation,
  MODEL_FRIENDLY_NAME,
  MODEL_TOKEN_LIMITS,
  Model,
} from "../types";
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
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: any) => state.app.translations);
  const [showModels, setShowModels] = useState(false);
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const chatGPTModels = useAppSelector((state: any) => state.app.chatGPTModels);

  const setModel = (model: Model) => {
    // Update settings
    vscode.postMessage({
      type: "setModel",
      value: model,
      conversationId: currentConversation.id,
    });

    dispatch(
      updateConversationModel({
        conversationId: currentConversation.id,
        model,
      })
    );

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
          {currentConversation.model
            ? MODEL_FRIENDLY_NAME[
                currentConversation.model ?? Model.gpt_35_turbo
              ]
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
              className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_35_turbo);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              <code>gpt-3.5-turbo</code>
              <p>
                Quality: ✅⬜⬜, Speed: ✅✅✅, Cost: ✅✅✅, Context:{" "}
                <code>{MODEL_TOKEN_LIMITS[Model.gpt_35_turbo].context}</code>
                {MODEL_TOKEN_LIMITS[Model.gpt_35_turbo].max && (
                  <>
                    , Max Completion:{" "}
                    <code>{MODEL_TOKEN_LIMITS[Model.gpt_35_turbo]?.max}</code>
                  </>
                )}
              </p>
            </button>
          )}
          {chatGPTModels && chatGPTModels.includes(Model.gpt_35_turbo_16k) && (
            <button
              className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_35_turbo_16k);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              <code>gpt-3.5-turbo-16k</code>
              <p>
                Quality: ✅⬜⬜, Speed: ✅✅✅, Cost: ✅✅✅, Context:{" "}
                <code>
                  {MODEL_TOKEN_LIMITS[Model.gpt_35_turbo_16k].context}
                </code>
                {MODEL_TOKEN_LIMITS[Model.gpt_35_turbo_16k].max && (
                  <>
                    , Max Completion:{" "}
                    <code>
                      {MODEL_TOKEN_LIMITS[Model.gpt_35_turbo_16k]?.max}
                    </code>
                  </>
                )}
              </p>
            </button>
          )}
          {chatGPTModels && chatGPTModels.includes(Model.gpt_4_turbo) ? (
            <button
              className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_4_turbo);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              <code>gpt-4-turbo</code>
              <p>
                Quality: ✅✅⬜, Speed: ✅✅⬜, Cost: ✅✅⬜, Context:{" "}
                <code>{MODEL_TOKEN_LIMITS[Model.gpt_4_turbo].context}</code>
                {MODEL_TOKEN_LIMITS[Model.gpt_4_turbo].max && (
                  <>
                    , Max Completion:{" "}
                    <code>{MODEL_TOKEN_LIMITS[Model.gpt_4_turbo]?.max}</code>
                  </>
                )}
              </p>
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
              {t?.modelSelect?.gpt4TurboUnavailableNote ??
                "Looking for GPT-4-turbo? Your account does not seem to have access yet."}
            </a>
          )}
          {chatGPTModels && chatGPTModels.includes(Model.gpt_4) ? (
            <button
              className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_4);
                if (showParentMenu) {
                  showParentMenu(false);
                }
              }}
            >
              <code>gpt-4</code>
              <p>
                Quality: ✅✅✅, Speed: ✅⬜⬜, Cost: ✅⬜⬜, Context:{" "}
                <code>{MODEL_TOKEN_LIMITS[Model.gpt_4].context}</code>
                {MODEL_TOKEN_LIMITS[Model.gpt_4].max && (
                  <>
                    , Max Completion:{" "}
                    <code>{MODEL_TOKEN_LIMITS[Model.gpt_4]?.max}</code>
                  </>
                )}
              </p>
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
              className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
              onClick={() => {
                setModel(Model.gpt_4_32k);
              }}
            >
              <code>gpt-4-32k</code>
              <p>
                Quality: ✅✅✅, Speed: ✅⬜⬜, Cost: ✅⬜⬜, Context:{" "}
                <code>{MODEL_TOKEN_LIMITS[Model.gpt_4_32k].context}</code>
                {MODEL_TOKEN_LIMITS[Model.gpt_4_32k].max && (
                  <>
                    , Max Completion:{" "}
                    <code>{MODEL_TOKEN_LIMITS[Model.gpt_4_32k]?.max}</code>
                  </>
                )}
              </p>
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
