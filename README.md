# VSCode Reborn AI

VSCode Reborn AI is a Visual Studio Code extension that allows you to use the ChatGPT API to write, refactor, and improve your code.

## Get for VSCode

Search for "VSCode Reborn AI" in the VSCode extension search.

Or install directly:

- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=chris-hayes.chatgpt-reborn)
- [Open VSX Registry](https://open-vsx.org/extension/chris-hayes/chatgpt-reborn)

Or build this extension yourself (scroll further down).

## About this fork

This is a fork of the popular, but now discontinued [vscode-chatgpt](https://github.com/gencay/vscode-chatgpt) extension. Full credit to @gencay for working on the original extension and later open-sourcing it.

Gencay has since released a *new* extension, "Reborn AI: Genie AI", that is a continuation of his work: <https://github.com/ai-genie/chatgpt-vscode>.

How these extensions differ is that Genie AI is a proprietary extension, and VSCode Reborn AI is an open-source extension.

## Local LLMs and Proxies

Any tool that is "compatible" with the OpenAI API should work with this extension. The tools listed below are the ones I've personally tested.

### Local LLMs tested to work with this extension

- [X] [text-generation-webui](https://github.com/oobabooga/text-generation-webui)
- [X] [ollama](https://github.com/ollama/ollama)
- [X] [LocalAI](https://localai.io/)

### Alternative APIs tested to work with this extension

- [X] [OpenRouter](https://openrouter.ai/)
- [X] [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service/)

### Proxies

I've set up a proxy for anyone that needs it at `https://openai-proxy.dev/v1`. It's running [x-dr/chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI) code on CloudFlare Workers. This is mainly for anyone who wants to use OpenAI, but cannot due to api.openai.com being blocked.

## Internationalization

Most of this extension has been translated to a ~dozen languages, but the translations are not complete and may not be correct in some places. If you'd like to help with translations, please see the [i18n discussion](https://github.com/Christopher-Hayes/vscode-chatgpt-reborn/discussions/20)

## Build this extension yourself

To set up the project, first clone the repository:

```bash
git clone https://github.com/christopher-hayes/vscode-chatgpt-reborn.git
```

Next, change into the project directory and install the dependencies using Yarn:

```bash
cd vscode-chatgpt-reborn
yarn install
```

## Running Scripts

You can run the following scripts using Yarn:

### Build the extension

```bash
yarn run build
```

### Watch for changes and rebuild automatically

```bash
yarn run watch
```

## Developing this extension in VS Code

To test the vscode-chatgpt-reborn extension in Visual Studio Code, follow these steps:

1. Open the project directory in Visual Studio Code.

2. Press `F5` or click `Run > Start Debugging` in the menu to start a new Extension Development Host instance with the extension loaded.

3. In the Extension Development Host instance, test the extension's functionality.

4. Use the Debug Console in the main Visual Studio Code window to view any output or errors.

5. To make changes to the extension, update the code, and then press `Ctrl + Shift + F5`/`Cmd + Shift + F5` (or click `Run > Restart Debugging`) to reload the extension.

6. Once you are satisfied with your changes, submit a pull request to this repository.

## Changelog

See the [CHANGELOG](CHANGELOG.md) for a list of changes.

## Tech

[Yarn](https://yarnpkg.com/) - [TypeScript](https://www.typescriptlang.org/) - [VSCode Extension API](https://code.visualstudio.com/api) - [React](https://reactjs.org/) - [Redux](https://redux.js.org/) - [React Router](https://reactrouter.com/) - [Tailwind CSS](https://tailwindcss.com/)

- The UI is built with TailwindCSS. But, respecting VSCode's UI consistency and theme support is still a priority.
- This does not use VSCode's [WebView UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit/tree/main/src). But, I'm open to switching to the WebView UI toolkit since it better aligns with VSCode's UI.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
