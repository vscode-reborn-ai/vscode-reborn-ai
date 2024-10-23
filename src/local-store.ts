import { ExtensionContext, SecretStorage } from "vscode";
import { ViewOptionsState } from "./renderer/store/types";
import { Model } from "./renderer/types";

/*
* local-store.ts
*
* Responsible for managing both authentication secrets and local configuration settings related to
* view options within the main process of a VSCode extension.
*
* - The Auth class manages storing and retrieving the OpenAI API keys securely.
*   - It supports a "default" key, storing the last used key.
*   - It manages keys by API base URL to facilitate switching between different APIs.
*   - It stores and retrieves user models associated with specific APIs.
*
* - The OfflineSettings class is designed for handling local view options.
*   - It retrieves and updates view-specific settings stored securely.
*   - Utilizes VSCode's SecretStorage for safe storage of configuration data.
*
* TODO: Validate the structure of the retrieved data for both keys and view options.
*   - Current implementatoin may break as the application evolves and data structures change.
*/

const DEFAULT_KEY_NAME = "chatgpt_reborn_openai_api_key";
const KEY_BY_API_NAME = "chatgpt_reborn_openai_api_key_by_api";

export class AuthStore {
  private static _instance: AuthStore;

  constructor(private secretStorage: SecretStorage) { }

  static init(context: ExtensionContext): AuthStore {
    AuthStore._instance = new AuthStore(context.secrets);

    return AuthStore._instance;
  }

  private async getKeyByApiObject(): Promise<{ [apiBaseUrl: string]: string; }> {
    const keyByApi = await this.secretStorage.get(KEY_BY_API_NAME);

    if (!keyByApi) {
      await this.secretStorage.store(KEY_BY_API_NAME, JSON.stringify({}));
      return {};
    } else {
      return JSON.parse(keyByApi);
    }
  }

  private async storeKeyByApiObject(keyByApi: { [apiBaseUrl: string]: string; }): Promise<void> {
    await this.secretStorage.store(KEY_BY_API_NAME, JSON.stringify(keyByApi));
  }

  // token can be '' when clearing the key
  async storeApiKey(token: string | undefined = undefined, apiBaseUrl?: string): Promise<void> {
    if (token !== undefined) {
      if (apiBaseUrl) {
        // Store the key by API
        const keyByApi = await this.getKeyByApiObject();

        keyByApi[apiBaseUrl] = token;

        await this.storeKeyByApiObject(keyByApi);
      }

      // Store the default key
      await this.secretStorage.store(DEFAULT_KEY_NAME, token);
    } else {
      console.warn("[Reborn AI] No api key provided to store");
    }
  }

  async getApiKey(apiBaseUrl?: string): Promise<string | undefined> {
    if (apiBaseUrl) {
      const keyByApi = await this.getKeyByApiObject();
      const key = keyByApi[apiBaseUrl] ?? await this.secretStorage.get(DEFAULT_KEY_NAME);

      // Last accessed key becomes the default key
      await this.secretStorage.store(DEFAULT_KEY_NAME, key);

      return key;
    } else {
      return await this.secretStorage.get(DEFAULT_KEY_NAME);
    }
  }

  // Remember what the last model was used for each API
  // TODO: Validate the structure of the retrieved model
  async getModelByApi(apiBaseUrl: string): Promise<Model | undefined> {
    const getModels = await this.secretStorage.get("chatgpt_reborn_models_by_api");

    if (!getModels) {
      return undefined;
    }

    const modelsByApi = JSON.parse(getModels);

    return modelsByApi[apiBaseUrl];
  }

  async storeModelByApi(apiBaseUrl: string, model: Model): Promise<void> {
    const getModels = await this.secretStorage.get("chatgpt_reborn_models_by_api");

    let modelsByApi: Record<string, Model> = {};

    if (getModels) {
      modelsByApi = JSON.parse(getModels);
    }

    modelsByApi[apiBaseUrl] = model;

    await this.secretStorage.store("chatgpt_reborn_models_by_api", JSON.stringify(modelsByApi));
  }

}

const VIEW_OPTIONS_STORAGE_KEY = "offline_view_options";

export class OfflineStore {
  private static _instance: OfflineStore;

  constructor(private secretStorage: SecretStorage) { }

  static init(context: ExtensionContext): OfflineStore {
    OfflineStore._instance = new OfflineStore(context.secrets);

    return OfflineStore._instance;
  }

  // TODO: Validate the structure of the retrieved view options
  async getViewOptions(): Promise<ViewOptionsState | undefined> {
    const viewOptions = await this.secretStorage.get(VIEW_OPTIONS_STORAGE_KEY);

    if (!viewOptions) {
      return undefined;
    }

    return JSON.parse(viewOptions);
  }

  async setViewOptions(newOptions: Partial<ViewOptionsState>): Promise<void> {
    const currentOptions = await this.getViewOptions() || {};
    const updatedOptions = { ...currentOptions, ...newOptions };
    await this.secretStorage.store(VIEW_OPTIONS_STORAGE_KEY, JSON.stringify(updatedOptions));
  }
}
