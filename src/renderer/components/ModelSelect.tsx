import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import { Conversation, Model } from "../../types";
import Icon from "./Icon";

export default function ModelSelect({
  vscode,
  currentConversation,
}: {
  vscode: any;
  currentConversation: Conversation;
}) {
  const [showModels, setShowModels] = useState(false);
  const [currentModel, setCurrentModel] = useState("gpt-3.5-turbo");

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
        {currentModel}
      </button>
      <Tooltip id="model-select-tooltip" place="top" delayShow={800} />
      <div
        className={`absolute bottom-12 items-center more-menu left-4 border text-menu bg-menu border-menu shadow-xl text-xs
            ${showModels ? "block" : "hidden"}
          `}
      >
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            vscode.postMessage({
              type: "setModel",
              value: Model.gpt_35_turbo,
              conversationId: currentConversation.id,
            });
            setCurrentModel(Model.gpt_35_turbo);
            setShowModels(false);
          }}
        >
          GPT-3.5-TURBO (Fast, recommended)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            vscode.postMessage({
              type: "setModel",
              value: Model.gpt_4,
              conversationId: currentConversation.id,
            });
            setCurrentModel(Model.gpt_4);
            setShowModels(false);
          }}
        >
          Waitlist-access - GPT-4 (Better and larger input, but slower and more
          pricey)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            vscode.postMessage({
              type: "setModel",
              value: Model.gpt_4_32k,
              conversationId: currentConversation.id,
            });
            setCurrentModel(Model.gpt_4_32k);
            setShowModels(false);
          }}
        >
          Not yet available? - GPT-4-32K (Extremely long input, but slower and
          even more pricey)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            vscode.postMessage({
              type: "setModel",
              value: Model.text_davinci_003,
              conversationId: currentConversation.id,
            });
            setCurrentModel(Model.text_davinci_003);
            setShowModels(false);
          }}
        >
          GPT-3 davinci-003 (Cheap/fast, but not as good as GPT-3.5/4)
        </button>
      </div>
    </>
  );
}
