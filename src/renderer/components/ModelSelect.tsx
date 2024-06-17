import {
  ArrowDownIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/solid";
import classNames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getModelCompletionLimit,
  getModelContextLimit,
  getModelRates,
  isMultimodalModel,
  isOnlineModel,
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
  const [filteredModels, setFilteredModels] = useState<Model[]>(models);
  const backendMessenger = useMessenger(vscode);
  const [sortBy, setSortBy] = useState<
    "name" | "cost" | "context" | "completion"
  >("name");
  const [ascending, setAscending] = useState(true);
  const searchInputRef = React.createRef<HTMLInputElement>();

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
    prompt: number | undefined;
    complete: number | undefined;
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
            : rate.prompt === undefined
            ? "varies"
            : `$${(rate.prompt * 1000).toFixed(2)}/M`,
        completeText:
          rate.complete === 0
            ? "FREE"
            : rate.complete === undefined
            ? "varies"
            : `$${(rate.complete * 1000).toFixed(2)}/M`,
        isFree: rate.prompt === 0 && rate.complete === 0,
        isExpensive:
          (rate.prompt !== undefined && rate.prompt > 0.01) ||
          (rate.complete !== undefined && rate.complete > 0.03),
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
        : currentConversation.model?.id ??
          models.find((model) => model.id === settings?.gpt3?.model)?.name ??
          settings?.gpt3?.model) ??
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

  const runSearch = useCallback(() => {
    const query = searchInputRef.current?.value.toLowerCase() ?? "";

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
  }, [models, sortBy, ascending, searchInputRef]);

  useEffect(() => {
    setFilteredModels(sortList(sortBy, models, !ascending));
  }, [models, currentConversation.model, isCurrentModelAvailable]);

  useEffect(() => {
    setFilteredModels(sortList(sortBy, filteredModels, !ascending));
  }, [sortBy, ascending]);

  // Render 1500000 as 1,500,000
  const formatInteger = useCallback((num: number | undefined) => {
    if (num === undefined) {
      return "varies";
    }

    return num.toLocaleString();
  }, []);

  // Convert bytes to human readable format
  const formatSize = useCallback((bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
      return "0 B";
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  }, []);

  // when the models popup is shown rerun search (since might have the previous search query)
  useEffect(() => {
    if (showModels || !hasOpenAIModels) {
      runSearch();
    }
  }, [showModels]);

  return (
    <>
      <div className={className}>
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
                        className="flex flex-col gap-1 items-start justify-start p-2 w-full hover:bg-menu-selection"
                        onClick={() => {
                          setModel(model);
                          if (showParentMenu) {
                            showParentMenu(false);
                          }
                        }}
                      >
                        <div className="flex gap-2 items-center">
                          <span className="mt-0.5 text-start font-bold">
                            {model?.name ? (
                              <span>{model.name}</span>
                            ) : (
                              <code>{model.id}</code>
                            )}
                          </span>
                          {isMultimodalModel(model) && (
                            <span className="px-0.5 border-2 border-opacity-50 rounded text-2xs leading-snug opacity-75">
                              multimodal
                            </span>
                          )}
                          {isOnlineModel(model) && (
                            <span className="px-0.5 border-2 border-opacity-50 rounded text-2xs leading-snug opacity-75">
                              online
                            </span>
                          )}
                          {model.top_provider?.is_moderated && (
                            <span className="px-0.5 border-2 border-opacity-50 rounded text-2xs leading-snug opacity-75">
                              moderated
                            </span>
                          )}
                        </div>
                        <div className="w-full flex justify-around gap-2 divide-dropdown text-2xs">
                          {computedModelDataMap.get(model.id)?.prompt ===
                            undefined &&
                          (settings.gpt3.apiBaseUrl.includes("127.0.0.1") ||
                            settings.gpt3.apiBaseUrl.includes("localhost")) ? (
                            <>
                              {model.details?.family && (
                                <span>{model.details.family}</span>
                              )}
                              {model.details?.parameter_size && (
                                <span>{model.details.parameter_size}</span>
                              )}
                              {model.details?.quantization_level && (
                                <span>{model.details.quantization_level}</span>
                              )}
                              {model.details?.format && (
                                <span>{model.details.format}</span>
                              )}
                              {model.size && (
                                <span>{formatSize(model.size)}</span>
                              )}
                            </>
                          ) : (
                            <>
                              <div
                                className={classNames(
                                  "flex items-center gap-0.5",
                                  {
                                    "text-green-500": computedModelDataMap.get(
                                      model.id
                                    )?.isFree,
                                    "text-red-500": computedModelDataMap.get(
                                      model.id
                                    )?.isExpensive,
                                    "opacity-75":
                                      sortBy === "context" ||
                                      sortBy === "completion",
                                  }
                                )}
                              >
                                {computedModelDataMap.get(model.id)?.promptText}
                                <ArrowUpIcon className="w-3 h-3" />
                              </div>
                              <div
                                className={classNames(
                                  "flex items-center gap-0.5",
                                  {
                                    "text-green-500": computedModelDataMap.get(
                                      model.id
                                    )?.isFree,
                                    "text-red-500": computedModelDataMap.get(
                                      model.id
                                    )?.isExpensive,
                                    "opacity-75":
                                      sortBy === "context" ||
                                      sortBy === "completion",
                                  }
                                )}
                              >
                                {
                                  computedModelDataMap.get(model.id)
                                    ?.completeText
                                }
                                <ArrowDownIcon className="w-3 h-3" />
                              </div>
                              <div
                                className={classNames(
                                  "flex items-center gap-0.5",
                                  {
                                    "opacity-75":
                                      sortBy === "cost" ||
                                      sortBy === "completion",
                                  }
                                )}
                              >
                                <span>
                                  {formatInteger(
                                    computedModelDataMap.get(model.id)
                                      ?.promptLimit
                                  )}{" "}
                                  max
                                </span>
                                <ArrowUpIcon className="w-3 h-3" />
                              </div>
                              <div
                                className={classNames(
                                  "flex items-center gap-0.5",
                                  {
                                    "opacity-75":
                                      sortBy === "cost" || sortBy === "context",
                                  }
                                )}
                              >
                                <span>
                                  {formatInteger(
                                    computedModelDataMap.get(model.id)
                                      ?.completeLimit
                                  )}{" "}
                                  max
                                </span>
                                <ArrowDownIcon className="w-3 h-3" />
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    )
                  )}
                  {models.length > 6 && (
                    <div className="sticky flex flex-col gap-1 bottom-0 p-2 w-full bg-menu">
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <span className="flex-grow opacity-50 text-2xs">
                          Showing {filteredModels.length} of {models.length}
                        </span>
                        {/* button list of sort by buttons, the current sort by button is highlighted */}
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            className={classNames(
                              "flex items-center gap-1",
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "name",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "name") {
                                setAscending(!ascending);
                              } else {
                                setAscending(true);
                              }

                              setSortBy("name");
                            }}
                          >
                            <span>Name</span>
                            {sortBy === "name" &&
                              (ascending ? (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                              ) : (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                              ))}
                          </button>
                          <button
                            className={classNames(
                              "flex items-center gap-1",
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "cost",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "cost") {
                                setAscending(!ascending);
                              } else {
                                setAscending(true);
                              }

                              setSortBy("cost");
                            }}
                          >
                            <span>Cost</span>
                            {sortBy === "cost" &&
                              (ascending ? (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                              ) : (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                              ))}
                          </button>
                          <button
                            className={classNames(
                              "flex items-center gap-1",
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "context",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "context") {
                                setAscending(!ascending);
                              } else {
                                setAscending(true);
                              }

                              setSortBy("context");
                            }}
                          >
                            <span>Context</span>
                            {sortBy === "context" &&
                              (!ascending ? (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                              ) : (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                              ))}
                          </button>
                          <button
                            className={classNames(
                              "flex items-center gap-1",
                              "hover:bg-menu-selection p-1 rounded",
                              {
                                "bg-menu-selection": sortBy === "completion",
                              }
                            )}
                            onClick={() => {
                              if (sortBy === "completion") {
                                setAscending(!ascending);
                              } else {
                                setAscending(true);
                              }

                              setSortBy("completion");
                            }}
                          >
                            <span>Completion</span>
                            {sortBy === "completion" &&
                              (!ascending ? (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                              ) : (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                              ))}
                          </button>
                        </div>
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search models..."
                        className="px-3 py-2 rounded border text-input text-sm border-input bg-menu-selection outline-0"
                        onChange={runSearch}
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
