import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import { Conversation, MODEL_COSTS, MODEL_TOKEN_LIMITS } from "../types";

const FALLBACK_MODEL_ID = "gpt-4-turbo";

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
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [minCost, setMinCost] = useState(0);
  const [maxCost, setMaxCost] = useState(0);
  const [minPromptTokens, setMinPromptTokens] = useState(
    currentConversation.tokenCount?.minTotal ?? 0
  );
  const [maxCompleteTokens, setMaxCompleteTokens] = useState(0);
  const [promptRate, setPromptRate] = useState(0);
  const [completeRate, setCompleteRate] = useState(0);

  // On model change and token count change, update the token count label
  useEffect(() => {
    const minPromptTokens =
      (currentConversation.tokenCount?.messages ?? 0) +
      (currentConversation.tokenCount?.userInput ?? 0);
    const modelId = currentConversation.model?.id ?? FALLBACK_MODEL_ID;
    const modelContextLimit = MODEL_TOKEN_LIMITS.has(modelId)
      ? MODEL_TOKEN_LIMITS.get(modelId)?.context ?? 128000
      : 128000;
    const modelMax = MODEL_TOKEN_LIMITS.has(modelId)
      ? MODEL_TOKEN_LIMITS.get(modelId)?.max ?? 4096
      : 4096;
    let maxCompleteTokens = modelContextLimit - minPromptTokens;

    if (modelMax) {
      maxCompleteTokens = Math.min(maxCompleteTokens, modelMax);
    }

    let ratePrompt = MODEL_COSTS.has(modelId)
      ? MODEL_COSTS.get(modelId)?.prompt ?? 0
      : 0;
    let rateComplete = MODEL_COSTS.has(modelId)
      ? MODEL_COSTS.get(modelId)?.complete ?? 0
      : 0;
    let minCost = (minPromptTokens / 1000) * ratePrompt;
    // maxCost is based on current convo text at ratePrompt pricing + theoretical maximum response at rateComplete pricing
    let maxCost = minCost + (maxCompleteTokens / 1000) * rateComplete;

    setMinPromptTokens(minPromptTokens);
    setMaxCompleteTokens(maxCompleteTokens);
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
              <br />(
              <code>{currentConversation.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation.tokenCount?.userInput ?? 0}</code>)
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
              <br />(
              <code>{currentConversation.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation.tokenCount?.userInput ?? 0}</code> +{" "}
              <code>{maxCompleteTokens})</code>
            </span>
          </span>
          <code>{minPromptTokens + maxCompleteTokens}</code>{" "}
          {t?.questionInputField?.tokenBreakdownTokensWhichIs ??
            "tokens which is"}
          <code> ${maxCost?.toFixed(4) ?? 0}</code>
        </p>
        <p>
          {t?.questionInputField?.tokenBreakdownBasedOn ??
            "This is calculated based on"}{" "}
          <code>{currentConversation.model?.id ?? "gpt-3.5-turbo"}</code>
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
        {(currentConversation.model?.id === "gpt-4" ||
          currentConversation.model?.id === "gpt-4-32k") && (
          <p className="font-bold">
            {t?.questionInputField?.tokenBreakdownGpt4Warning ??
              `Warning: You are currently using ${
                currentConversation.model?.id
              }, which is ${
                currentConversation.model?.id === "gpt-4"
                  ? "30x"
                  : currentConversation.model?.id === "gpt-4-32k"
                  ? "60x"
                  : "3x"
              } more expensive than gpt-3.5-turbo. Consider using gpt-4-turbo, which is 3x cheaper than gpt-4 and 6x cheaper than gpt-4-32k.`}
          </p>
        )}

        {/* gpt_4_turbo cost warning */}
        {currentConversation.model?.id === "gpt-4-turbo" && (
          <p className="font-bold">
            {t?.questionInputField?.tokenBreakdownGpt4TurboWarning ??
              `Note: You are currently using gpt-4-turbo. Keep in mind that gpt-3.5-turbo is still 10x cheaper.`}
          </p>
        )}
      </div>
    </div>
  );
}
