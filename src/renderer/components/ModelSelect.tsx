import classNames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getModelCompletionLimit,
  getModelContextLimit,
  getModelRates,
} from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { ApiKeyStatus } from "../store/app";
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
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [showModels, setShowModels] = useState(false);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app?.apiKeyStatus
  );
  const models = useAppSelector((state: RootState) => state.app.models);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const backendMessenger = useMessenger(vscode);
  const [sortBy, setSortBy] = useState<
    "name" | "cost" | "context" | "completion"
  >("name");
  const [ascending, setAscending] = useState(true);

  const hasOpenAIModels = useMemo(() => {
    // check if the model list has at least one of: gpt-4, gpt-4-turbo, gpt-4o, gpt-3.5-turbo
    return models.some(
      (model) =>
        model.id === "gpt-4" ||
        model.id === "gpt-4-turbo" ||
        model.id === "gpt-4o" ||
        model.id === "gpt-3.5-turbo"
    );
  }, [models]);

  // Check if the current model is in the model list
  // When APIs are changed, the current model might not be available
  const isCurrentModelAvailable = useMemo(() => {
    return (
      models.length === 0 ||
      models.some((model) => model.id === currentConversation.model?.id)
    );
  }, [models, currentConversation.model]);

  // computed model costs for all models
  interface ComputedModelData {
    promptLimit: number;
    completeLimit: number;
    prompt: number;
    complete: number;
    promptText: string;
    completeText: string;
    isFree: boolean;
    isExpensive: boolean;
  }
  const computedModelDataMap = useMemo(() => {
    const costs = new Map<string, ComputedModelData>();

    models.forEach((model) => {
      const rate = getModelRates(model);

      costs.set(model.id, {
        promptLimit: getModelContextLimit(model),
        completeLimit: getModelCompletionLimit(model),
        prompt: rate.prompt,
        complete: rate.complete,
        promptText:
          rate.prompt === 0
            ? "FREE"
            : `$${(rate.prompt * 1000).toFixed(2)} / 1M`,
        completeText:
          rate.complete === 0
            ? "FREE"
            : `$${(rate.complete * 1000).toFixed(2)} / 1M`,
        isFree: rate.prompt === 0 && rate.complete === 0,
        isExpensive: rate.prompt > 0.01 || rate.complete > 0.03,
      });
    });

    return costs;
  }, [models]);

  // returns sorted list of models
  const sortList = useCallback(
    (
      sortBy: "name" | "cost" | "context" | "completion",
      list: Model[],
      reverse: boolean
    ) => {
      const sortedModels: Model[] = Object.assign([], list);

      switch (sortBy) {
        case "name":
          sortedModels.sort((a, b) =>
            (a?.name ?? a.id).localeCompare(b?.name ?? b.id)
          );
          break;
        case "cost":
          sortedModels.sort((a, b) => {
            const aModelData = computedModelDataMap.get(a.id);
            const bModelData = computedModelDataMap.get(b.id);

            const aCost =
              (aModelData?.prompt ?? 0) + (aModelData?.complete ?? 0);
            const bCost =
              (bModelData?.prompt ?? 0) + (bModelData?.complete ?? 0);

            return aCost - bCost;
          });
          break;
        case "context":
          sortedModels.sort((a, b) => {
            const aModelData = computedModelDataMap.get(a.id);
            const bModelData = computedModelDataMap.get(b.id);

            return (
              (bModelData?.promptLimit ?? 128000) -
              (aModelData?.promptLimit ?? 128000)
            );
          });
          break;
        case "completion":
          sortedModels.sort((a, b) => {
            const aModelData = computedModelDataMap.get(a.id);
            const bModelData = computedModelDataMap.get(b.id);

            return (
              (bModelData?.completeLimit ?? 4096) -
              (aModelData?.completeLimit ?? 4096)
            );
          });
      }

      if (reverse) {
        sortedModels.reverse();
      }

      return sortedModels;
    },
    [computedModelDataMap]
  );

  const currentModelFriendlyName = useMemo(() => {
    let friendlyName =
      currentConversation.model?.name ??
      (MODEL_FRIENDLY_NAME.has(currentConversation.model?.id ?? "")
        ? MODEL_FRIENDLY_NAME.get(currentConversation.model?.id ?? "")
        : currentConversation.model?.id ?? settings?.gpt3?.model) ??
      "No model selected";

    // if the friendly has a slash (ie perplexity/model-name), ignore everything before the slash
    if (friendlyName.includes("/")) {
      friendlyName = friendlyName.split("/")[1];
    }

    //  if the friendly name has a colon (ie model-name:version), ignore everything after the colon
    if (friendlyName.includes(":")) {
      friendlyName = friendlyName.split(":")[0];
    }

    return friendlyName;
  }, [currentConversation.model, settings]);

  const setModel = (model: Model) => {
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

  const modelSearchHandler = useCallback(
    (e: any) => {
      const query = e.target.value.toLowerCase();

      // Search for models that match the query
      const modelList: Model[] = Object.assign([], models);
      const filteredModelList =
        query.length > 0
          ? modelList.filter(
              (model) =>
                model.id.toLowerCase().includes(query) ||
                (model?.name && model.name.toLowerCase().includes(query))
            )
          : modelList;

      setFilteredModels(sortList(sortBy, filteredModelList, !ascending));
    },
    [models]
  );

  useEffect(() => {
    setFilteredModels(sortList(sortBy, models, !ascending));
  }, [models, sortBy, ascending]);

  return (
    <>
      <div className={`${className}`}>
        <button
          className={classNames(
            `rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap hover:text-button-secondary focus:text-button-secondary`,
            {
              "text-red-500": !isCurrentModelAvailable,
            }
          )}
          onClick={() => {
            setShowModels(!showModels);
          }}
          onKeyUp={(e) => {
            if (e.key === "Escape") {
              setShowModels(false);
            }
          }}
          data-tooltip-id={tooltipId ?? "footer-tooltip"}
          data-tooltip-content="Change the AI model being used"
        >
          <Icon icon="box" className="w-3 h-3 mr-1" />
          {isCurrentModelAvailable
            ? currentModelFriendlyName
            : "No model selected"}
        </button>
        <div
          className={`fixed mb-8 overflow-y-auto max-h-[calc(100%-7em)] items-center more-menu border text-menu bg-menu border-menu shadow-xl text-xs rounded
            ${showModels ? "block" : "hidden"}
            ${dropdownClassName ? dropdownClassName : "left-4 z-10"}
          `}
        >
          {/*
            Show all models if "Show all models" is enabled in settings.
            OR show all models if there's no overlap with OpenAI models,
            otherwise the model select will be empty.
          */}
          {settings?.showAllModels || !hasOpenAIModels ? (
            <>
              {models.length === 0 ? (
                <>
                  {apiKeyStatus === ApiKeyStatus.Pending ? (
                    <div className="p-2 text-center">
                      <span className="text-yellow-500">
                        Fetching models...
                      </span>
                    </div>
                  ) : apiKeyStatus === ApiKeyStatus.Invalid ? (
                    <div className="p-2 text-center">
                      <span className="text-red-500">
                        Invalid API key. Please check your API key.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 text-center">
                      <span className="text-button">No models available.</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(models.length > 6 ? filteredModels : models).map(
                    (model: Model) => (
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
                        <span className="font-bold">
                          {model?.name ? (
                            <span>{model.name}</span>
                          ) : (
                            <code>{model.id}</code>
                          )}
                        </span>
                        <p>
                          Prompt:{" "}
                          <span
                            className={classNames({
                              "text-green-500": computedModelDataMap.get(
                                model.id
                              )?.isFree,
                              "text-red-500": computedModelDataMap.get(model.id)
                                ?.isExpensive,
                            })}
                          >
                            {computedModelDataMap.get(model.id)?.promptText},
                          </span>{" "}
                          Complete:{" "}
                          <span
                            className={classNames({
                              "text-green-500": computedModelDataMap.get(
                                model.id
                              )?.isFree,
                              "text-red-500": computedModelDataMap.get(model.id)
                                ?.isExpensive,
                            })}
                          >
                            {computedModelDataMap.get(model.id)?.completeText},
                          </span>{" "}
                          Context:{" "}
                          <code>
                            {computedModelDataMap.get(model.id)?.promptLimit}
                          </code>
                          , Completion:{" "}
                          <code>
                            {computedModelDataMap.get(model.id)?.completeLimit}
                          </code>
                        </p>
                      </button>
                    )
                  )}
                  {models.length > 6 && (
                    <div className="sticky flex flex-col gap-1 bottom-0 p-2 w-full bg-menu">
                      <div className="flex flex-row items-center justify-between">
                        <span className="text-button">
                          Showing {filteredModels.length} of {models.length}{" "}
                          models
                        </span>
                        {/* button list of sort by buttons, the current sort by button is highlighted */}
                        <div className="flex flex-row items-center gap-2">
                          <button
                            className={classNames(
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "name",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "name") {
                                setAscending(!ascending);
                              }

                              setSortBy("name");
                            }}
                          >
                            Name
                          </button>
                          <button
                            className={classNames(
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "cost",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "cost") {
                                setAscending(!ascending);
                              }

                              setSortBy("cost");
                            }}
                          >
                            Cost
                          </button>
                          <button
                            className={classNames(
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "context",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "context") {
                                setAscending(!ascending);
                              }

                              setSortBy("context");
                            }}
                          >
                            Context
                          </button>
                          <button
                            className={classNames(
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "completion",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "completion") {
                                setAscending(!ascending);
                              }

                              setSortBy("completion");
                            }}
                          >
                            Completion
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Search models..."
                        className="px-3 py-2 rounded border text-input text-sm border-input bg-menu-selection outline-0"
                        onChange={modelSearchHandler}
                        onKeyUp={(e) => {
                          if (e.key === "Escape") {
                            setShowModels(false);
                          }
                        }}
                      />
                    </div>
                  )}
                </>
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
