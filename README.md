# VSCode Reborn AI

Write, refactor, and improve your code in VS Code using ai. With VSCode Reborn AI, you decide what AI you want to use.

Code offline with ai using a local LLM.

Enhanced support for: [OpenRouter.ai](https://openrouter.ai) (API), and [ollama](https://github.com/ollama/ollama) (local).

## Get for VS Code

Search for "VSCode Reborn AI" in the VS Code extension search.

or **install** directly:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=chris-hayes.chatgpt-reborn)
- [Open VSX Registry](https://open-vsx.org/extension/chris-hayes/chatgpt-reborn)

or **build** this extension yourself [(scroll further down)](#development).

## Screenshots

<table>
  <tr>
    <td>
       <h3>A clean chat interface</h3>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-1-dark.png">
  <img alt="VSCode Reborn AI extension in use within VS Code, displaying a chat interface. The conversation panel shows a user asking, 'What is the difference between throttle and debounce?' at the top. Below it, the AI response is presented in a well-formatted message using Markdown, including an explanation of 'Throttle' with bullet points and a JavaScript code block example. Above the chat is a tab bar with conversation and chat history options. At the bottom of the screen, there is an input field for the user to ask questions, along with options for interacting with the chat." src="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-1-light.png">
</picture>
    </td>
    <td>
      <h3>Easy presets for popular LLMs</h3>
      <br/>
      <br/>
      <br/>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-2-dark.png">
  <img alt="VSCode Reborn AI extension's 'LLM Settings' interface for connecting to an official OpenAI API. A dropdown menu near the top allows the user to select the LLM (currently showing 'Official OpenAI API'). Below, instructions are provided with a suggested API URL (https://api.openai.com/v1) and a 'Use this API URL' button. The current API URL and API key fields are shown below with an API key validation indicator ('Valid' status in green). At the top, a tab bar allows switching between 'Chat' and other options, and there is a 'LLM Settings' tab visible." src="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-2-light.png">
</picture>
    </td>
  </tr>
  <tr>
    <td>
<h3>A rich model picker for APIs like OpenRouter.ai</h3>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-3-dark.png">
  <img alt="VSCode Reborn AI extension's model picker interface displaying a dropdown list of available models when using an API like OpenRouter.ai. The list includes models such as 'AI21: Jamba 1.5 Large' and 'Anthropic: Claude 3 Opus,' each with details like cost per million tokens, maximum tokens per request, and request completion times. Moderation statuses are shown for some models. At the bottom, there are filtering options (Name, Cost, Context, Completion) and a search field to help users quickly find specific models. The interface shows the dropdown overlaying the chat window." src="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-3-light.png">
</picture>
    </td>
    <td>
<h3>Recent data with online models like Perplexity's Sonar</h3>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-4-dark.png">
  <img alt="VSCode Reborn AI extension showing a chat interface where the user asks, 'What is the latest news from OpenAI for me as a developer?' The LLM model in use is 'Perplexity: Llama 3.1 Sonar 405B Online,' which provides a real-time response with key updates from OpenAI, including the Realtime API, Model Distillation, Vision Fine-Tuning, Prompt Caching, and other updates for developers. The interface displays the response in a well-formatted markdown style, with bullet points highlighting each update. At the bottom, the input field allows users to ask further questions. The interface uses a dark theme, with the active model and status shown in the bottom bar." src="https://raw.githubusercontent.com/vscode-reborn-ai/vscode-reborn-ai/develop/screenshot-4-light.png">
</picture>
    </td>
  </tr>
</table>

## Local LLMs and Proxies

Any tool that is "compatible" with the OpenAI API should work with this extension. The tools listed below are the ones we have personally tested.

### Local LLMs tested to work with this extension

- [X] [text-generation-webui](https://github.com/oobabooga/text-generation-webui)
- [X] [ollama](https://github.com/ollama/ollama)
- [X] [LocalAI](https://localai.io/)

### Alternative APIs tested to work with this extension

- [X] [OpenRouter](https://openrouter.ai/)
- [X] [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service/)

### Proxies

We've set up a proxy for anyone that needs it at `https://openai-proxy.dev/v1`. It's running [x-dr/chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI) code on CloudFlare Workers. This is mainly for anyone who wants to use OpenAI, but cannot due to api.openai.com being blocked in your region.

## Internationalization

Translated to: 🇬🇧 🇨🇳 🇮🇳 🇪🇸 🇦🇪 🇧🇩 🇸🇦 🇫🇷 🇷🇺 🇵🇰 🇩🇪 🇯🇵 🇮🇩 🇧🇷 🇮🇹 🇹🇭 🇵🇱 🇻🇳 🇵🇭 🇳🇱 🇺🇦 🇵🇹 🇹🇷 🇪🇬 🇰🇷

Most of this extension has been translated to a number of languages. The translations are not perfect and may not be correct in some places. If you'd like to help with translations, please see the [i18n discussion](https://github.com/vscode-reborn-ai/vscode-reborn-ai/discussions/20).

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

1. Open the project directory in VS Code.

2. To start a new Extension Development Host instance with the extension loaded, press:
   1. <kbd>F5</kbd>
   2. or <kbd>Run</kbd> > <kbd>Start Debugging</kbd> in the top menu.

4. In the new VS Code window, test the extension.

5. Use the **Debug Console** in the main VS Code window to view console logs and errors.

6. **To make changes** to the extension, edit the code, VS Code will automatically rebuild the code using the `yarn run watch` script. However, you still need to reload the extension, do that by:
   1. <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F5</kbd>
   2. or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>F5</kbd>
   3. or <kbd>Run</kbd> > <kbd>Restart Debugging</kbd> in the top menu.

### Package for VS Code

```bash
yarn run package # Runs `vsce package`
```

## Changelog

See the [CHANGELOG](CHANGELOG.md) for a list of past updates, and upcoming unreleased features.

## Tech

[Yarn](https://yarnpkg.com/) - [TypeScript](https://www.typescriptlang.org/) - [VS Code Extension API](https://code.visualstudio.com/api) - [React](https://reactjs.org/) - [Redux](https://redux.js.org/) - [React Router](https://reactrouter.com/) - [Tailwind CSS](https://tailwindcss.com/)

- This extension has a custom UI with React + TailwindCSS, but theme support and remaining consistent with VS Code's UI components is still a priority.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
