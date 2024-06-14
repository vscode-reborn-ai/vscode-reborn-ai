import React, { useEffect, useState } from "react";
import CodeBlock from "../components/CodeBlock";
import { useDebounce } from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../sent-to-backend";
import { RootState } from "../store";
import {
  ApiKeyStatus,
  setApiKeyStatus,
  setExtensionSettings,
} from "../store/app";
import { DEFAULT_EXTENSION_SETTINGS } from "../types";

const API_KEY_PLACEHOLDER = "sk-...";
interface LlmTemplate {
  name: string;
  instructions: string;
  apiUrl?: URL;
  docsUrl?: URL;
  showApiKeyInput?: boolean;
  showAllModelSuggestion?: boolean;
  manualModelInput?: boolean;
  tested?: boolean;
}
const LLM_TEMPLATES: LlmTemplate[] = [
  {
    name: "Official OpenAI API",
    instructions:
      "Ensure you have an API key set to use the official OpenAI API.",
    apiUrl: new URL(DEFAULT_EXTENSION_SETTINGS.gpt3.apiBaseUrl),
    docsUrl: new URL(
      "https://platform.openai.com/docs/api-reference/authentication"
    ),
    showApiKeyInput: true,
    showAllModelSuggestion: false,
    tested: true,
  },
  {
    name: "Proxy of OpenAI API (openai-proxy.dev)",
    instructions:
      "This is a proxy of the official OpenAI API. It's for anyone in a geographical location where openai.com is blocked. It's hosted by the author of this extension using Cloudflare Workers.",
    apiUrl: new URL("https://openai-proxy.dev/v1"),
    docsUrl: new URL(
      "https://github.com/Christopher-Hayes/vscode-chatgpt-reborn#proxy-and-local-llms"
    ),
    showApiKeyInput: true,
    showAllModelSuggestion: false,
    tested: true,
  },
  {
    name: "OpenRouter AI",
    instructions:
      "To use OpenRouter AI, you must have an account at https://openrouter.ai and provide your API key.",
    apiUrl: new URL("https://openrouter.ai/api/v1"),
    docsUrl: new URL("https://openrouter.ai/docs"),
    showApiKeyInput: true,
    showAllModelSuggestion: true,
    tested: true,
  },
  {
    name: "text-generation-webui",
    instructions:
      "1. To start text-generation-webui in API-only mode, open your terminal and run: \n\n```bash\npython server.py --api\n```2. Important - You must open the text-generation-webui at http://localhost:7860 and load a model.",
    apiUrl: new URL("http://localhost:5000/v1"),
    docsUrl: new URL(
      "https://github.com/oobabooga/text-generation-webui/wiki/12-%E2%80%90-OpenAI-API"
    ),
    showAllModelSuggestion: true,
    tested: true,
  },
  {
    name: "LocalAI",
    instructions:
      "Just start LocalAI like normal, it should automatically host an OpenAI-compatible API at localhost:8080",
    apiUrl: new URL("http://localhost:8080/v1"),
    docsUrl: new URL("https://localai.io/features/openai-functions/"),
    showAllModelSuggestion: true,
    tested: true,
  },
  {
    name: "ollama",
    instructions:
      "1. ollama should automatically be running it's API server after install.",
    apiUrl: new URL("http://localhost:11434/v1"),
    docsUrl: new URL(
      "https://github.com/ollama/ollama/blob/main/docs/openai.md"
    ),
    showAllModelSuggestion: true,
    tested: false,
  },
  {
    name: "Modelz LLM",
    instructions:
      "Just run Modelz LLM, for example: \n\n```bash\nmodelz-llm -m bigscience/bloomz-560m --device cpu\n```And the API will be at localhost:8000/v1",
    apiUrl: new URL("http://localhost:8000/v1"),
    docsUrl: new URL("https://github.com/tensorchord/modelz-llm#quick-start"),
    showAllModelSuggestion: true,
    tested: false,
  },
  {
    name: "GPT4All",
    instructions:
      "If you launch the GPT4ALL docker container, the API will be at localhost:4891/v1. The authors indicate that this API may no longer be maintained.",
    apiUrl: new URL("http://localhost:4891/v1"),
    docsUrl: new URL(
      "https://github.com/nomic-ai/gpt4all/tree/cef74c2be20f5b697055d5b8b506861c7b997fab/gpt4all-api"
    ),
    showAllModelSuggestion: true,
    tested: false,
  },
  {
    name: "Other",
    instructions:
      "If you're tool is compatible with OpenAI's API, you can use it here. Set the API URL in the input below. It should starts with 'https' and should (probably) end with '/v1' (without quotes). If the API key is needed, set that too.",
    showApiKeyInput: true,
    showAllModelSuggestion: true,
    manualModelInput: true,
    tested: false,
  },
];

