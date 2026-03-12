import * as assert from 'assert';
import * as vscode from 'vscode';
import { AuthStore, OfflineStore } from './local-store';
import { ViewOptionsState } from './renderer/store/app';
import { Model, Role } from './renderer/types';

type SecretMap = Map<string, string>;

function createInMemorySecretStorage(backing: SecretMap = new Map()): vscode.SecretStorage {
  const onDidChange: vscode.Event<vscode.SecretStorageChangeEvent> = () => ({ dispose() { /* noop */ } });

  return {
    get: async (key: string) => backing.get(key),
    store: async (key: string, value: string) => { backing.set(key, value); },
    delete: async (key: string) => { backing.delete(key); },
    onDidChange,
  } as unknown as vscode.SecretStorage;
}

suite('AuthStore', () => {
  test('stores and retrieves default API key', async () => {
    const secrets = createInMemorySecretStorage();
    const auth = new AuthStore(secrets);

    await auth.storeApiKey('token-default');

    const saved = await auth.getApiKey();
    assert.strictEqual(saved, 'token-default');
  });

  test('stores and retrieves API keys by base URL while keeping default updated', async () => {
    const secrets = createInMemorySecretStorage();
    const auth = new AuthStore(secrets);

    await auth.storeApiKey('token-a', 'https://api.a');
    await auth.storeApiKey('token-b', 'https://api.b');

    // Last stored token becomes default
    const defaultAfterStores = await auth.getApiKey();
    assert.strictEqual(defaultAfterStores, 'token-b');

    const forA = await auth.getApiKey('https://api.a');
    assert.strictEqual(forA, 'token-a');

    // Reading an API-scoped key refreshes the default
    const defaultAfterRead = await auth.getApiKey();
    assert.strictEqual(defaultAfterRead, 'token-a');
  });

  test('does not overwrite default key when no key exists for API', async () => {
    const secrets = createInMemorySecretStorage();
    const auth = new AuthStore(secrets);

    const missing = await auth.getApiKey('https://missing');
    assert.strictEqual(missing, undefined);

    const defaultKey = await auth.getApiKey();
    assert.strictEqual(defaultKey, undefined, 'default key should remain unset');
  });

  test('stores and fetches models per API', async () => {
    const secrets = createInMemorySecretStorage();
    const auth = new AuthStore(secrets);

    const model: Model = {
      id: 'model-1',
      owned_by: Role.assistant,
      created: Date.now(),
      object: 'model',
    };

    await auth.storeModelByApi('https://api.a', model);

    const retrieved = await auth.getModelByApi('https://api.a');
    assert.deepStrictEqual(retrieved, model);
  });
});

suite('OfflineStore', () => {
  test('returns undefined when no view options stored', async () => {
    const secrets = createInMemorySecretStorage();
    const offline = new OfflineStore(secrets);

    const options = await offline.getViewOptions();
    assert.strictEqual(options, undefined);
  });

  test('merges and persists view options', async () => {
    const secrets = createInMemorySecretStorage();
    const offline = new OfflineStore(secrets);

    const first: Partial<ViewOptionsState> = { showMarkdown: true, showTokenCount: false };
    await offline.setViewOptions(first);
    assert.deepStrictEqual(await offline.getViewOptions(), first);

    const second: Partial<ViewOptionsState> = { showMarkdown: false, showCompact: true };
    await offline.setViewOptions(second);
    assert.deepStrictEqual(await offline.getViewOptions(), { ...first, ...second });
  });
});
