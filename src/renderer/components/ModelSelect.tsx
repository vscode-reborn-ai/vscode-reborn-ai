import React, { useState } from "react";
import Icon from "./Icon";

export default function ModelSelect() {
  const [showModels, setShowModels] = useState(false);

  return (
    <>
      <button
        title="Change models"
        className="rounded-lg p-0.5"
        onClick={() => {
          setShowModels(!showModels);
        }}
      >
        <Icon icon="box" className="w-3 h-3 mr-1" />
        gpt-3.5-turbo
      </button>
      <div
        className={`absolute bottom-14 items-center more-menu right-8 border text-menu bg-menu border-menu shadow-xl text-xs
            ${showModels ? "block" : "hidden"}
          `}
      >
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "gpt-3.5-turbo");
          }}
        >
          GPT-3.5-TURBO (Fast, recommended)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "gpt-4");
          }}
        >
          GPT-4 (Better and larger input, but slower and more pricey)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "gpt-4-32k");
          }}
        >
          Not yet available? - GPT-4-32K (Extremely long input, but slower and
          even more pricey)
        </button>
        <button
          className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
          onClick={() => {
            postMessage("setModel", "text-davinci-003");
          }}
        >
          GPT-3 davinci-003 (Cheap/fast, but not as good as GPT-3.5/4)
        </button>
      </div>
    </>
  );
}
