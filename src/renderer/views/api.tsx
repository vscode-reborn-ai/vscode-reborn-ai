import React, { useEffect, useState } from "react";
import CodeBlock from "../components/CodeBlock";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { ApiKeyStatus, setApiKeyStatus } from "../store/app";
import { DEFAULT_EXTENSION_SETTINGS } from "../types";
import { useDebounce } from "../utils";

const apiKeyPlaceholder = "sk-...";
const popularLocalLlms: {
  name: string;
  instructions: string;
  apiUrl: URL;
  docsUrl?: URL;
  tested?: boolean;
}[] = [
  {
    // All set
    name: "Official OpenAI API",
    instructions:
      "Ensure you have an API key set to use the official OpenAI API.",
    apiUrl: new URL(DEFAULT_EXTENSION_SETTINGS.gpt3.apiBaseUrl),
    docsUrl: new URL(
      "https://platform.openai.com/docs/api-reference/authentication"
    ),
    tested: true,
  },
  {
    // All set
    name: "text-generation-webui",
    instructions:
      "To start text-generation-webui in API-only mode, open your terminal and run: \n\n```bash\npython server.py --api\n```However, you must open the text-generation-webui at http://localhost:7860 and load a model.",
    apiUrl: new URL("http://localhost:5000/v1"),
    docsUrl: new URL(
      "https://github.com/oobabooga/text-generation-webui/wiki/12-%E2%80%90-OpenAI-API"
    ),
    tested: true,
  },
  {
    name: "automatic1111",
    instructions:
      "To start automatic1111 in API-only mode, open your terminal and run: \n\n```bash\npython webui.py --api\n```",
    apiUrl: new URL("http://localhost:7860/v1"),
  },
  {
    name: "comfyui",
    instructions:
      "To start comfyui in API-only mode, open your terminal and run: \n\n```bash\npython main.py --api\n```",
    apiUrl: new URL("http://localhost:8188/v1"),
  },
  {
    // All set
    name: "LocalAI",
    instructions:
      "Just start LocalAI like normal, it should automatically host an OpenAI-compatible API at localhost:8080",
    apiUrl: new URL("http://localhost:8080/v1"),
    docsUrl: new URL("https://localai.io/features/openai-functions/"),
  },
  {
    name: "GPT4All",
    instructions:
      "GPT4All does not have an API-only mode, just run your start command like normal, for example: \n\n```bash\ngpt4all-lora-quantized-OSX-m1\n```",
    apiUrl: new URL("http://localhost:8001/v1"),
  },
  {
    name: "LM Studio",
    instructions:
      "To start LM Studio in API-only mode, open your terminal and run: \n\n```bash\nlmstudio --api\n```",
    apiUrl: new URL("http://localhost:8002/v1"),
  },
  {
    name: "Modelz LLM",
    instructions:
      "Modelz LLM does not have an API-only mode, just run your start command like normal, for example: \n\n```bash\nmodelz-llm -m bigscience/bloomz-560m --device cpu\n```",
    apiUrl: new URL("http://localhost:8003/v1"),
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
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [showSaved, setShowSaved] = useState(false);
  const apiUrlInputRef = React.createRef<HTMLInputElement>();
  const [lastApiKeyTest, setLastApiKeyTest] = useState<string | null>(null);

  const handleApiKeyUpdate = (apiKey: string) => {
    if (apiKey === lastApiKeyTest) {
      return;
    }

    dispatch(setApiKeyStatus(ApiKeyStatus.Pending));

    vscode.postMessage({
      type: "changeApiKey",
      value: apiKey,
    });

    setLastApiKeyTest(apiKey);
  };

  const handleApiUrlUpdate = (apiUrl: string) => {
    vscode.postMessage({
      type: "changeApiUrl",
      value: apiUrl,
    });

    setShowSaved(true);

    setTimeout(() => {
      setShowSaved(false);
    }, 2000);
  };

  const debouncedSetApiKey = useDebounce(handleApiKeyUpdate, 2000);
  const debouncedSetApiUrl = useDebounce(handleApiUrlUpdate, 1000);

  useEffect(() => {
    const matchingTool = popularLocalLlms.find(
      (tool) => tool.apiUrl.href === settings.gpt3.apiBaseUrl
    );
    if (matchingTool) {
      setSelectedTool(matchingTool.name);
    }
  }, [settings.gpt3.apiBaseUrl]);

  const handleToolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTool(event.target.value);
  };

  const selectedToolInfo = popularLocalLlms.find(
    (tool) => tool.name === selectedTool
  );

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
            {selectedToolInfo ? selectedToolInfo.name : "your local LLM"}
          </span>
          {selectedToolInfo && selectedToolInfo.tested && (
            <p className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary bg-button-secondary">
              Tested <span className="ml-1">✅</span>
            </p>
          )}
        </h1>
        {(!selectedToolInfo ||
          (selectedToolInfo && !selectedToolInfo.tested)) && (
          <p>
            <strong>Note:</strong> The local LLM tool must be compatible with
            OpenAI's API. At the moment, this extension <strong>only</strong>{" "}
            supports OpenAI's API format.
          </p>
        )}
      </header>
      <section className="p-4 rounded border border-input">
        <label className="block text-md font-medium mb-2">
          Select AI Tool:
        </label>
        <select
          value={selectedTool}
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
          {popularLocalLlms.map((tool) => (
            <option
              key={tool.name}
              value={tool.name}
              style={{
                backgroundColor: "var(--vscode-tab-activeBackground)",
              }}
            >
              {tool.name}
            </option>
          ))}
        </select>
        {selectedToolInfo && (
          <div>
            <h2 className="text-lg font-medium mt-2">Instructions</h2>
            {selectedToolInfo.instructions
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
                      key={index}
                      vscode={vscode}
                    />
                  );
                } else {
                  return <p>{item}</p>;
                }
              })}
            <p>
              <strong className="inline-block mt-2 mb-1">
                Suggested API URL:
              </strong>
              <CodeBlock
                margins={false}
                className="mb-2"
                code={selectedToolInfo.apiUrl.href}
                vscode={vscode}
              />
            </p>
          </div>
        )}
        {selectedToolInfo && (
          <button
            type="button"
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 bg-button hover:bg-button-hover"
            onClick={() => {
              vscode.postMessage({
                type: "changeApiUrl",
                value: selectedToolInfo.apiUrl.href,
              });

              setShowSaved(true);

              setTimeout(() => {
                setShowSaved(false);
              }, 2000);
            }}
          >
            Use suggested API URL
          </button>
        )}
      </section>

      <section>
        {/* API key: user input */}
        {selectedToolInfo?.name === "Official OpenAI API" && (
          <>
            <div>
              <label
                htmlFor="apiKey"
                className="block text-md font-medium my-2"
              >
                {t?.apiKeySetup?.apiKeyLabel ?? "API Key"}
              </label>
              <div className="relative flex gap-x-4">
                <input
                  type="password"
                  id="apiKey"
                  onChange={(event) => debouncedSetApiKey(event.target.value)}
                  onPaste={(event) =>
                    handleApiKeyUpdate(
                      event.clipboardData.getData("text/plain")
                    )
                  }
                  placeholder={apiKeyPlaceholder}
                  className="flex-grow px-3 py-2 rounded border text-input text-sm border-input bg-input outline-0"
                  disabled={apiKeyStatus === ApiKeyStatus.Pending}
                />
                {apiKeyStatus === ApiKeyStatus.Pending && (
                  <span className="absolute top-2 right-2 transform px-2 py-0.5 text-yellow-500 border border-yellow-500 rounded bg-button-secondary">
                    Testing...
                  </span>
                )}
                {apiKeyStatus === ApiKeyStatus.Valid && (
                  <span className="absolute top-2 right-2 transform px-2 py-0.5 text-green-500 border border-green-500 rounded bg-button-secondary">
                    Valid
                  </span>
                )}
                {apiKeyStatus === ApiKeyStatus.Invalid && (
                  <span className="absolute top-2 right-2 transform px-2 py-0.5 text-red-500 border border-red-500 rounded bg-button-secondary">
                    Invalid
                  </span>
                )}
                {apiKeyStatus === ApiKeyStatus.Unknown && (
                  <span className="absolute top-2 right-2 transform px-2 py-0.5 text-gray-500 border border-gray-500 rounded bg-button-secondary">
                    Unknown
                  </span>
                )}
                {apiKeyStatus === ApiKeyStatus.Unset && (
                  <span className="absolute top-2 right-2 transform px-2 py-0.5 text-gray-500 border border-gray-500 rounded bg-button-secondary">
                    Unset
                  </span>
                )}
              </div>
            </div>
            {/* API key: error message */}
            {apiKeyStatus === ApiKeyStatus.Invalid && (
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

        <label htmlFor="apiUrl" className="block text-md font-medium my-2">
          This extension's current API URL:
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
            <span className="absolute top-2 right-2 transform px-2 py-0.5 text-green-500 border border-green-500 rounded bg-button-secondary">
              Saved
            </span>
          )}
        </div>
      </section>

      <section className="flex flex-wrap justify-start gap-4">
        <button
          type="button"
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-button-secondary hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 bg-button-secondary hover:bg-button-secondary-hover"
          onClick={() => {
            vscode.postMessage({
              type: "changeApiUrl",
              value: DEFAULT_EXTENSION_SETTINGS.gpt3.apiBaseUrl,
            });

            setShowSaved(true);

            setTimeout(() => {
              setShowSaved(false);
            }, 2000);
          }}
        >
          Reset to OpenAI default
        </button>
      </section>
    </div>
  );
}