export default function ApiSettings({ vscode }: { vscode: any }) {
  const dispatch = useAppDispatch();
  const t = useAppSelector((state: RootState) => state.app.translations);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app.apiKeyStatus
  );
  const [selectedTool, setSelectedTool] = useState<LlmTemplate>(
    LLM_TEMPLATES.find((tool) => tool.name === "Other") ??
      LLM_TEMPLATES[LLM_TEMPLATES.length - 1]
  );
  const [showSaved, setShowSaved] = useState(false);
  const apiUrlInputRef = React.createRef<HTMLInputElement>();
  const [lastApiKeyTest, setLastApiKeyTest] = useState<string | null>(null);
  const backendMessenger = useMessenger(vscode);

  const handleApiKeyUpdate = (apiKey: string) => {
    if (apiKey === lastApiKeyTest) {
      return;
    }

    dispatch(setApiKeyStatus(ApiKeyStatus.Pending));

    backendMessenger.sendChangeApiKey(apiKey);

    setLastApiKeyTest(apiKey);
  };

  const debouncedSetApiKey = useDebounce(handleApiKeyUpdate, 2000);

  const handleApiUrlUpdate = (apiUrl: string) => {
    backendMessenger.sendChangeApiUrl(apiUrl);

    setShowSaved(true);

    setTimeout(() => {
      setShowSaved(false);
    }, 2000);
  };

  const debouncedSetApiUrl = useDebounce(handleApiUrlUpdate, 1000);

  useEffect(() => {
    const matchingTool = LLM_TEMPLATES.find(
      (tool) => tool.apiUrl && tool.apiUrl.href === settings.gpt3.apiBaseUrl
    );
    if (matchingTool) {
      setSelectedTool(matchingTool);
    }
  }, [settings.gpt3.apiBaseUrl]);

  const handleToolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTool(
      LLM_TEMPLATES.find((tool) => tool.name === event.target.value) ??
        LLM_TEMPLATES[LLM_TEMPLATES.length - 1]
    );
  };

  // On mount, set the API URL input to the current API URL
  useEffect(() => {
    if (apiUrlInputRef.current) {
      apiUrlInputRef.current.value = settings.gpt3.apiBaseUrl;
    }
  }, []);

  return (
    <div className="api-settings-view p-4 flex flex-col gap-4 overflow-y-auto">
      <header>
        <h1 className="text-xl font-semibold inline-flex flex-wrap gap-2">
          Connect to
          <span
            style={{
              color: "var(--vscode-gitDecoration-modifiedResourceForeground)",
            }}
          >
            {selectedTool ? selectedTool.name : "your local LLM"}
          </span>
          {selectedTool && selectedTool.tested && (
            <p className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary bg-button-secondary">
              Tested <span className="ml-1">✅</span>
            </p>
          )}
        </h1>
        {(!selectedTool || (selectedTool && !selectedTool.tested)) && (
          <p>
            <strong>Note:</strong> The local LLM tool must be compatible with
            OpenAI's API. At the moment, this extension <strong>only</strong>{" "}
            supports OpenAI's API format.
          </p>
        )}
      </header>
      <section className="p-4 rounded border border-input">
        <label className="block text-md font-medium mb-2">
          Select a tool to see instructions for it:
        </label>
        <select
          value={selectedTool.name}
          onChange={handleToolChange}
          className="block w-full p-2 text-sm cursor-pointer rounded border border-input text-input bg-input outline-0"
        >
          <option
            value=""
            disabled
            style={{
              backgroundColor: "var(--vscode-tab-activeBackground)",
            }}
          >
            Select a tool...
          </option>
          {LLM_TEMPLATES.map((tool, index) => (
            <option
              key={`tool-${index}`}
              value={tool.name}
              style={{
                backgroundColor: "var(--vscode-tab-activeBackground)",
              }}
            >
              {tool.name}
            </option>
          ))}
        </select>
        {selectedTool && (
          <div>
            <h2 className="text-lg font-medium mt-2">Instructions</h2>
            {selectedTool.instructions
              .split(/(```bash\n[\s\S]*?\n```)/)
              .reduce((acc: any[], item: any) => {
                if (item) {
                  acc.push(item);
                }
                return acc;
              }, [])
              .map((item: string, index: React.Key | null | undefined) => {
                if (item.startsWith("```bash")) {
                  // remove the ```bash and ``` from the string
                  item = item.replace(/```bash\n/g, "").replace(/\n```/g, "");
                  return (
                    <CodeBlock
                      margins={false}
                      className="my-1"
                      code={item}
                      key={`code-${index}`}
                      vscode={vscode}
                    />
                  );
                } else {
                  return <p>{item}</p>;
                }
              })}
            {selectedTool.docsUrl && (
              <p>
                <strong className="inline-block mt-2 mb-1">Full Docs:</strong>{" "}
                <a
                  href={selectedTool.docsUrl.href}
                  target="_blank"
                  className="text-blue-500"
                >
                  {selectedTool.docsUrl.href}
                </a>
              </p>
            )}
          </div>
        )}
        {selectedTool && selectedTool.apiUrl && (
          <div>
            <strong className="inline-block mt-2 mb-1">
              Suggested API URL:
            </strong>
            <div className="flex flex-wrap gap-2">
              <CodeBlock
                margins={false}
                className="flex-grow"
                code={selectedTool.apiUrl.href}
                vscode={vscode}
              />
              <button
                type="button"
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button hover:text-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 bg-button hover:bg-button-hover"
                onClick={() => {
                  backendMessenger.sendChangeApiUrl(
                    selectedTool.apiUrl?.href ?? ""
                  );

                  if (apiUrlInputRef.current) {
                    apiUrlInputRef.current.value =
                      selectedTool.apiUrl?.href ?? "";
                  }

                  setShowSaved(true);

                  setTimeout(() => {
                    setShowSaved(false);
                  }, 2000);
                }}
              >
                Use this API URL
              </button>
            </div>
          </div>
        )}
        {selectedTool && selectedTool.showAllModelSuggestion && (
          <p className="mt-2">
            With this API it is <strong>recommended</strong> to check the "Show
            all models" checkbox below to see all models.
          </p>
        )}
        {selectedTool && !selectedTool.showAllModelSuggestion && (
          <p className="mt-2">
            It is recommended you do <strong>not</strong> check the "Show all
            models" checkbox below or a lot of unnecessary models will be shown.
          </p>
        )}
        {selectedTool &&
          selectedTool.manualModelInput &&
          selectedTool.name !== "other" && (
            <p className="mt-2">
              This tool requires <strong>manual model input</strong>. It does
              not support fetching models from the /models endpoint.
            </p>
          )}
      </section>

      <section>
        <label htmlFor="apiUrl" className="block text-md font-medium my-2">
          <strong>Current</strong> API URL:
        </label>
        <div className="relative">
          <input
            id="apiUrl"
            ref={apiUrlInputRef}
            type="text"
            onChange={(e) => debouncedSetApiUrl(e.target.value)}
            className="block w-full p-2 text-sm rounded border border-input text-input bg-input outline-0"
          />
          {showSaved && (
            <span className="absolute top-2 right-2 transform px-2 py-0.5 text-green-500 border border-green-500 rounded bg-menu">
              Saved
            </span>
          )}
        </div>
      </section>

      <section>
        {/* API key: user input */}
        {selectedTool?.showApiKeyInput && (
          <>
            <div>
              <label
                htmlFor="apiKey"
                className="block text-md font-medium my-2"
              >
                <strong>Current</strong> API key{" "}
                {selectedTool?.apiUrl && (
                  <span className="text-xs">
                    for {new URL(settings.gpt3.apiBaseUrl).hostname}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2 justify-end">
                <div className="flex-grow relative">
                  <input
                    type="password"
                    id="apiKey"
                    onChange={(event) => debouncedSetApiKey(event.target.value)}
                    onPaste={(event) =>
                      handleApiKeyUpdate(
                        event.clipboardData.getData("text/plain")
                      )
                    }
                    placeholder={API_KEY_PLACEHOLDER}
                    className="w-full px-3 py-2 rounded border text-input text-sm border-input bg-input outline-0"
                    disabled={apiKeyStatus === ApiKeyStatus.Pending}
                  />
                  {apiKeyStatus === ApiKeyStatus.Pending && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-yellow-500 border border-yellow-500 rounded bg-menu">
                      Testing...
                    </span>
                  )}
                  {apiKeyStatus === ApiKeyStatus.Authenticating && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-yellow-500 border border-yellow-500 rounded bg-menu">
                      Authenticating...
                    </span>
                  )}
                  {apiKeyStatus === ApiKeyStatus.Valid && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-green-500 border border-green-500 rounded bg-menu">
                      Valid
                    </span>
                  )}
                  {apiKeyStatus === ApiKeyStatus.Invalid && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-red-500 border border-red-500 rounded bg-menu">
                      Invalid
                    </span>
                  )}
                  {apiKeyStatus === ApiKeyStatus.Error && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-red-500 border border-red-500 rounded bg-menu">
                      Error
                    </span>
                  )}
                  {apiKeyStatus === ApiKeyStatus.Unknown && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-gray-500 border border-gray-500 rounded bg-menu">
                      Unknown
                    </span>
                  )}
                  {apiKeyStatus === ApiKeyStatus.Unset && (
                    <span className="absolute top-2 right-2 transform px-2 py-0.5 text-gray-500 border border-gray-500 rounded bg-menu">
                      Unset
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {apiKeyStatus === ApiKeyStatus.Valid && (
                    <button
                      className="px-3 py-2 text-sm rounded bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2"
                      onClick={() => {
                        dispatch(setApiKeyStatus(ApiKeyStatus.Unset));

                        debouncedSetApiKey("");
                      }}
                    >
                      Remove
                    </button>
                  )}
                  {selectedTool.name === "OpenRouter AI" && (
                    <button
                      className="px-3 py-2 text-sm rounded bg-button text-button-secondary hover:bg-button-hover hover:text-button focus:outline-none focus:ring-2 focus:ring-offset-2"
                      onClick={() => {
                        // If the current api base url is not OpenRouter, then set it to OpenRouter
                        if (
                          settings.gpt3.apiBaseUrl !==
                          "https://openrouter.ai/api/v1"
                        ) {
                          backendMessenger.sendChangeApiUrl(
                            "https://openrouter.ai/api/v1"
                          );
                        }

                        dispatch(setApiKeyStatus(ApiKeyStatus.Authenticating));

                        // hacky - wait for 500ms to ensure the API URL is set before generating the API key
                        setTimeout(() => {
                          backendMessenger.sendGenerateOpenRouterApiKey();
                        }, 500);
                      }}
                    >
                      {apiKeyStatus === ApiKeyStatus.Valid
                        ? "Regenerate"
                        : "Generate New"}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs mt-2">
                {t?.apiKeySetup?.apiKeyNote ??
                  "This extension will remember which API key is used for each API URL. Note that some API's, like OpenRouter, will return models even with the wrong API key, so the 'Valid' status may not be accurate. "}
              </p>
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
          </>
        )}
        {/* Show all models */}
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAllModels"
              checked={settings.showAllModels}
              onChange={(e) => {
                dispatch(
                  setExtensionSettings({
                    newSettings: {
                      ...settings,
                      showAllModels: e.target.checked,
                    },
                  })
                );

                backendMessenger.sendSetShowAllModels(e.target.checked);
              }}
              className="rounded cursor-pointer bg-input border-input"
            />
            <label htmlFor="showAllModels" className="text-sm cursor-pointer">
              {t?.apiKeySetup?.showAllModels ?? "Show ALL models"}
            </label>
          </div>
          <p>
            {t?.apiKeySetup?.showAllModelsDescription ??
              "If checked, every single model available on the API will be shown. This setting is recommended for APIs that serve models different from OpenAI's Official API. However, note that some models listed may not work with this extension."}
          </p>
        </div>
        {/* Manual model input checkbox */}
        {selectedTool?.manualModelInput && (
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="manualModelInput"
                checked={settings.manualModelInput}
                onChange={(e) => {
                  dispatch(
                    setExtensionSettings({
                      newSettings: {
                        ...settings,
                        manualModelInput: e.target.checked,
                      },
                    })
                  );

                  backendMessenger.sendSetManualModelInput(e.target.checked);
                }}
                className="rounded cursor-pointer bg-input border-input"
              />
              <label
                htmlFor="manualModelInput"
                className="text-sm cursor-pointer"
              >
                {t?.apiKeySetup?.manualModelInput ?? "Manual model input"}
              </label>
            </div>
            <p>
              {t?.apiKeySetup?.manualModelInputDescription ??
                "If checked, you can manually input the model ID in the model selection dropdown. This is useful for APIs that do not provide a list of models, such as ollama."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
