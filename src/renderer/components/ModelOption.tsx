import classNames from "classnames";
import React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { updateConversationModel } from "../store/conversation";
import { Conversation, Model, MODEL_TOKEN_LIMITS } from "../types";
import { RichModel } from "./ModelSelect";

export default function ModelOption({
  model,
  currentlySelectedId,
  vscode,
  showParentMenu,
  currentConversation,
  setShowModels,
}: {
  currentConversation: Conversation;
  model: RichModel;
  currentlySelectedId?: string;
  vscode: any;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowModels: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isSelected = model.id === currentlySelectedId;
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const backendMessenger = useMessenger(vscode);
  const models: Model[] = useAppSelector(
    (state: RootState) => state.app.models
  );
  const [selectedModel, setSelectedModel] = React.useState<Model | undefined>(
    undefined
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

  // Calculate currently selected OpenAI model
  // (converts from RichModel to Model)
  React.useEffect(() => {
    setSelectedModel(models.find((m) => m.id === model.id));
  }, [models, currentlySelectedId, model]);

  return (
    <button
      className={classNames(
        "group flex flex-col gap-2 items-start justify-start p-2 w-full",
        "hover:bg-menu-selection hover:text-menu-selection",
        "focus:bg-menu-selection focus:text-menu-selection",
        {
          "bg-gray-500 bg-opacity-15 border-l-4 border-l-tab-editor-focus":
            isSelected,
        }
      )}
      onClick={() => {
        if (selectedModel) {
          setModel(selectedModel);
        } else {
          console.error(
            "ModelOption: selectedModel is undefined, cannot set model"
          );
        }

        if (showParentMenu) {
          showParentMenu(false);
        }
      }}
    >
      <span>
        <code className="group-hover:text-menu-selection group-focus:text-menu-selection">
          {model.name}
        </code>
        {model.recommended && <strong> (recommended)</strong>}
      </span>
      <p>
        Quality: {model.quality}, Speed: {model.speed}, Cost: {model.cost},
        Context:{" "}
        <code className="group-hover:text-menu-selection group-focus:text-menu-selection">
          {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.context}
        </code>
        {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.max && (
          <>
            , Completion:{" "}
            <code className="group-hover:text-menu-selection group-focus:text-menu-selection">
              {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.max}
            </code>
          </>
        )}
      </p>
    </button>
  );
}
