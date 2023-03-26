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

- [x] Short-term - Publish to VSCode Marketplace.
- [x] Short-term - Add model dropdown to ChatGPT UI.
- [x] Short-term - Allow more custom prompts.
- [x] Short-term - Add setting for a custom system message.
- [x] Short-term - Move API key from settings config to secure storage.
- [x] Short-term - Use API list API to show user what models they have access to.
- [ ] Short-term - Add way to manage custom prompts in UI.
- [ ] Long-term - Add option to stream directly into the editor.
- [ ] Long-term - Inline diff
- [ ] Long-term - "Smart" actions based on the type of file open.
- [ ] Long-term - "Smart" actions on that run at a project level.
- [ ] Long-term - AI-generated git commit messages
- [ ] TBD - Support davinci models in place of ChatGPT

## Tech

- [Yarn](https://yarnpkg.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [React](https://reactjs.org/)
- [Redux](https://redux.js.org/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)

- The UI is built with TailwindCSS. But, respecting VSCode's UI consistency and theme support is still a priority.
- This does not use VSCode's [WebView UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit/tree/main/src). But, I'm open to switching to the WebView UI toolkit since it better aligns with VSCode's UI.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Changelog

### March 26, 2023

**Security:**

- API key is now stored in VSCode secure storage. It will automatically put your API key in secure storage if you have it in your settings config and then remove it from your settings config.

**UI:**

- Added a "Verbosity" config setting and UI select. This will allow you to set the verbosity of the ChatGPT's responses, including just asking for the code and no explanation.
- Moved "Feedback", "Settings" and "Export" in a "More Actions" menu to reduce clutter.
- With the API key secure storage update, new users are now greeted with a "Getting started" page and an api key input.

**Quality of Life:**

- Added the "Disable Multiple Conversations" setting. This hides the chat tabs and only a single chat will be used.
- Added the "Minimal UI" setting. This will hide both the chat tabs and the smaller buttons below the chat input. Future UI additions will also be hidden with this toggle on.

**Fixes:**

- When using the context menu actions, chat should now scroll to the bottom.
- Modified the default prompt for adding code comments due to ChatGPT frequently misunderstanding "add comments".

### March 25, 2023 (combination of several updates this week)

**UI:**

- General UI look/feel updates were made. Note that these UI upates have a heavy focus on VSCode's UI guidelines and respecting each theme's color palette.
- Multiple chats has been added.
- Added a model selector. This will only show the models your API key has access to and links to the GPT-4 waitlist if your key does not have access.

**Behind the scenes:**

- A major refactor to use React+Redux for the UI has been completed. This will make it easier to build a dynamic UI.

**Quality of Life:**

- Updated scroll behavior - you can now scroll up as code is being generated, or scroll back to the bottom to "re-lock" the auto-scroll.
- When opening code in a new text editor, VSCode should now automatically know how to syntax highlight it.
- Configuring the "System message" is now an extension setting option.

**Bug Fixes:**

- Right-click copying code blocks should work now.
