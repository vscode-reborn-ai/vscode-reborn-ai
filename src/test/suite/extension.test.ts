import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'chris-hayes.chatgpt-reborn';

suite('Extension Test Suite', () => {
  test('Check if extension activates', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);

    assert.ok(extension, `Extension ${EXTENSION_ID} not found.`);

    if (!extension.isActive) {
      await extension.activate();
    }

    assert.strictEqual(extension.isActive, true, 'Extension did not activate.');
  });

  test('Check if translations load correctly', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);

    assert.ok(extension, `Extension ${EXTENSION_ID} not found.`);

    if (!extension.isActive) {
      await extension.activate();
    }

    const translations = await import('../../localization');
    const loadedTranslations = await translations.loadTranslations(extension.extensionPath);

    assert.ok(loadedTranslations, 'Translations did not load correctly.');
  });
});
