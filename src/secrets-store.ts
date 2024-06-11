import { ExtensionContext, SecretStorage } from "vscode";

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

  async storeApiKey(token?: string, apiBaseUrl?: string): Promise<void> {
    if (token) {
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
}
