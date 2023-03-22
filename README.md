# ChatGPT Reborn

ChatGPT Reborn is a Visual Studio Code extension that allows you to use the ChatGPT API to write, refactor, and improve your code.

## Get for VSCode

Search for "ChatGPT Reborn" in the VSCode extension search.

or install it directly from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=chris-hayes.chatgpt-reborn).

## About this fork

This is a fork of the popular, but now discontinued [vscode-chatgpt](https://github.com/gencay/vscode-chatgpt) extension. Full credit to @gencay for building the original extension and open-sourcing it. Note that this version is API-only, the browser code was not open-sourced by Gencay (due to OpenAI ToS issue), and I have no intention of violating OpenAI's ToS either.

**The new "ChatGPT: Genie AI" extension**

Gencay has released a *new* extension, "ChatGPT: Genie AI", that is a continuation of his work in an API-only format: <https://github.com/ai-genie/chatgpt-vscode>

**What does that mean for this fork?**

I'll be continuing work on this extension, I have some ideas for features that focus on automation. A major react refactor will be releasing soon, which sets the groundwork for a more powerful UI experience.

**FOSS**

As a FOSS advocate, I feel compelled to note that Genie AI is not open-source and it sounds (to me at least) like it may at some point have paid features. I don't have a personal issue with that, it may allow Genie AI to become far more powerful and useful to users. But, you can expect "Reborn" to stay FOSS for as long as I am maintainer, and if you're a fan of open-source - feedback, issues, and PRs are welcome.

### GPT-4

**Note:** You must have access to GPT-4 via API key to use GPT-4. You would've signed up on the GPT-4 waitlist and received an email that you now have GPT-4 API access. This is **not** the same as having access to GPT-4 at chat.openai.com, that is not considered "API access".

To use GPT-4 use an API key that has access to GPT-4, if you're part of an organization that has access to GPT-4, set the organization ID in the settings. Note that GPT-4 is noticeably slower than GPT-3.5-turbo. Change the `chatgpt.gpt3.model` setting to `gpt-4` to use GPT-4, or set it to `gpt-3.5-turbo` to use GPT-3.5-turbo. You don't have to "Start new chat" to use a different model, the next message you send will use the new model.

This extension has an option for `gpt-4-32k`, but at this moment users that have access to `gpt-4` don't seem to have access to `gpt-4-32k` yet. It's still an option to allow users to use the 32k version the moment it's made available by OpenAI.

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
- [ ] Short-term - Add way to manage custom prompts in UI.
- [ ] Long-term - Add option to stream directly into the editor.
- [ ] Long-term - Inline diff

## Contributing

If you want to contribute to the vscode-chatgpt-reborn project, follow the project's contribution guidelines and submit pull requests or open issues on the GitHub repository:

[https://github.com/christopher-hayes/vscode-chatgpt-reborn](https://github.com/christopher-hayes/vscode-chatgpt-reborn)

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
