import React, { useState } from "react";
import { ApiKeyStatus, setApiKeyStatus } from "../actions/app";
import { useAppDispatch, useAppSelector } from "../hooks";
import Icon from "./Icon";

export default function ({
  vscode,
  className,
}: {
  vscode: any;
  className?: string;
}) {
  const [apiKey, setApiKey] = useState("");
  const dispatch = useAppDispatch();
  const apiKeyStatus = useAppSelector((state: any) => state.app?.apiKeyStatus);

  function handleSubmit() {
    dispatch(setApiKeyStatus(ApiKeyStatus.Pending));

    vscode.postMessage({
      type: "changeApiKey",
      value: apiKey,
    });
  }

  return (
    <div
      className={`flex flex-col justify-start gap-3.5 h-full items-center px-6 pt-6 pb-24 w-full relative login-screen overflow-auto ${className}`}
    >
      <Icon icon="help" className="w-16 h-16" />
      <div className="w-full max-w-lg flex flex-col gap-3.5 text-xs">
        <div className="flex items-center gap-4">
          <Icon icon="box" className="w-24 h-24 p-2" />
          <div className="flex-grow flex flex-col justify-start">
            <h1 className="text-xl mb-2">OpenAI API Key Setup</h1>
            <p className="font-semibold">
              To use this extension, you must have an OpenAI API key. You can
              can follow the instructions below to get one.
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-lg mb-1">Instructions:</h2>
          <ol className="list-decimal list-inside">
            <li>
              Create an OpenAI account if you haven't at{" "}
              <a href="https://platform.openai.com" target="_blank">
                https://platform.openai.com
              </a>
            </li>
            <li>
              Then, go to{" "}
              <a href="https://beta.openai.com/account/api-keys">
                https://beta.openai.com/account/api-keys
              </a>
            </li>
            <li>Click "Create API Key"</li>
            <li>
              Copy the key and paste it in the text input below to set it up.
            </li>
            <li>
              On submit the key is securely stored on your computer using VSCode
              secret storage. It is never sent to any server. (This extension is
              open source, so{" "}
              <a
                href="https://github.com/Christopher-Hayes/vscode-chatgpt-reborn"
                target="_blank"
              >
                you can even check for yourself
              </a>
              !)
            </li>
          </ol>
        </div>
        <div>
          <label htmlFor="apiKey" className="block font-bold mb-2">
            API Key
          </label>
          <div className="flex gap-x-4">
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-..."
              className="flex-grow px-3 py-2 rounded border text-input text-sm border-input bg-input outline-0"
              disabled={apiKeyStatus === ApiKeyStatus.Pending}
            />
            <button
              onClick={handleSubmit}
              className="ask-button rounded px-4 py-2 flex flex-row items-center bg-button hover:bg-button-hover focus:bg-button-hover"
              disabled={apiKeyStatus === ApiKeyStatus.Pending}
            >
              {apiKeyStatus === ApiKeyStatus.Pending ? (
                <>
                  <Icon icon="ripples" className="w-4 h-4 ml-2" />
                  Setting API Key...
                </>
              ) : (
                <span>Set API Key</span>
              )}
            </button>
          </div>
        </div>
        {apiKeyStatus === ApiKeyStatus.Invalid && (
          <div className="flex flex-col gap-2 p-4 bg-red-500 text bg-opacity-10 rounded">
            <h2 className="font-medium">Invalid API Key</h2>
            <p>
              The API key you entered has failed to get an OK response from
              OpenAI. Please double check the key was copied in correctly. Also,
              check that OpenAI is not currently experiencing an API outage. (
              <a href="https://status.openai.com/" target="_blank">
                https://status.openai.com/
              </a>
              )
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2 p-4 bg-purple-500 text bg-opacity-10 rounded">
          <h2 className="font-medium">
            Note: OpenAI API has costs associated with it
          </h2>
          <p>
            If you're not already aware - OpenAI's API does have costs
            associated with it. However, new accounts do receive a $5 credit to
            get started. When you ask a question in this extension, it will
            likely cost a fraction of a cent in API usage.
          </p>
          {/* At the time of calculation (3/26/2023), GPT-3.5-turbo is $0.002 / 1K tokens and GPT-4 is $0.06 / 1K tokens. */}
          <p>
            For example if all of the text in this extension window was from ai,
            it would've cost <span className="font-code">$0.00054</span> in API
            usage on GPT-3.5-turbo. Beware if you use OpenAI's latest model,
            GPT-4, it is <span className="font-code underline">30x</span> more
            expensive than GPT-3.5-turbo at{" "}
            <span className="font-code">$0.01848</span>.
          </p>
          <a href="https://openai.com/pricing" className="underline">
            View openai.com/pricing for more details
          </a>
        </div>
      </div>
    </div>
  );
}
