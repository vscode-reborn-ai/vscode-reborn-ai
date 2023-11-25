import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { Conversation, Model } from "../types";

// TODO: this is also in api-provider.ts, consolidate to avoid discrepancies..
// TODO: Need to separately track input and output limits
const MODEL_TOKEN_LIMITS: Record<Model, number> = {
  [Model.gpt_4_turbo]: 4096,
  [Model.gpt_4]: 8192,
  [Model.gpt_4_32k]: 32768,
  // TODO - Dec 11, 20(23, gpt_35_turbo will start pointing to the 16k model
  [Model.gpt_35_turbo]: 4096,
  [Model.gpt_35_turbo_16k]: 16384,
  // Note: These models are not yet supported in this extension
  [Model.text_davinci_003]: 4097,
  [Model.text_curie_001]: 2049,
  [Model.text_babbage_001]: 2049,
  [Model.text_ada_001]: 2049,
  [Model.code_davinci_002]: 4097,
  [Model.code_cushman_001]: 2049,
};

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
  const [minTokens, setMinTokens] = useState(
    currentConversation.tokenCount?.minTotal ?? 0
  );
  const [maxTokens, setMaxTokens] = useState(0);

  useEffect(() => {
    setMinTokens(
      Math.min(
        (currentConversation.tokenCount?.messages ?? 0) +
          (currentConversation.tokenCount?.userInput ?? 0),
        currentConversation.tokenCount?.maxTotal ?? 0
      )
    );
  }, [currentConversation.tokenCount, currentConversation.model]);

  useEffect(() => {
    setMaxTokens(
      Math.min(
        currentConversation.tokenCount?.maxTotal ?? 0,
        MODEL_TOKEN_LIMITS[currentConversation.model ?? Model.gpt_35_turbo]
      )
    );
  }, [currentConversation.tokenCount, currentConversation.model]);

  useEffect(() => {
    // on tokenCount change, set the cost
    // Based on data from: https://openai.com/pricing (as of 2023-11-24)
    // TODO: update dec 11, 2023
    let rateComplete = 0;
    let ratePrompt = 0;
    switch (currentConversation.model) {
      case Model.gpt_35_turbo:
        ratePrompt = 0.0015;
        rateComplete = 0.002;
        break;
      case Model.gpt_35_turbo_16k:
        ratePrompt = 0.003;
        rateComplete = 0.004;
        break;
      case Model.gpt_4_turbo:
        ratePrompt = 0.01;
        rateComplete = 0.03;
        break;
      case Model.gpt_4:
        ratePrompt = 0.03;
        rateComplete = 0.06;
        break;
      case Model.gpt_4_32k:
        ratePrompt = 0.06;
        rateComplete = 0.12;
        break;
      default:
        rateComplete = -1;
    }
    let minCost = (minTokens / 1000) * ratePrompt;
    // maxCost is based on current convo text at ratePrompt pricing + theoretical maximum response at rateComplete pricing
    let maxCost =
      minCost + (Math.max(0, maxTokens - minTokens) / 1000) * rateComplete;

    setMinCost(minCost);
    setMaxCost(maxCost);

    setTokenCountLabel(minTokens.toString());
  }, [
    currentConversation.tokenCount,
    currentConversation.model,
    minTokens,
    maxTokens,
  ]);

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
          <code>{minTokens}</code>{" "}
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
          <code>{currentConversation.tokenCount?.maxTotal ?? 0}</code>{" "}
          {t?.questionInputField?.tokenBreakdownTokensWhichIs ??
            "tokens which is"}
          <code> ${maxCost?.toFixed(4) ?? 0}</code>
        </p>
        <p>
          {t?.questionInputField?.tokenBreakdownBasedOn ??
            "This is calculated based on the"}{" "}
          <code>{settings?.gpt3?.maxTokens ?? "??"}</code> "
          <code>{t?.questionInputField?.maxTokens ?? "maxTokens"}</code>"{" "}
          {t?.questionInputField?.tokenBreakdownConfigSettingAnd ??
            "config setting and"}{" "}
          <code>{currentConversation.model ?? Model.gpt_35_turbo}</code>
          's{" "}
          <a href="https://openai.com/pricing" target="_blank" rel="noreferrer">
            {t?.questionInputField?.tokenBreakdownPricing ?? "pricing"}
          </a>{" "}
          {t?.questionInputField?.tokenBreakdownForPromptsAndCompletions ??
            "for prompts and completions."}
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
