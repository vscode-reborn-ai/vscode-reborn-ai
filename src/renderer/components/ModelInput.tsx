import classNames from "classnames";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../hooks";
import { useMessenger } from "../send-to-backend";
import {
  selectCurrentConversation,
  updateConversationModel,
} from "../store/conversation";
import { Model, Role } from "../types";

export default function ModelInput({
  vscode,
  className,
  dropdownClassName,
  tooltipId,
  showParentMenu,
}: {
  vscode: any;
  className?: string;
  dropdownClassName?: string;
  tooltipId?: string;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch = useAppDispatch();
  const currentConversation = useSelector(selectCurrentConversation);
  const backendMessenger = useMessenger(vscode);
  const [modelId, setModelId] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModelId(event.target.value);
  };

  const handleModelSubmit = () => {
    const model: Model = {
      id: modelId,
      name: modelId,
      created: Date.now(),
      object: "model",
      owned_by: Role.user,
    };

    backendMessenger.sendModelUpdate(model);

    if (!currentConversation) {
      console.error("No current conversation found");
      return;
    }

    dispatch(
      updateConversationModel({
        conversationId: currentConversation?.id,
        model,
      })
    );

    setShowPopup(false);
  };

  return (
    <>
      <div className={classNames(className, "relative")}>
        <button
          className="rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap"
          onClick={() => setShowPopup(!showPopup)}
          data-tooltip-id={tooltipId ?? "footer-tooltip"}
          data-tooltip-content="Enter model ID manually"
        >
          <span>{modelId || "Enter Model ID"}</span>
        </button>

        <div
          className={classNames(
            "fixed mb-8 overflow-y-auto max-h-[calc(100%-7em)] items-center more-menu border text-menu bg-menu border-menu shadow-xl text-xs rounded",
            { block: showPopup, hidden: !showPopup },
            dropdownClassName ? dropdownClassName : "left-4 z-10"
          )}
        >
          <div className="w-full flex gap-2 p-2">
            <input
              type="text"
              placeholder="Enter Model ID"
              value={modelId}
              onChange={handleModelChange}
              className="px-3 py-2 rounded-sm border text-input text-sm border-input bg-menu-selection outline-0"
            />
            <button
              onClick={handleModelSubmit}
              className="w-full px-3 py-2 bg-button-secondary hover:bg-button-primary text-white rounded"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
