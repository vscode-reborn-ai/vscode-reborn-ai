import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import { setApiKeyStatus } from "../store/app";
import { ApiKeyStatus } from "../store/types";
import Icon from "./Icon";

export default function ({
  vscode,
  className,
}: {
  vscode: any;
  className?: string;
}) {
  const apiKeyPlaceholder = "sk-...";
  const apiUrlPlaceholder = "https://openai-proxy.dev/v1";
  // Azure API support is not quite ready yet - API provider needs to be refactored
  // const apiUrlPlaceholder =
  //   "https://example-with-azure-openai.openai.azure.com/openai/deployments/your-deployment-name";

  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [showApiUrl, setShowApiUrl] = useState(false);
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app?.apiKeyStatus
  );
  const backendMessenger = useMessenger(vscode);
  const apiUrlInputRef = React.createRef<HTMLInputElement>();

  function handleSubmit() {
    dispatch(setApiKeyStatus(ApiKeyStatus.Pending));

    if (showApiUrl && apiUrl) {
      backendMessenger.sendChangeApiUrl(apiUrl);
    }

    backendMessenger.sendChangeApiKey(apiKey);
  }

  return (
    <div
      className={`flex flex-col justify-start gap-3.5 h-full items-center px-6 pt-6 pb-24 w-full relative login-screen overflow-auto ${className}`}
    >
      {/* Info: Heading */}
      <Icon icon="help" className="w-16 h-16" />
      <div className="w-full max-w-lg flex flex-col gap-3.5 text-xs">
        <div className="flex items-center gap-4">
          <Icon icon="box" className="w-24 h-24 p-2" />
          <div className="flex-grow flex flex-col justify-start">
            <h1 className="text-xl mb-2">
              {t?.apiKeySetup?.heading ?? "OpenAI API Key Setup"}
            </h1>
            <p className="font-semibold">
              {t?.apiKeySetup?.instructions?.toUseExtension ??
                "To use this extension, you must have an OpenAI API key. You can follow the instructions below to get one."}
            </p>
          </div>
        </div>
        {/* Info: Instructions */}
        <div>
          <h2 className="text-lg mb-1">
            {t?.apiKeySetup?.instructions?.title ?? "Instructions:"}
          </h2>
          <ol className="list-decimal list-inside">
            <li>
              {t?.apiKeySetup?.instructions?.step1 ??
                "Create an OpenAI account if you haven't at"}{" "}
              <a href="https://platform.openai.com" target="_blank">
                https://platform.openai.com
              </a>
            </li>
            <li>
              {t?.apiKeySetup?.instructions?.step2 ?? "Then, go to"}{" "}
              <a href="https://platform.openai.com/account/api-keys">
                https://platform.openai.com/account/api-keys
              </a>
            </li>
            <li>
              {t?.apiKeySetup?.instructions?.step3 ?? 'Click "Create API Key"'}
            </li>
            <li>
              {t?.apiKeySetup?.instructions?.step4 ??
                "Copy the key and paste it in the text input below to set it up."}
            </li>
            <li>
              {t?.apiKeySetup?.instructions?.step5a ??
                "On submit the key is securely stored on your computer using VSCode secret storage. It is never sent to any server. (This extension is open source, so"}{" "}
              <a
                href="https://github.com/vscode-reborn-ai/vscode-reborn-ai"
                target="_blank"
              >
                {t?.apiKeySetup?.instructions?.step5b ??
                  "you can even check for yourself"}
              </a>
              {t?.apiKeySetup?.instructions?.step5c ?? "!)"}
            </li>
          </ol>
        </div>
        {/* API key: user input */}
        <div>
          <label htmlFor="apiKey" className="block font-bold mb-2">
            {t?.apiKeySetup?.apiKeyLabel ?? "API Key"}
          </label>
          <div className="flex gap-x-4">
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={apiKeyPlaceholder}
              className="flex-grow px-3 py-2 rounded-sm border text-input text-sm border-input bg-input outline-0"
              disabled={apiKeyStatus === ApiKeyStatus.Pending}
            />
          </div>
        </div>
        {/* API key: error message */}
        {apiKeyStatus === ApiKeyStatus.Invalid &&
          !!apiUrlInputRef.current?.value.length && (
            <div className="flex flex-col gap-2 p-4 bg-red-500 text bg-opacity-10 rounded">
              <h2 className="font-medium">
                {t?.apiKeySetup?.invalidApiKey?.title ?? "Invalid API Key"}
              </h2>
              <p>
                {t?.apiKeySetup?.invalidApiKey?.description ??
                  "The API key you entered has failed to get an OK response from OpenAI. Please double check the key was copied in correctly. Also, check that OpenAI is not currently experiencing an API outage. ("}
                <a href="https://status.openai.com/" target="_blank">
                  https://status.openai.com/
                </a>
                {t?.apiKeySetup?.invalidApiKey?.closingParenthesis ?? ")"}
              </p>
            </div>
          )}
        {/* API URL: user input */}
        {showApiUrl && (
          <div>
            <label htmlFor="apiKey" className="block font-bold mb-2">
              {t?.apiKeySetup?.altApiUrl ?? "Alternative API URL (Optional)"}
            </label>
            <p className="text-xs mb-2">
              {t?.apiKeySetup?.altApiUrlDescription ??
                "The url should start with 'https'. The API url should NOT include /chat/completions. OpenAI API proxies should work without issues. OpenAI proxy URLs should end with /v1. Other models like Claude will not work unless they are using the same API as OpenAI. Azure's API is not yet supported."}
            </p>
            <div className="flex gap-x-4">
              <input
                type="text"
                ref={apiUrlInputRef}
                id="apiUrl"
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
                placeholder={apiUrlPlaceholder}
                className="flex-grow px-3 py-2 rounded-sm border text-input text-sm border-input bg-input outline-0"
                disabled={apiKeyStatus === ApiKeyStatus.Pending}
              />
            </div>
          </div>
        )}
        {/* Buttons */}
        <div className="flex gap-x-4 justify-end">
          {/* "I'm using an alternative API" button */}
          {!showApiUrl && (
            // <button
            //   onClick={() => setShowApiUrl(true)}
            //   className="ask-button rounded px-4 py-2 flex flex-row items-center bg-button-secondary hover:bg-button-secondary-hover focus:bg-button-secondary-hover"
            // >
            //   {t?.apiUrlSetup?.setApiUrl ?? "I'm using an alternative API"}
            // </button>
            <Link
              to="/api"
              className="rounded px-4 py-2 flex flex-row items-center text-button-secondary bg-button-secondary hover:bg-button-secondary-hover focus:bg-button-secondary-hover hover:text-button-secondary-hover focus:text-button-secondary-hover"
            >
              {t?.apiUrlSetup?.setApiUrl ?? "I'm using an alternative API"}
            </Link>
          )}
          {/* "Set API Key" button */}
          <button
            onClick={handleSubmit}
            className="ask-button rounded px-4 py-2 flex flex-row items-center bg-button hover:bg-button-hover focus:bg-button-hover"
            disabled={apiKeyStatus === ApiKeyStatus.Pending}
          >
            {apiKeyStatus === ApiKeyStatus.Pending ? (
              <>
                <Icon icon="ripples" className="w-4 h-4 ml-2" />
                {t?.apiKeySetup?.settingApiKey ?? "Setting API Key..."}
              </>
            ) : (
              <span>{t?.apiKeySetup?.setApiKey ?? "Set API Key"}</span>
            )}
          </button>
        </div>
        {/* Info: openai pricing */}
        <div className="flex flex-col gap-2 p-4 bg-purple-500 text bg-opacity-10 rounded">
          <h2 className="font-medium">
            {t?.apiKeySetup?.openAIAPICosts?.title ??
              "Note: OpenAI API has costs associated with it"}
          </h2>
          <p>
            {t?.apiKeySetup?.openAIAPICosts?.description ??
              "If you're not already aware - OpenAI's API does have costs associated with it. However, new accounts do receive a $5 credit to get started. When you ask a question in this extension, it will likely cost a fraction of a cent in API usage."}
          </p>
          <p>
            {t?.apiKeySetup?.openAIAPICosts?.examplePart1 ??
              "For example if all of the text in this extension window was from ai, it would've cost"}{" "}
            <span className="font-code">$0.00054</span>{" "}
            {t?.apiKeySetup?.openAIAPICosts?.examplePart2 ??
              "in API usage on GPT-3.5-turbo. Beware if you use OpenAI's, GPT-4, it is"}{" "}
            <span className="font-code underline">30x</span>{" "}
            {t?.apiKeySetup?.openAIAPICosts?.examplePart3 ??
              "more expensive than GPT-3.5-turbo at"}{" "}
            <span className="font-code">$0.01848</span>.
          </p>
          <a href="https://openai.com/pricing" className="underline">
            {t?.apiKeySetup?.openAIAPICosts?.moreDetails ??
              "View openai.com/pricing for more details"}
          </a>
        </div>
      </div>
    </div>
  );
}
