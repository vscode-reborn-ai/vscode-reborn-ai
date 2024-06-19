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

Gencay has since released a *new* extension, "ChatGPT: Genie AI", that is a continuation of his work: <https://github.com/ai-genie/chatgpt-vscode>.

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

### Next Release

- ✨ **Feature** - Added support for Azure's OpenAI API. - *Thank you for the suggestion @PeterDaveHello & @rambalachandran*
- 🖥️ **UI** - Redesigned conversation tabs to match the design of VS Code's editor tabs.
- 🔧 **Fix** - UI color fixes to ensure the extension is usable across all themes.

### June 14, 2024 (`v3.23.0` - `v3.23.2`)

- ✨ **Feature** - Conversation tabs now auto-rename.
- ✨ **Feature** - Improved local LLM support. New "Use Local LLM" page to easily connect to a local LLM.
- ✨ **Feature** - Custom models now appear in the model selector if "Show All Models" is enabled. New UI for searching across custom models.
- 🔧 **Fix** - Resolved `apiBaseUrl` config issue. *Thanks for the bug report @nossebro.*
- 🎮 **QoL** - Local API keys are now associated with the API URL, allowing seamless API switching without re-entering keys.
- 🎮 **QoL** - If you're using OpenRouter, the "Use Local LLM" UI supports automatic api key generation using OAuth.
- 🎮 **QoL** - The model selector typically hides rarely used OpenAI models. The "Show All Models" setting now reveals all models for alternative APIs, like OpenRouter.
- 🎮 **QoL** - Partial support for ollama's API. /api/models is now supported, but other ollama APIs are not yet supported.

### June 4, 2024 (`v3.22.0`)

- ✨ **Feature** - Added support for the latest `gpt-4o` model. This model is slightly better than `gpt-4-turbo`, faster, and half the price. - *Thank you for the help on this one @nickv2002*
- 🔩 **Behind the scenes** - "GPT-4 Turbo" is no longer in preview. We've switched to the official `gpt-4-turbo` model, this model gets automatically updated by OpenAI every quarter or so. - *Thank you for the PR @PeterDaveHello*
- 🎮 **QoL** - The model selector UI has been updated to show the price comparison more clearly. - *Thank you for the suggestion @moritz-t-w*

### November 26, 2023 (`v3.20.2`)

- 🔧 **Fixes** - Fixes bugs with `gpt-4-turbo` context being limited to 4,096 tokens, instead of its full 128,000 context window. - *Thank you for the report @xmjiao*
- 🎮 **QoL** - Minor improvements to token counting. Token modal now shows full token breakdown. Token counter turns red when above context limit.

### November 25, 2023 (`v3.20.0`, `v3.20.1`)

- ✨ **Feature** - Added support for the `gpt-4-1106-preview` model. This model supports 128,000 token input context. The output token limit is 4,096. It's ~3x less expensive than `gpt-4`. - *Thank you for the suggestion @xmjiao*
- 🎮 **QoL** - The context menu items have been consolidated into a single "ChatGPT" submenu to reduce clutter.
- 🔧 **Fixes** - Fix highlighting of HTML characters. - *Thank you for the PR @ZsgsDesign*
- 🎮 **QoL** - OpenAI is beginning to have different prompt and complete token limits. The model selector now has more specific model info, including token prompt/complete limits.
- 🔧 **Fixes** - When HTML code is used in the question, the code should no longer be injected.

### July 31, 2023 (`v3.19.0`, `v3.19.1`)

- 🎮 **QoL** - Allow the user to set a proxy/alternative API base URL at the setup screen. - *Thank you for the report @zzy-life*
- 🔧 **Fixes** - The right-click menu had "Add tests" twice, the label for the 2nd one is fixed to be "Add comments". - *Thank you for the report @wojtekcz*
- 🔧 **Fixes** - Bullet points were not showing in ChatGPT's response. - *Thank you for the report @wojtekcz*
- 🔧 **Fixes** - "export to markdown" button was not correctly showing markdown in the export. - *Thank you for the report @wojtekcz*
- 🔩 **Behind the scenes** - More of the UI is being separated into components to improve maintainability.

### July 11, 2023 (`v3.18.1`)

- 🌐 **i18n** - Fix syntax errors in translation files. - *Thank you for the PR @PeterDaveHello*

### July 3, 2023 (`v3.18.0`)

- 🌐 **i18n** - Taiwan localization improved with native Mandarin translations. - *This PR is highly appreciated @PeterDaveHello*

### June 27, 2023 (`v3.17.0`)

- 🔧 **Fixes** - Token count calculation bugs fixed. Updated to reflect new OpenAI pricing.
- ✨ **Feature** - Added support for the `gpt-3.5-turbo-16k` model. This model is a 16,000 token version of GPT-3.5. It's a good option if you need more tokens than the 4,000 token version of GPT-3.5. It's ~2x more expensive than `gpt-3.5-turbo`; however, it's still much cheaper than `gpt-4`. - *Thank you for the PR @raphael2692*
- 🌐 **i18n** - Added Traditional Chinese translation for Taiwan-based users.

