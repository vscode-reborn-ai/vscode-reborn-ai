import React, { useState } from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";

const examplePrompts = [
  { category: "Greetings", prompts: ["Hello", "Hi", "Hey"] },
  { category: "Farewells", prompts: ["Goodbye", "Bye", "See you later"] },
];

function CustomPromptManager() {
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [prompts, setPrompts] = useState(Array(6).fill(""));
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

  const addPrompt = (text: string) => {
    setPrompts([...prompts, text]);
  };

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, newText: string) => {
    setPrompts(prompts.map((p, i) => (i === index ? newText : p)));
  };

  return (
    <div className="relative">
      {showTemplatePanel && (
        <div
          className="absolute top-0 left-0 w-full h-full bg-gray-200 p-4 z-10"
          onClick={() => setShowTemplatePanel(false)}
        >
          <div className="relative w-full h-full p-4">
            <button
              className="absolute top-0 right-0 p-2"
              onClick={() => setShowTemplatePanel(false)}
            >
              {t?.customPromptPanel?.closeButton ?? "Close"}
            </button>
            {examplePrompts.map(({ category, prompts: examplePs }) => (
              <div key={category}>
                <h3>{category}</h3>
                <ul>
                  {examplePs.map((p) => (
                    <li
                      key={p}
                      className="cursor-pointer"
                      onClick={() => {
                        addPrompt(p);
                        setShowTemplatePanel(false);
                      }}
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      <ul>
        {prompts.map((prompt, index) => (
          <li key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => updatePrompt(index, e.target.value)}
              className="border-2 border-gray-300 p-2 rounded w-full mr-2"
            />
            <button
              onClick={() => removePrompt(index)}
              className="bg-red-500 text-white p-2 rounded"
            >
              X
            </button>
          </li>
        ))}
      </ul>
      <button
        className="bg-blue-500 text-white p-2 rounded mr-2"
        onClick={() => addPrompt("")}
      >
        {t?.customPromptPanel?.newButton ?? "New"}
      </button>
      <button
        className="bg-green-500 text-white p-2 rounded"
        onClick={() => setShowTemplatePanel(true)}
      >
        {t?.customPromptPanel?.newFromTemplateButton ?? "New from Template"}
      </button>
    </div>
  );
}

export default CustomPromptManager;
