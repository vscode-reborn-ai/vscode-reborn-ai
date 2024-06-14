import { ExtensionContext, SecretStorage } from "vscode";
import { Model } from "./renderer/types";

/*

* secrets-store.ts

Responsible for storing and retrieving the OpenAI API key from the secret storage.

There is the "default" key, which is always the last key used.
There is also the "key by API" object, which stores keys by API base URL.
Storing by API is useful for switching between APIs without having to re-enter the key.

*/

const DEFAULT_KEY_NAME = "chatgpt_reborn_openai_api_key";
const KEY_BY_API_NAME = "chatgpt_reborn_openai_api_key_by_api";

export default class Auth {
  private static _instance: Auth;

  constructor(private secretStorage: SecretStorage) { }

  static init(context: ExtensionContext): void {
    Auth._instance = new Auth(context.secrets);
  }

  static get instance(): Auth {
    return Auth._instance;
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
      console.warn("No api key provided to store");
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
  // use secret storage
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
