import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getModelCompletionLimit,
  getModelContextLimit,
  getModelRates,
} from "../helpers";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import { selectCurrentConversation } from "../store/conversation";
import { Conversation } from "../types";
import Icon from "./Icon";

const FALLBACK_MODEL_ID = "gpt-4-turbo";

export default function TokenCountPopup({
  showTokenBreakdown,
  setTokenCountLabel,
  className,
}: {
  conversationList: Conversation[];
  vscode: any;
  showTokenBreakdown: boolean;
  setTokenCountLabel: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}) {
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const currentConversation = useSelector(selectCurrentConversation);
  const t = useAppSelector((state: RootState) => state.app.translations);
  const [minCost, setMinCost] = useState<number | undefined>(undefined);
  const [maxCost, setMaxCost] = useState<number | undefined>(undefined);
  const [minPromptTokens, setMinPromptTokens] = useState(
    currentConversation?.tokenCount?.minTotal ?? 0
  );
  const [maxCompleteTokens, setMaxCompleteTokens] = useState(0);
  const [promptRate, setPromptRate] = useState<number | undefined>(undefined);
  const [completeRate, setCompleteRate] = useState<number | undefined>(
    undefined
  );

  // On model change and token count change, update the token count label
  useEffect(() => {
    const minPromptTokens =
      (currentConversation?.tokenCount?.messages ?? 0) +
      (currentConversation?.tokenCount?.userInput ?? 0);
    const modelId = currentConversation?.model?.id ?? FALLBACK_MODEL_ID;

    // Limits
    const modelContextLimit = getModelContextLimit(currentConversation?.model);
    const modelMax = getModelCompletionLimit(currentConversation?.model);
    let maxCompleteTokens = modelContextLimit - minPromptTokens;

    if (modelMax) {
      maxCompleteTokens = Math.min(maxCompleteTokens, modelMax);
    }

    // Rates
    const rates = getModelRates(currentConversation?.model);
    let minCost =
      rates.prompt !== undefined
        ? (minPromptTokens / 1000000) * rates.prompt
        : undefined;
    // maxCost is based on current convo text at ratePrompt pricing + theoretical maximum response at rateComplete pricing
    let maxCost =
      minCost !== undefined && rates.complete !== undefined
        ? minCost + (maxCompleteTokens / 1000000) * rates.complete
        : undefined;

    setMinPromptTokens(minPromptTokens);
    setMaxCompleteTokens(maxCompleteTokens);
    setPromptRate(rates.prompt);
    setCompleteRate(rates.complete);
    setMinCost(minCost);
    setMaxCost(maxCost);
    setTokenCountLabel(minPromptTokens.toString());
  }, [currentConversation?.tokenCount, currentConversation?.model]);

  return (
    <div
      className={classNames(
        "TokenCountPopup",
        "mb-4 absolute w-[calc(100% - 3em) max-w-[25em] items-center border text-menu bg-menu border-menu shadow-xl text-xs rounded z-10 right-4",
        className,
        showTokenBreakdown ? "block" : "hidden"
      )}
    >
      {/* Show a breakdown of the token count with min tokens, max tokens, min cost, and max cost */}
      <div className="p-4 flex flex-col gap-2 whitespace-pre-wrap">
        <h5 className="flex items-center gap-1">
          <Icon icon="help" className="w-3 h-3" />
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
                "(message history + no answer)"}
              <br />(
              <code>{currentConversation?.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation?.tokenCount?.userInput ?? 0}</code>)
            </span>
          </span>
          <code>{minPromptTokens}</code>{" "}
          {/* {t?.questionInputField?.tokenBreakdownTokensWhichIs ?? */}
          {/* TODO: update translations */}
          {"tokens"}
          {" = "}
          <code>${minCost?.toFixed(2) ?? "???"}</code>
        </p>
        <p>
          <span className="block">
            <span className="font-bold">
              {t?.questionInputField?.tokenBreakdownAtMost ?? "At most:"}
            </span>
            <br />
            <span className="font-italic text-[10px]">
              {t?.questionInputField?.tokenBreakdownAtMostNote ??
                "(message history + prompt + longest answer)"}
              {/* TODO: update translations from 'all messages' to 'message history' */}
              <br />(
              <code>{currentConversation?.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation?.tokenCount?.userInput ?? 0}</code> +{" "}
              <code>{maxCompleteTokens}</code>)
            </span>
          </span>
          <code>{minPromptTokens + maxCompleteTokens}</code>{" "}
          {/* {t?.questionInputField?.tokenBreakdownTokensWhichIs ?? */}
          {/* "tokens which is "} */}
          {/* TODO: update translations */}
          {"tokens"}
          {" = "}
          <code>${maxCost?.toFixed(2) ?? "???"}</code>
        </p>
        <p className="italic">
          {t?.questionInputField?.tokenBreakdownRecommendation ??
            "Tip: Make a new chat routinely to keep costs low."}
        </p>

        {/* if gpt-4 or gpt-4-32k is the model, add an additional warning about cost */}
        {(currentConversation?.model?.id === "gpt-4" ||
          currentConversation?.model?.id === "gpt-4-32k") && (
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
        {currentConversation?.model?.id === "gpt-4-turbo" && (
          <p className="font-bold">
            {t?.questionInputField?.tokenBreakdownGpt4TurboWarning ??
              `Note: You are currently using gpt-4-turbo. Keep in mind that gpt-3.5-turbo is still 10x cheaper.`}
          </p>
        )}
      </div>
    </div>
  );
}
