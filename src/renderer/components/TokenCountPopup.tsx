import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { Conversation, Model } from "../types";

// TODO: this is also in api-provider.ts, consolidate to avoid discrepancies..
const MODEL_TOKEN_LIMITS: Record<Model, number> = {
  [Model.gpt_4]: 8192,
  [Model.gpt_4_32k]: 32768,
  [Model.gpt_35_turbo]: 4096,
  [Model.gpt_35_turbo_16k]: 16384,
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
    let maxTokens = Math.min(
      currentConversation.tokenCount?.maxTotal ?? 0,
      MODEL_TOKEN_LIMITS[currentConversation.model ?? Model.gpt_35_turbo]
    );

    // on tokenCount change, set the cost
    // Based on data from: https://openai.com/pricing
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
      case Model.gpt_4:
        ratePrompt = 0.03;
        rateComplete = 0.06;
        break;
      case Model.gpt_4_32k:
        ratePrompt = 0.06;
        rateComplete = 0.012;
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
  }, [currentConversation.tokenCount, currentConversation.model, minTokens]);

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
        {/* if gpt-4 is the model, add an additional warning about it being 30x more expensive than gpt-3.5-turbo */}
        {(currentConversation.model === Model.gpt_4 ||
          currentConversation.model === Model.gpt_4_32k) && (
          <p className="font-bold">
            {t?.questionInputField?.tokenBreakdownGpt4Warning ??
              `Warning: You are currently using ${
                currentConversation.model
              }, which is ${
                currentConversation.model === Model.gpt_4 ? "30x" : "60x"
              } more expensive than gpt-3.5-turbo.`}
          </p>
        )}
      </div>
    </div>
  );
}
