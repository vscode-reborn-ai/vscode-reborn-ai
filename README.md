# ChatGPT Reborn

## Get for VSCode

Search for "ChatGPT Reborn" in the VSCode extension search.

or install it directly from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=chris-hayes.chatgpt-reborn).

## About

ChatGPT Reborn is a Visual Studio Code extension that allows you to use GPT-3/4 to refactor and improve your code.

Note: This version is API only, you create an OpenAI API key to use it.

This is a fork of the popular, but now discontinued [vscode-chatgpt](https://github.com/gencay/vscode-chatgpt) extension. Full credit to @gencay for building the original extension and open-sourcing it.

## GPT-4

To use GPT-4 use an API key that has access to GPT-4, if you're part of an organization that has access to GPT-4, set the organization ID in the settings. Note that GPT-4 is noticeably slower than GPT-3.5-turbo. Change the `chatgpt.gpt3.model` setting to `gpt-4` to use GPT-4, or set it to `gpt-3.5-turbo` to use GPT-3.5-turbo. You don't have to "Start new chat" to use a different model, the next message you send will use the new model.

This extension has an option for `gpt-4-32k`, but at this moment users that have access to `gpt-4` don't seem to have access to `gpt-4-32k` yet. It's still an option to allow users to use the 32k version the moment it's made available by OpenAI.

## Installation

To set up the project, first clone the repository:

bashCopy code

`git clone https://github.com/christopher-hayes/vscode-chatgpt-reborn.git`

Next, change into the project directory and install the dependencies using Yarn:

```bash
cd vscode-chatgpt-reborn
yarn install
```

## Running Scripts

You can run the following scripts using Yarn:

- Build the extension:

```bash
yarn run build
```

- Watch for changes and rebuild automatically:

```bash
yarn run watch
```

- Format the code using Prettier and run tests with fixes:

```bash
yarn run fmt
```

- Run tests using ESLint and TypeScript:

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
- [ ] Short-term - Add way to manage custom prompts in UI.
- [ ] Long-term - Add option to stream directly into the editor.
- [ ] Long-term - Inline diff

## Contributing

If you want to contribute to the vscode-chatgpt-reborn project, follow the project's contribution guidelines and submit pull requests or open issues on the GitHub repository:

[https://github.com/christopher-hayes/vscode-chatgpt-reborn](https://github.com/christopher-hayes/vscode-chatgpt-reborn)
