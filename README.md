# ChatGPT Reborn

ChatGPT Reborn is a Visual Studio Code extension that allows you to use the ChatGPT API to write, refactor, and improve your code.

## Get for VSCode

Search for "ChatGPT Reborn" in the VSCode extension search.

Or install directly:

- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=chris-hayes.chatgpt-reborn)
- [Open VSX Registry](https://open-vsx.org/extension/chris-hayes/chatgpt-reborn)

Or build this extension yourself (see below).

## About this fork

This is a fork of the popular, but now discontinued [vscode-chatgpt](https://github.com/gencay/vscode-chatgpt) extension. Full credit to @gencay for building the original extension and open-sourcing it. Note that this version is API-only, the browser code was not open-sourced by Gencay (due to OpenAI ToS issue).

### The new "ChatGPT: Genie AI" extension

Gencay has released a *new* extension, "ChatGPT: Genie AI", that is a continuation of his work in an API-only format: <https://github.com/ai-genie/chatgpt-vscode>

### What does that mean for this fork?

I will be continuing work on this extension, I have some ideas for features that focus on automation. Please understand that this means there are fairly major changes on the horizon in the name of a better dev experience. I suggest building from [gencay/vscode-gencay](https://github.com/gencay/vscode-chatgpt) source if you do not want an extension that may occasionally break as it evolves.

### FOSS

As a FOSS advocate, I feel compelled to note that Genie AI is not open-source and it sounds (to me at least) like it may at some point have paid features. I don't have a personal issue with that, it will allow the Genie AI team to spend more time improving their extension. But, you can expect "Reborn" to stay FOSS, and if you're a fan of open-source - feedback, issues, and PRs are welcome.

### GPT-4

**Required** - You must have access to GPT-4 via API. OpenAI's waitlist for GPT-4 API access is here: <https://openai.com/waitlist/gpt-4-api>

If you're part of an organization account that has GPT-4 access, be sure to set the `Organization ID`. (This will also charge the organization account). If you're wondering about the 32,000 token version of GPT-4, OpenAI hasn't made that model available yet.

## Installation

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

### Format the code using Prettier and run tests with fixes

```bash
yarn run fmt
```

### Run tests using ESLint and TypeScript

```bash
yarn run test
```

## Testing the Extension in Visual Studio Code

To test the vscode-chatgpt-reborn extension in Visual Studio Code, follow these steps:

1. Open the project directory in Visual Studio Code.

2. Press `F5` or click `Run > Start Debugging` in the menu to start a new Extension Development Host instance with the extension loaded.

3. In the Extension Development Host instance, test the extension's functionality.

4. Use the Debug Console in the main Visual Studio Code window to view any output or errors.

5. If you need to make changes to the extension, stop the Extension Development Host, make the changes, and then start the Extension Development Host again.

6. Once you are satisfied with your changes, submit a pull request to the original repository.

## TODO

- [ ] Let users that are using `gpt-3.5-turbo-16k` know when their prompt is well below 4K tokens. To recommend using `gpt-3.5-turbo` instead to save on costs.
- [ ] Add way to manage custom prompts in UI.
- [ ] Add option to stream directly into the editor.
- [ ] Inline diff
- [ ] "Smart" actions based on the type of file open.
- [ ] "Smart" actions on that run at a project level.
- [ ] AI-generated git commit messages
- [ ] Support davinci models in place of ChatGPT models

## Internationalization

Initial i18n support has been added in `v3.15.0`, but I need help translating to different languages. If you're able to help at all [see this discussion](https://github.com/Christopher-Hayes/vscode-chatgpt-reborn/discussions/20).

## Proxy

This extension can be used with a proxy if you put the proxy's URL path in the "Api Base Url" config setting.

**Update 4.8.2023** - I've set up a proxy for anyone that needs it at `https://openai-proxy.dev/v1`. It's running [x-dr/chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI) code on CloudFlare Workers.

## Tech

[Yarn](https://yarnpkg.com/) - [TypeScript](https://www.typescriptlang.org/) - [VSCode Extension API](https://code.visualstudio.com/api) - [React](https://reactjs.org/) - [Redux](https://redux.js.org/) - [React Router](https://reactrouter.com/) - [Tailwind CSS](https://tailwindcss.com/)

- The UI is built with TailwindCSS. But, respecting VSCode's UI consistency and theme support is still a priority.
- This does not use VSCode's [WebView UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit/tree/main/src). But, I'm open to switching to the WebView UI toolkit since it better aligns with VSCode's UI.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Changelog

### July 31, 2023 (`v3.19.0`, `v3.19.1`)

- 🎮 [QoL] Allow the user to set a proxy/alternative API base URL at the setup screen. - *Thank you for the report @zzy-life*
- 🔧 [Fixes] The right-click menu had "Add tests" twice, the label for the 2nd one is fixed to be "Add comments". - *Thank you for the report @wojtekcz*
- 🔧 [Fixes] Bullet points were not showing in ChatGPT's response. - *Thank you for the report @wojtekcz*
- 🔧 [Fixes] "export to markdown" button was not correctly showing markdown in the export. - *Thank you for the report @wojtekcz*
- 🔩 [Behind the scenes] More of the UI is being separated into components to improve maintainability.

### July 11, 2023 (`v3.18.1`)

- 🌐 [i18n] Fix syntax errors in translation files. - *Thank you for the PR @PeterDaveHello*

### July 3, 2023 (`v3.18.0`)

- 🌐 [i18n] Taiwan localization improved with native Mandarin translations. - *This PR is highly appreciated @PeterDaveHello*

### June 27, 2023 (`v3.17.0`)

- 🔧 [Fixes] Token count calculation bugs fixed. Updated to reflect new OpenAI pricing.
- ✨ [Feature] Added support for the `gpt-3.5-turbo-16k` model. This model is a 16,000 token version of GPT-3.5. It's a good option if you need more tokens than the 4,000 token version of GPT-3.5. It's ~2x more expensive than `gpt-3.5-turbo`; however, it's still much cheaper than `gpt-4`. - *Thank you for the PR @raphael2692*
- 🌐 [i18n] Added Traditional Chinese translation for Taiwan-based users.

### May 30, 2023 (`v3.16.5`)

- 🔧 [Fixes] Onboarding - Fix api key verification issue relating to the api url config setting. - *Thanks for the PR @zzy-life*

### May 19, 2023 (`v3.16.4`)

- 🔧 [Fixes] Onboarding - Fix api key verification not working with proxy api endpoints.

### May 9, 2023 (`v3.16.3`)

- 🌐 [i18n] Translation file refactor to work more predictably. Right-click menu is now translated. - *Thanks for the PR @zzy-life*
- 🔧 [Fixes] Expanded the VSCode support to version `v1.70.0` (July 2022). Previously it was to `v1.73.0` (October 2022). Can lower more if needed. - *Thanks for the bug report @zzy-life*
- 🖥️ [UI] Text about this being a fork has been removed since it's no longer really needed, and clutters the UI. - *Thanks for the suggestion @danyalaytekin*

### April 8, 2023 (`v3.16.1`)

- 🔧 [Fixes] Using a proxy causes "unexpected end of JSON" error. - *Thanks for the bug report @lvii*
- 🖥️ [UI] Made error messages a little more helpful.

### April 3, 2023 (`v3.15.2`, `v3.16.0`)

- 🖥️ [UI] "Actions" page added. A couple actions are available, more will be added in the future. Automate your workflow with AI!
- 🖥️ [UI] Codeblock buttons are now sticky.
- 🖥️ [UI] UI fixes for light themes.
- 🖥️ [UI] Token breakdown now warns about gpt-4 pricing.

### March 30, 2023 (`v3.15.0`, `v3.15.1`)

- 🌐 [i18n] Initial i18n support, localization is still a work in progress.
- 🔧 [Fixes] Fix 404 error due to invalid API base URL. - *Thanks for the bug report @hakula139*

### March 28, 2023 (`v3.14.0`)

- 🖥️ [UI] Add token count UI
- 🖥️ [UI] "Clear" button added for clearning the conversation. Highly recommend using it to avoid expensive token usage with long conversations.
- 🖥️ [UI] Minor tweaks to mini buttons below input box to prefer wrapping on smaller windows and ui fixes to actions menu on smaller windows.
- 🔧 [Fixes] Token counting issues causing `4096` maxTokens config setting to fail. - *Thanks for the bug report @PeterDaveHello*
- 🔩 [Behind the scenes] API provider refactor. Moving towards using the `OpenAI` library and its SDK for better maintainability. Note that `baseUrl` setting should now end in `/v1`, which matches OpenAI's SDK for `basePath`.

### March 26, 2023 (`v3.12.0`, `v3.12.1`, `v3.13.0`, `v3.13.1`)

- 🔐 [Security] API key is now stored in VSCode secure storage. It will automatically put your API key in secure storage if you have it in your settings config and then remove it from your settings config. - *Thanks for the feature request @flutterrausch*
- 🖥️ [UI] Added a "Verbosity" config setting and UI select.
- 🖥️ [UI] User messages will now include a code block if editor text selection is sent.
- 🖥️ [UI] Moved "Feedback", "Settings" and "Export" to "More Actions" menu.
- 🖥️ [UI] New users greeted with a "Getting started" page and API key input.
- 🎮 [QoL] Added "Disable Multiple Conversations" setting.
- 🎮 [QoL] Added "Minimal UI" setting.
- 🔧 [Fixes] Chat now scrolls to the bottom after context menu actions.
- 🔧 [Fixes] Modified default prompt for adding code comments.
- 🔧 [Fixes] Overlapping issues with tooltips fixed.

### March 25, 2023 (`v3.11.0` - `v3.11.5`)

- 🖥️ [UI] General UI look/feel updates. Note that these UI upates have a heavy focus on VSCode's UI guidelines and respecting each theme's color palette.
- 🖥️ [UI] Added multiple chats and model selector.
- 🖥️ [UI] Added a model selector. This will only show the models your API key has access to and links to the GPT-4 waitlist if your key does not have access.
- 🔩 [Behind the scenes] Refactor to use React+Redux for the UI. This will make it easier to build a dynamic UI.
- 🎮 [QoL] Updated scroll behavior. You can now scroll up as code is being generated, or scroll back to the bottom to "re-lock" the auto-scroll.
- 🎮 [QoL] When opening code in a new text editor, VSCode should now automatically know how to syntax highlight it.
- 🎮 [QoL] Configuring "System message" is now an extension setting.
