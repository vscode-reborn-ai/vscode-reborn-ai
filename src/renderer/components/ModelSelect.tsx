import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import Icon from "./Icon";

export default function ModelSelect({
  postMessage,
}: {
  postMessage: (type: string, value?: any, language?: string) => void;
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
            postMessage("setModel", "gpt-3.5-turbo");
            setCurrentModel("gpt-3.5-turbo");
            setShowModels(false);
          }}
        >
          GPT-3.5-TURBO (Fast, recommended)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "gpt-4");
            setCurrentModel("gpt-4");
            setShowModels(false);
          }}
        >
          Waitlist-access - GPT-4 (Better and larger input, but slower and more
          pricey)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "gpt-4-32k");
            setCurrentModel("gpt-4-32k");
            setShowModels(false);
          }}
        >
          Not yet available? - GPT-4-32K (Extremely long input, but slower and
          even more pricey)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "text-davinci-003");
            setCurrentModel("text-davinci-003");
            setShowModels(false);
          }}
        >
          GPT-3 davinci-003 (Cheap/fast, but not as good as GPT-3.5/4)
        </button>
      </div>
    </>
  );
}