### May 30, 2023 (`v3.16.5`)

- 🔧 **Fixes** - Onboarding - Fix api key verification issue relating to the api url config setting. - *Thanks for the PR @zzy-life*

### May 19, 2023 (`v3.16.4`)

- 🔧 **Fixes** - Onboarding - Fix api key verification not working with proxy api endpoints.

### May 9, 2023 (`v3.16.3`)

- 🌐 **i18n** - Translation file refactor to work more predictably. Right-click menu is now translated. - *Thanks for the PR @zzy-life*
- 🔧 **Fixes** - Expanded the VSCode support to version `v1.70.0` (July 2022). Previously it was to `v1.73.0` (October 2022). Can lower more if needed. - *Thanks for the bug report @zzy-life*
- 🖥️ **UI** - Text about this being a fork has been removed since it's no longer really needed, and clutters the UI. - *Thanks for the suggestion @danyalaytekin*

### April 8, 2023 (`v3.16.1`)

- 🔧 **Fixes** - Using a proxy causes "unexpected end of JSON" error. - *Thanks for the bug report @lvii*
- 🖥️ **UI** - Made error messages a little more helpful.

### April 3, 2023 (`v3.15.2`, `v3.16.0`)

- 🖥️ **UI** - "Actions" page added. A couple actions are available, more will be added in the future. Automate your workflow with AI!
- 🖥️ **UI** - Codeblock buttons are now sticky.
- 🖥️ **UI** - UI fixes for light themes.
- 🖥️ **UI** - Token breakdown now warns about gpt-4 pricing.

### March 30, 2023 (`v3.15.0`, `v3.15.1`)

- 🌐 **i18n** - Initial i18n support, localization is still a work in progress.
- 🔧 **Fixes** - Fix 404 error due to invalid API base URL. - *Thanks for the bug report @hakula139*

### March 28, 2023 (`v3.14.0`)

- 🖥️ **UI** - Add token count UI
- 🖥️ **UI** - "Clear" button added for clearning the conversation. Highly recommend using it to avoid expensive token usage with long conversations.
- 🖥️ **UI** - Minor tweaks to mini buttons below input box to prefer wrapping on smaller windows and ui fixes to actions menu on smaller windows.
- 🔧 **Fixes** - Token counting issues causing `4096` maxTokens config setting to fail. - *Thanks for the bug report @PeterDaveHello*
- 🔩 **Behind the scenes** - API provider refactor. Moving towards using the `OpenAI` library and its SDK for better maintainability. Note that `baseUrl` setting should now end in `/v1`, which matches OpenAI's SDK for `basePath`.

### March 26, 2023 (`v3.12.0`, `v3.12.1`, `v3.13.0`, `v3.13.1`)

- 🔐 **Security** - API key is now stored in VSCode secure storage. It will automatically put your API key in secure storage if you have it in your settings config and then remove it from your settings config. - *Thanks for the feature request @flutterrausch*
- 🖥️ **UI** - Added a "Verbosity" config setting and UI select.
- 🖥️ **UI** - User messages will now include a code block if editor text selection is sent.
- 🖥️ **UI** - Moved "Feedback", "Settings" and "Export" to "More Actions" menu.
- 🖥️ **UI** - New users greeted with a "Getting started" page and API key input.
- 🎮 **QoL** - Added "Disable Multiple Conversations" setting.
- 🎮 **QoL** - Added "Minimal UI" setting.
- 🔧 **Fixes** - Chat now scrolls to the bottom after context menu actions.
- 🔧 **Fixes** - Modified default prompt for adding code comments.
- 🔧 **Fixes** - Overlapping issues with tooltips fixed.

### March 25, 2023 (`v3.11.0` - `v3.11.5`)

- 🖥️ **UI** - General UI look/feel updates. Note that these UI upates have a heavy focus on VSCode's UI guidelines and respecting each theme's color palette.
- 🖥️ **UI** - Added multiple chats and model selector.
- 🖥️ **UI** - Added a model selector. This will only show the models your API key has access to and links to the GPT-4 waitlist if your key does not have access.
- 🔩 **Behind the scenes** - Refactor to use React+Redux for the UI. This will make it easier to build a dynamic UI.
- 🎮 **QoL** - Updated scroll behavior. You can now scroll up as code is being generated, or scroll back to the bottom to "re-lock" the auto-scroll.
- 🎮 **QoL** - When opening code in a new text editor, VSCode should now automatically know how to syntax highlight it.
- 🎮 **QoL** - Configuring "System message" is now an extension setting.

## Tech

[Yarn](https://yarnpkg.com/) - [TypeScript](https://www.typescriptlang.org/) - [VSCode Extension API](https://code.visualstudio.com/api) - [React](https://reactjs.org/) - [Redux](https://redux.js.org/) - [React Router](https://reactrouter.com/) - [Tailwind CSS](https://tailwindcss.com/)

- The UI is built with TailwindCSS. But, respecting VSCode's UI consistency and theme support is still a priority.
- This does not use VSCode's [WebView UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit/tree/main/src). But, I'm open to switching to the WebView UI toolkit since it better aligns with VSCode's UI.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
