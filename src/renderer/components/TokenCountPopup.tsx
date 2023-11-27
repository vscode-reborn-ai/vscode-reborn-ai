import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { Conversation, MODEL_COSTS, MODEL_TOKEN_LIMITS, Model } from "../types";

export default function TokenCountPopup({
  currentConversation,
  showTokenBreakdown,
  setTokenCountLabel,
  className,
}: {
  currentConversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
  showTokenBreakdown: boolean;
  setTokenCountLabel: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}) {
  const settings = useAppSelector((state: any) => state.app.extensionSettings);
  const t = useAppSelector((state: any) => state.app.translations);
  const [minCost, setMinCost] = useState(0);
  const [maxCost, setMaxCost] = useState(0);
  const [minPromptTokens, setMinPromptTokens] = useState(
    currentConversation.tokenCount?.minTotal ?? 0
  );
  const [maxPromptTokens, setMaxPromptTokens] = useState(0);
  const [maxCompleteTokens, setMaxCompleteTokens] = useState(0);
  const [promptRate, setPromptRate] = useState(0);
  const [completeRate, setCompleteRate] = useState(0);

  // On model change and token count change, update the token count label
  useEffect(() => {
    const minPromptTokens =
      (currentConversation.tokenCount?.messages ?? 0) +
      (currentConversation.tokenCount?.userInput ?? 0);
    const maxPrompt =
      MODEL_TOKEN_LIMITS[currentConversation.model ?? Model.gpt_35_turbo]
        .prompt;
    const maxComplete =
      MODEL_TOKEN_LIMITS[currentConversation.model ?? Model.gpt_35_turbo]
        .complete;
    let ratePrompt =
      MODEL_COSTS[currentConversation.model ?? Model.gpt_35_turbo].prompt;
    let rateComplete =
      MODEL_COSTS[currentConversation.model ?? Model.gpt_35_turbo].complete;
    let minCost = (minPromptTokens / 1000) * ratePrompt;
    // maxCost is based on current convo text at ratePrompt pricing + theoretical maximum response at rateComplete pricing
    let maxCost = minCost + (maxCompleteTokens / 1000) * rateComplete;

    setMinPromptTokens(minPromptTokens);
    setMaxPromptTokens(maxPrompt);
    setMaxCompleteTokens(maxComplete);
    setPromptRate(ratePrompt);
    setCompleteRate(rateComplete);
    setMinCost(minCost);
    setMaxCost(maxCost);
    setTokenCountLabel(minPromptTokens.toString());
  }, [currentConversation.tokenCount, currentConversation.model]);

  return (
    <div
      className={clsx(
        "TokenCountPopup",
        "absolute w-[calc(100% - 3em) max-w-[25em] items-center border text-menu bg-menu border-menu shadow-xl text-xs rounded z-10 bottom-6 right-4",
        className,
        showTokenBreakdown ? "block" : "hidden"
      )}
    >
      {/* Show a breakdown of the token count with min tokens, max tokens, min cost, and max cost */}
      <div className="p-4 flex flex-col gap-2 whitespace-pre-wrap">
        <h5>
          {t?.questionInputField?.tokenBreakdownHeading ??
            "Pressing Ask will cost..."}
        </h5>
        <p>
          <span className="block">
            <span className="font-bold">
              {t?.questionInputField?.tokenBreakdownAtLeast ?? "At least:"}
            </span>
            <br />
            <span className="font-italic text-[10px]">
              {t?.questionInputField?.tokenBreakdownAtLeastNote ??
                "(no answer)"}
            </span>
          </span>
          <code>{minPromptTokens}</code>{" "}
          {t?.questionInputField?.tokenBreakdownTokensWhichIs ??
            "tokens which is"}
          <code> ${minCost?.toFixed(4) ?? 0}</code>
        </p>
        <p>
          <span className="block">
            <span className="font-bold">
              {t?.questionInputField?.tokenBreakdownAtMost ?? "At most:"}
            </span>
            <br />
            <span className="font-italic text-[10px]">
              {t?.questionInputField?.tokenBreakdownAtMostNote ??
                "(all messages + prompt + longest answer)"}
            </span>
          </span>
          <code>{minPromptTokens + maxCompleteTokens}</code>{" "}
          {t?.questionInputField?.tokenBreakdownTokensWhichIs ??
            "tokens which is"}
          <code> ${maxCost?.toFixed(4) ?? 0}</code>
        </p>
        <p>
          {t?.questionInputField?.tokenBreakdownBasedOn ??
            "This is calculated based on "}
          <code>{currentConversation.model ?? Model.gpt_35_turbo}</code>
          's{" "}
          <a href="https://openai.com/pricing" target="_blank" rel="noreferrer">
            {t?.questionInputField?.tokenBreakdownPricing ?? "pricing"}
          </a>{" "}
          {t?.questionInputField?.tokenBreakdownForPromptsAndCompletions ??
            "for prompts and completions."}
          {`(prompt: $${promptRate} / 1000 tokens, completion: $${completeRate} / 1000 tokens)`}
        </p>
        <p className="italic">
          {t?.questionInputField?.tokenBreakdownRecommendation ??
            "Strongly recommended - clear the conversation routinely to keep the prompt short."}
        </p>

        {/* if gpt-4 or gpt-4-32k is the model, add an additional warning about cost */}
        {(currentConversation.model === Model.gpt_4 ||
          currentConversation.model === Model.gpt_4_32k) && (
          <p className="font-bold">
            {t?.questionInputField?.tokenBreakdownGpt4Warning ??
              `Warning: You are currently using ${
                currentConversation.model
              }, which is ${
                currentConversation.model === Model.gpt_4
                  ? "30x"
                  : currentConversation.model === Model.gpt_4_32k
                  ? "60x"
                  : "3x"
              } more expensive than gpt-3.5-turbo. Consider using gpt-4-turbo, which is 3x cheaper than gpt-4 and 6x cheaper than gpt-4-32k.`}
          </p>
        )}

        {/* gpt_4_turbo cost warning */}
        {currentConversation.model === Model.gpt_4_turbo && (
          <p className="font-bold">
            {t?.questionInputField?.tokenBreakdownGpt4TurboWarning ??
              `Note: You are currently using gpt-4-turbo. Keep in mind that gpt-3.5-turbo is still 10x cheaper.`}
          </p>
        )}
      </div>
    </div>
  );
}
