const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'out/test/**/*.test.js',
  version: 'stable', // Use "insiders" for VS Code Insiders
  // workspaceFolder: './',
  extensionDevelopmentPath: './'
});
