# VSCode Reborn AI

Write, refactor, and improve your code in VSCode using ai. With VSCode Reborn AI, you decide what AI you want to use.

Code offline with ai using a local LLM.

Enhanced support for: [OpenRouter.ai](https://openrouter.ai) (API), and [ollama](https://github.com/ollama/ollama) (local).

## Get for VSCode

Search for "VSCode Reborn AI" in the VSCode extension search.

Or install directly:

- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=chris-hayes.chatgpt-reborn)
- [Open VSX Registry](https://open-vsx.org/extension/chris-hayes/chatgpt-reborn)

Or build this extension yourself [(scroll further down)](#development).

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

Translated to:  🇩🇪 🇪🇸 🇫🇷 🇮🇹 🇯🇵 🇰🇷 🇳🇱 🇵🇱 🇵🇹 🇹🇷 🇺🇦 🇨🇳 🇹🇼

Most of this extension has been translated to about a dozen languages. The translations are not perfect and may not be correct in some places. If you'd like to help with translations, please see the [i18n discussion](https://github.com/vscode-reborn-ai/vscode-reborn-ai/discussions/20).

## Development

### Clone this repo

```bash
git clone https://github.com/vscode-chatgpt-reborn/vscode-chatgpt-reborn.git
```

### Setup

```bash
yarn
```

### Build the extension

```bash
yarn run build
```

### Test new features in VS Code

To test the vscode-chatgpt-reborn extension in VS Code, follow these steps:

1. Open the project directory in Visual Studio Code.

2. Press `F5` or click `Run > Start Debugging` in the menu to start a new Extension Development Host instance with the extension loaded.

3. In the Extension Development Host instance, test the extension's functionality.

4. Use the Debug Console in the main Visual Studio Code window to view any output or errors.

5. To make changes to the extension, update the code, vscode will automatically be running the `yarn run watch` script. But, for testing you'll need to reload the extension, do that by pressing `Ctrl + Shift + F5`/`Cmd + Shift + F5` (or click `Run > Restart Debugging`).

## Changelog

See the [CHANGELOG](CHANGELOG.md) for a list of past updates, and upcoming unreleased features.

## Tech

[Yarn](https://yarnpkg.com/) - [TypeScript](https://www.typescriptlang.org/) - [VSCode Extension API](https://code.visualstudio.com/api) - [React](https://reactjs.org/) - [Redux](https://redux.js.org/) - [React Router](https://reactrouter.com/) - [Tailwind CSS](https://tailwindcss.com/)

- This extension has a custom UI with React + TailwindCSS, but theme support and remaining consistnet with VSCode's UI components is still a priority.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
