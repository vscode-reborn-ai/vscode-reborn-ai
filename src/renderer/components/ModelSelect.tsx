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
  getModelFriendlyName,
  getModelRates,
  isMultimodalModel,
  isOnlineModel,
  useConvertMarkdownToComponent,
  useIsModelAvailable,
} from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { ApiKeyStatus } from "../store/app";
import { updateConversationModel } from "../store/conversation";
import { Conversation, Model } from "../types";
import Icon from "./Icon";
import ModelOption from "./ModelOption";

// * OpenAI Models
// On top of the base model attributes from OpenAI
// We add a few properties to display the model in the UI
export interface RichModel extends Partial<Model> {
  quality: string;
  speed: string;
  cost: string;
  recommended?: boolean;
}
const SUGGESTED_OPENAI_MODELS: RichModel[] = [
  {
    id: "gpt-4.1",
    name: "gpt-4.1",
    quality: "⭐⭐⭐",
    speed: "⚡⚡⬜",
    cost: "💸💸⬜",
    recommended: true,
  },
  {
    id: "gpt-4o",
    name: "gpt-4o",
    quality: "⭐⭐⭐",
    speed: "⚡⚡⚡",
    cost: "💸⬜⬜",
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    quality: "⭐⭐⭐",
    speed: "⚡⚡⚡",
    cost: "💸💸⬜",
  },
  {
    id: "o3",
    name: "o3",
    quality: "⭐⭐⭐",
    speed: "⚡⬜⬜",
    cost: "💸💸💸",
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    quality: "⭐⭐⭐",
    speed: "⚡⚡⚡",
    cost: "💸💸⬜",
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    quality: "⭐⭐⬜",
    speed: "⚡⚡⚡",
    cost: "💸⬜⬜",
  },
  {
    id: "o1",
    name: "o1",
    quality: "⭐⭐⭐",
    speed: "⚡⬜⬜",
    cost: "💸💸💸",
  },
];

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
  const modelList: Model[] = useAppSelector(
    (state: RootState) => state.app.models
  );
  const sync = useAppSelector((state: RootState) => state.app.sync);
  const [filteredModels, setFilteredModels] = useState<Model[]>(modelList);
  const backendMessenger = useMessenger(vscode);
  const [sortBy, setSortBy] = useState<
    "name" | "cost" | "context" | "completion"
  >("name");
  const [ascending, setAscending] = useState(true);
  const searchInputRef = React.createRef<HTMLInputElement>();
  const [showDescriptionOn, setShowDescriptionOn] = useState<string | null>(
    null
  );
  const convertMarkdownToComponent = useConvertMarkdownToComponent(vscode);

  const hasOpenAIModels = useMemo(() => {
    // Check if the model list has at least one model from modelsArray
    const openAIModelIds = SUGGESTED_OPENAI_MODELS.map((model) => model.id);
    return modelList.some((model) => openAIModelIds.includes(model.id));
  }, [modelList]);

  const isCurrentModelAvailable = useIsModelAvailable(
    modelList,
    currentConversation?.model
  );

  // computed model costs for all models
  interface ComputedModelData {
    descriptionComponent: React.ReactNode;
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
    const modelData = new Map<string, ComputedModelData>();

    modelList.forEach((model) => {
      const rate = getModelRates(model);

      modelData.set(model.id, {
        descriptionComponent: convertMarkdownToComponent(
          model.description ?? ""
        ),
        promptLimit: getModelContextLimit(model),
        completeLimit: getModelCompletionLimit(model),
        prompt: rate.prompt,
        complete: rate.complete,
        promptText:
          rate.prompt === 0
            ? "FREE"
            : rate.prompt === undefined
            ? "varies"
            : `$${rate.prompt.toFixed(1)}/M`,
        completeText:
          rate.complete === 0
            ? "FREE"
            : rate.complete === undefined
            ? "varies"
            : `$${rate.complete.toFixed(1)}/M`,
        isFree: rate.prompt === 0 && rate.complete === 0,
        isExpensive:
          (rate.prompt !== undefined && rate.prompt > 10) ||
          (rate.complete !== undefined && rate.complete > 30),
      });
    });

    return modelData;
  }, [modelList]);

  const currentModelFriendlyName = useMemo(() => {
    return getModelFriendlyName(currentConversation, modelList, settings, true);
  }, [currentConversation, modelList, settings]);

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
    const modelListCopy: Model[] = Object.assign([], modelList);
    const filteredModelList =
      query.length > 0
        ? modelListCopy.filter(
            (model) =>
              model.id.toLowerCase().includes(query) ||
              (model?.name && model.name.toLowerCase().includes(query))
          )
        : modelListCopy;

    setFilteredModels(sortList(sortBy, filteredModelList, !ascending));
  }, [modelList, sortBy, ascending, searchInputRef]);

  useEffect(() => {
    setFilteredModels(sortList(sortBy, modelList, !ascending));
  }, [modelList, currentConversation.model, isCurrentModelAvailable]);

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

  const descriptionIconClickHandler = useCallback(
    (event: any, model: Model) => {
      event.stopPropagation();

      const newShowDescriptionOn =
        showDescriptionOn === model.id ? null : model.id;

      setShowDescriptionOn(newShowDescriptionOn);

      // Unfocus the button when the description is hidden
      if (!newShowDescriptionOn) {
        event.currentTarget.blur();
      }
    },
    [showDescriptionOn]
  );

  return (
    <>
      <div className={className}>
        <button
          className={classNames(
            `rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap hover:text-button-secondary focus:text-button-secondary`,
            {
              "text-red-500": !isCurrentModelAvailable && sync.receivedModels,
              "text-orange-500":
                !isCurrentModelAvailable && !sync.receivedModels,
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
            : sync.receivedModels
            ? t?.modelSelect?.noModelSelected ?? "No model selected"
            : t?.modelSelect?.fetchingModels ?? "Fetching models.."}
        </button>
        <div
          className={`fixed mb-8 overflow-y-auto max-h-[calc(100%-10em)] max-w-[calc(100%-4em)] items-center more-menu border text-menu bg-menu border-menu shadow-xl text-xs rounded
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
              {modelList.length === 0 ? (
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
                  {/* Custom LLM (not OpenAI) - LONG LLM list */}
                  {(modelList.length > 6 ? filteredModels : modelList).map(
                    (model: Model) => (
                      <button
                        key={model.id}
                        className={classNames(
                          "group flex flex-col gap-1 items-start justify-start p-2 w-full",
                          "hover:bg-menu-selection hover:text-menu-selection",
                          "focus:bg-menu-selection focus:text-menu-selection",
                          {
                            "bg-gray-500 bg-opacity-15 border-l-4 border-l-tab-editor-focus":
                              model.id === currentConversation.model?.id,
                          }
                        )}
                        onClick={() => {
                          setModel(model);
                          if (showParentMenu) {
                            showParentMenu(false);
                          }
                        }}
                      >
                        {/* Line 1 - Model name, badges, description icon */}
                        <div className="w-full flex gap-2 items-center justify-between">
                          <div className="flex gap-2 items-center">
                            {/* Model name and badges */}
                            <span className="mt-0.5 text-start font-bold">
                              {model?.name ? (
                                <span>{model.name}</span>
                              ) : (
                                <code>{model.id}</code>
                              )}
                            </span>
                            {isMultimodalModel(model) && (
                              <span className="px-0.5 border-2 border-opacity-50 rounded text-2xs leading-snug opacity-75 group-hover:border-menu-selection group-focus:border-menu-selection">
                                multimodal
                              </span>
                            )}
                            {isOnlineModel(model) && (
                              <span className="px-0.5 border-2 border-opacity-50 rounded text-2xs leading-snug opacity-75 group-hover:border-menu-selection group-focus:border-menu-selection">
                                online
                              </span>
                            )}
                            {model.top_provider?.is_moderated && (
                              <span className="px-0.5 border-2 border-opacity-50 rounded text-2xs leading-snug opacity-75 group-hover:border-menu-selection group-focus:border-menu-selection">
                                moderated
                              </span>
                            )}
                          </div>
                          {/* Icon to show full model description */}
                          {!!model.description?.length && (
                            <button
                              className={classNames(
                                "p-1 rounded text-menu opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-hover:text-menu-selection group-focus:text-menu-selection",
                                "hover:bg-menu focus:bg-menu-selection"
                              )}
                              onClick={(event) =>
                                descriptionIconClickHandler(event, model)
                              }
                            >
                              <Icon icon="help" className="w-3 h-3" />
                              <span className="sr-only">
                                Show model description
                              </span>
                            </button>
                          )}
                        </div>
                        {/* Line 2 - Model description */}
                        {showDescriptionOn === model.id &&
                          !!model.description?.length && (
                            <div
                              className="text-xs text-start text-menu group-hover:text-menu-selection group-focus:text-menu-selection prose prose-a:text-menu prose-a:underline cursor-auto"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {
                                computedModelDataMap.get(model.id)
                                  ?.descriptionComponent
                              }
                            </div>
                          )}
                        {/* Line 2/3 - Model stats */}
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
                                  },
                                  "group-hover:text-menu-selection group-focus:text-menu-selection"
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
                                  },
                                  "group-hover:text-menu-selection group-focus:text-menu-selection"
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
                  {/* Custom LLM (not OpenAI) - LONG LLM list */}
                  {modelList.length > 6 && (
                    <div className="sticky flex flex-col gap-1 bottom-0 p-2 w-full bg-menu">
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <span className="flex-grow opacity-50 text-2xs">
                          Showing {filteredModels.length} of {modelList.length}
                        </span>
                        {/* button list of sort by buttons, the current sort by button is highlighted */}
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            className={classNames(
                              "flex items-center gap-1 p-1 rounded",
                              "bg-menu text-menu hover:bg-menu-selection hover:text-menu-selection focus:bg-menu-selection focus:text-menu-selection",
                              {
                                "text-menu-selection bg-menu-selection":
                                  sortBy === "name",
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
                              "flex items-center gap-1 p-1 rounded",
                              "bg-menu text-menu hover:bg-menu-selection hover:text-menu-selection focus:bg-menu-selection focus:text-menu-selection",
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
                              "flex items-center gap-1 p-1 rounded",
                              "bg-menu text-menu hover:bg-menu-selection hover:text-menu-selection focus:bg-menu-selection focus:text-menu-selection",
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
                              "flex items-center gap-1 p-1 rounded",
                              "bg-menu text-menu hover:bg-menu-selection hover:text-menu-selection focus:bg-menu-selection focus:text-menu-selection",
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
                        className="px-3 py-2 rounded-sm border text-input text-sm border-input bg-input outline-0"
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
              {/* OpenAI - base models */}
              {SUGGESTED_OPENAI_MODELS.filter((model) =>
                modelList.some((m) => m.id === model.id)
              ).map((model) => (
                <ModelOption
                  key={model.id}
                  model={model}
                  currentlySelectedId={currentConversation.model?.id}
                  vscode={vscode}
                  showParentMenu={showParentMenu}
                  currentConversation={currentConversation}
                  setShowModels={setShowModels}
                />
              ))}
              {/* Message for "suggested models" that are not available to the user */}
              {SUGGESTED_OPENAI_MODELS.filter((model) =>
                modelList.some((m) => m.id === model.id)
              ).length > 0 && (
                <>
                  <div className="p-2">
                    <span>
                      {t?.modelSelect?.noUserAccess ??
                        "Models not yet available on your account:"}
                      {SUGGESTED_OPENAI_MODELS.filter(
                        (model) => !modelList.some((m) => m.id === model.id)
                      ).map((model) => (
                        <>
                          {" "}
                          <code key={model.id}>{model.name}</code>
                        </>
                      ))}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
