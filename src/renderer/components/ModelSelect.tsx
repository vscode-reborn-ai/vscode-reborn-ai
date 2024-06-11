import OpenAI from "openai";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { updateConversationModel } from "../store/conversation";
import {
  Conversation,
  MODEL_FRIENDLY_NAME,
  MODEL_TOKEN_LIMITS,
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
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [showModels, setShowModels] = useState(false);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const models = useAppSelector((state: RootState) => state.app.models);
  const [filteredModels, setFilteredModels] = useState<OpenAI.Model[]>([]);
  const backendMessenger = useMessenger(vscode);

  useEffect(() => {
    setFilteredModels(models);
  }, [models]);

  const setModel = (model: OpenAI.Model) => {
    // Update settings
    backendMessenger.sendModelUpdate(model);

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
            ? MODEL_FRIENDLY_NAME.has(currentConversation.model.id)
              ? MODEL_FRIENDLY_NAME.get(currentConversation.model.id)
              : currentConversation.model.id ?? settings?.gpt3?.model
            : settings?.gpt3?.model ?? "..."}
        </button>
        <div
          className={`fixed mb-8 overflow-y-auto max-h-screen items-center more-menu border text-menu bg-menu border-menu shadow-xl text-xs rounded
            ${showModels ? "block" : "hidden"}
            ${dropdownClassName ? dropdownClassName : "left-4 z-10"}
          `}
        >
          {settings?.showAllModels ? (
            <>
              {(models.length > 6 ? filteredModels : models).map(
                (model: OpenAI.Model) => (
                  <button
                    key={model.id}
                    className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
                    onClick={() => {
                      setModel(model);
                      if (showParentMenu) {
                        showParentMenu(false);
                      }
                    }}
                  >
                    <code>{model.id}</code>
                  </button>
                )
              )}
              {models.length > 6 && (
                <div className="sticky flex flex-col gap-1 bottom-0 p-2 w-full bg-menu">
                  <span className="text-button">
                    Showing {filteredModels.length} of {models.length} models
                  </span>
                  <input
                    type="text"
                    placeholder="Search models..."
                    className="px-3 py-2 rounded border text-input text-sm border-input bg-menu-selection outline-0"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();

                      setFilteredModels(
                        query.length > 0
                          ? models.filter((model) =>
                              model.id.toLowerCase().includes(query)
                            )
                          : models
                      );
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {models &&
                (() => {
                  const gpt35Turbo = models.find(
                    (model) => model.id === "gpt-3.5-turbo"
                  );

                  if (!gpt35Turbo) {
                    return null;
                  }

                  return (
                    <button
                      className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
                      onClick={() => {
                        setModel(gpt35Turbo);
                        if (showParentMenu) {
                          showParentMenu(false);
                        }
                      }}
                    >
                      <code>gpt-3.5-turbo</code>
                      <p>
                        Quality: ⭐⬜⬜, Speed: ⚡⚡⚡, Cost: 💸⬜⬜, Context:{" "}
                        <code>
                          {MODEL_TOKEN_LIMITS.get(gpt35Turbo.id)?.context}
                        </code>
                        {MODEL_TOKEN_LIMITS.get(gpt35Turbo.id)?.max && (
                          <>
                            , Completion:{" "}
                            <code>
                              {MODEL_TOKEN_LIMITS.get(gpt35Turbo.id)?.max}
                            </code>
                          </>
                        )}
                      </p>
                    </button>
                  );
                })()}
              {models &&
                (() => {
                  const gpt4Turbo = models.find(
                    (model) => model.id === "gpt-4-turbo"
                  );

                  if (!gpt4Turbo) {
                    return null;
                  }

                  return (
                    <button
                      className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
                      onClick={() => {
                        setModel(gpt4Turbo);
                        if (showParentMenu) {
                          showParentMenu(false);
                        }
                      }}
                    >
                      <code>gpt-4-turbo</code>
                      <p>
                        Quality: ⭐⭐⬜, Speed: ⚡⚡⬜, Cost: 💸💸💸, Context:{" "}
                        <code>
                          {MODEL_TOKEN_LIMITS.get(gpt4Turbo.id)?.context}
                        </code>
                        {MODEL_TOKEN_LIMITS.get(gpt4Turbo.id)?.max && (
                          <>
                            , Completion:{" "}
                            <code>
                              {MODEL_TOKEN_LIMITS.get(gpt4Turbo.id)?.max}
                            </code>
                          </>
                        )}
                      </p>
                    </button>
                  );
                })()}
              {models &&
                (() => {
                  const gpt4 = models.find((model) => model.id === "gpt-4");

                  if (!gpt4) {
                    return null;
                  }

                  return (
                    <button
                      className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
                      onClick={() => {
                        setModel(gpt4);
                        if (showParentMenu) {
                          showParentMenu(false);
                        }
                      }}
                    >
                      <code>gpt-4</code>
                      <p>
                        Quality: ⭐⭐⬜, Speed: ⚡⬜⬜, Cost: 💸💸💸, Context:{" "}
                        <code>{MODEL_TOKEN_LIMITS.get(gpt4.id)?.context}</code>
                        {MODEL_TOKEN_LIMITS.get(gpt4.id)?.max && (
                          <>
                            , Completion:{" "}
                            <code>{MODEL_TOKEN_LIMITS.get(gpt4.id)?.max}</code>
                          </>
                        )}
                      </p>
                    </button>
                  );
                })()}
              {models &&
                (() => {
                  const gpt4o = models.find((model) => model.id === "gpt-4o");

                  if (!gpt4o) {
                    return null;
                  }

                  return (
                    <button
                      className="flex flex-col gap-2 items-start justify-start p-2 w-full hover:bg-menu-selection"
                      onClick={() => {
                        setModel(gpt4o);
                        if (showParentMenu) {
                          showParentMenu(false);
                        }
                      }}
                    >
                      <span>
                        <code>gpt-4o</code> <strong>(recommended)</strong>
                      </span>
                      <p>
                        Quality: ⭐⭐⭐, Speed: ⚡⚡⚡, Cost: 💸💸⬜, Context:{" "}
                        <code>{MODEL_TOKEN_LIMITS.get(gpt4o.id)?.context}</code>
                        {MODEL_TOKEN_LIMITS.get(gpt4o.id)?.max && (
                          <>
                            , Completion:{" "}
                            <code>{MODEL_TOKEN_LIMITS.get(gpt4o.id)?.max}</code>
                          </>
                        )}
                      </p>
                    </button>
                  );
                })()}
            </>
          )}
        </div>
      </div>
    </>
  );
}
