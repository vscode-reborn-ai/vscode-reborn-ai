import { ExtensionContext, SecretStorage } from "vscode";

export default class Auth {
  private static _instance: Auth;

  constructor(private secretStorage: SecretStorage) { }

  static init(context: ExtensionContext): void {
    Auth._instance = new Auth(context.secrets);
  }

  static get instance(): Auth {
    return Auth._instance;
  }

  async storeAuthData(token?: string): Promise<void> {
    if (token) {
      this.secretStorage.store("chatgpt_reborn_openai_api_key", token);
    }
  }

  async getAuthData(): Promise<string | undefined> {
    return await this.secretStorage.get("chatgpt_reborn_openai_api_key");
  }
}
