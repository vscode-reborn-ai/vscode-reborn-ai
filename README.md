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

**Required** - You must have access to GPT-4 via API. OpenAI's waitlist for GPT-4 API access is here: https://openai.com/waitlist/gpt-4-api

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
- [ ] Short-term - Move API key from settings config to secure storage.
- [x] Short-term - Use API list API to show user what models they have access to.
- [ ] Short-term - Add way to manage custom prompts in UI.
- [ ] Long-term - Add option to stream directly into the editor.
- [ ] Long-term - Inline diff
- [ ] Long-term - "Smart" actions based on the type of file open.
- [ ] Long-term - "Smart" actions on that run at a project level.
- [ ] Long-term - AI-generated git commit messages
- [ ] TBD - Support davinci models in place of ChatGPT

## Contributing

If you want to contribute to the vscode-chatgpt-reborn project, follow the project's contribution guidelines and submit pull requests or open issues on the GitHub repository:

[https://github.com/christopher-hayes/vscode-chatgpt-reborn](https://github.com/christopher-hayes/vscode-chatgpt-reborn)

## Tech

- [TypeScript](https://www.typescriptlang.org/)
- [VSCode Extension API](https://code.visualstudio.com/api)

### UI

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

- The UI is built with TailwindCSS. But, respecting VSCode's UI consistency and theme support is still a priority.
- This does not use VSCode's [WebView UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit/tree/main/src). But, I'm open to switching to the WebView UI toolkit since it better aligns with VSCode's UI.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
