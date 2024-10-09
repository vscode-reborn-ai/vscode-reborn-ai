# Changelog

**Contributors:**

[@Christopher-Hayes](github.com/Christopher-Hayes) - [@danyalaytekin](github.com/danyalaytekin) - [@flutterrausch](github.com/flutterrausch) - [@hakula139](github.com/hakula139) - [@lvii](github.com/lvii) - [@moritz-t-w](github.com/moritz-t-w) - [@nickv2002](github.com/nickv2002) - [@nossebro](github.com/nossebro) - [@PeterDaveHello](github.com/PeterDaveHello) - [@raphael2692](github.com/raphael2692) - [@rambalachandran](github.com/rambalachandran) - [@xmjiao](github.com/xmjiao) - [@wojtekcz](github.com/wojtekcz) - [@ZsgsDesign](github.com/ZsgsDesign) - [@zzy-life](github.com/zzy-life)

## [Not yet released]

- ✨ **Feature** - Added support for `o1-preview` and `o1-mini` when using OpenAI.
- 🌐 **i18n** - Added more languages (Arabic, Bengali, Hindi, Indonesian, Malay, Russian, Thai, Tagalog, Urdu, and Vietnamese). *Thanks @PeterDaveHello*
- 🎨 **Branding** - Custom app logo added to avoid using OpenAI's logo.
- 🔧 **Fix** - Code with string interpolation no longer omits code when inserted into the editor.
- 🔧 **Fix** - Corrected the context window for `gpt-3.5-turbo`. *Thanks @PeterDaveHello*
- 🔩 **Behind the scenes** - Removed `gpt-3.5-turbo`. Users will be moved to `gpt-4o-mini` since it's better while being about the same cost.

## July 22, 2024 [v3.25.0]

- ✨ **Feature** - Added support for OpenAI's latest model, `gpt-4o-mini`, it's basically a more capable and cost-effective `gpt-3.5-turbo`. - *Thanks for the PR @PeterDaveHello*
- 🖥️ **UI** - Below the ask button, you'll now see the "Max Cost" instead of the "Max tokens". Token breakdown wording also consolidated. - *Thank you for the suggestions @moritztim*
- 🌐 **i18n** - Translations updated for `gpt-4o`. - *Thanks for the PR @PeterDaveHello*
- 🔩 **Behind the scenes** - We now use Vercel's `ai` library. This means we can do more with non-OpenAI models. We also renamed the azure api version config, to avoid confusion.

## June 20, 2024 [v3.24.0]

- ✨ **Feature** - Added support for Azure's OpenAI API. - *Thank you for the suggestion @PeterDaveHello & @rambalachandran*
- 🖥️ **UI** - When using OpenRouter, the model selector can now show descriptions.
- 🖥️ **UI** - Redesigned conversation tabs to match the design of VS Code's editor tabs.
- 🔧 **Fix** - UI color fixes to ensure the extension is usable across all themes.

## June 14, 2024 [v3.23.0 - v3.23.2]

- ✨ **Feature** - Conversation tabs now auto-rename.
- ✨ **Feature** - Improved local LLM support. New "Use Local LLM" page to easily connect to a local LLM.
- ✨ **Feature** - Custom models now appear in the model selector if "Show All Models" is enabled. New UI for searching across custom models.
- 🔧 **Fix** - Resolved `apiBaseUrl` config issue. *Thanks for the bug report @nossebro.*
- 🎮 **QoL** - Local API keys are now associated with the API URL, allowing seamless API switching without re-entering keys.
- 🎮 **QoL** - If you're using OpenRouter, the "Use Local LLM" UI supports automatic api key generation using OAuth.
- 🎮 **QoL** - The model selector typically hides rarely used OpenAI models. The "Show All Models" setting now reveals all models for alternative APIs, like OpenRouter.
- 🎮 **QoL** - Partial support for ollama's API. /api/models is now supported, but other ollama APIs are not yet supported.

## June 4, 2024 [v3.22.0]

- ✨ **Feature** - Added support for the latest `gpt-4o` model. This model is slightly better than `gpt-4-turbo`, faster, and half the price. - *Thank you for the help on this one @nickv2002*
- 🔩 **Behind the scenes** - "GPT-4 Turbo" is no longer in preview. We've switched to the official `gpt-4-turbo` model, this model gets automatically updated by OpenAI every quarter or so. - *Thank you for the PR @PeterDaveHello*
- 🎮 **QoL** - The model selector UI has been updated to show the price comparison more clearly. - *Thank you for the suggestion @moritz-t-w*

## November 26, 2023 [v3.20.2]

- 🔧 **Fixes** - Fixes bugs with `gpt-4-turbo` context being limited to 4,096 tokens, instead of its full 128,000 context window. - *Thank you for the report @xmjiao*
- 🎮 **QoL** - Minor improvements to token counting. Token modal now shows full token breakdown. Token counter turns red when above context limit.

## November 25, 2023 [v3.20.0 - v3.20.1]

- ✨ **Feature** - Added support for the `gpt-4-1106-preview` model. This model supports 128,000 token input context. The output token limit is 4,096. It's ~3x less expensive than `gpt-4`. - *Thank you for the suggestion @xmjiao*
- 🎮 **QoL** - The context menu items have been consolidated into a single "ChatGPT" submenu to reduce clutter.
- 🔧 **Fixes** - Fix highlighting of HTML characters. - *Thank you for the PR @ZsgsDesign*
- 🎮 **QoL** - OpenAI is beginning to have different prompt and complete token limits. The model selector now has more specific model info, including token prompt/complete limits.
- 🔧 **Fixes** - When HTML code is used in the question, the code should no longer be injected.

## July 31, 2023 [v3.19.0 - v3.19.1]

- 🎮 **QoL** - Allow the user to set a proxy/alternative API base URL at the setup screen. - *Thank you for the report @zzy-life*
- 🔧 **Fixes** - The right-click menu had "Add tests" twice, the label for the 2nd one is fixed to be "Add comments". - *Thank you for the report @wojtekcz*
- 🔧 **Fixes** - Bullet points were not showing in ChatGPT's response. - *Thank you for the report @wojtekcz*
- 🔧 **Fixes** - "export to markdown" button was not correctly showing markdown in the export. - *Thank you for the report @wojtekcz*
- 🔩 **Behind the scenes** - More of the UI is being separated into components to improve maintainability.

## July 11, 2023 [v3.18.1]

- 🌐 **i18n** - Fix syntax errors in translation files. - *Thank you for the PR @PeterDaveHello*

## July 3, 2023 [v3.18.0]

- 🌐 **i18n** - Taiwan localization improved with native Mandarin translations. - *This PR is highly appreciated @PeterDaveHello*

## June 27, 2023 [v3.17.0]

- 🔧 **Fixes** - Token count calculation bugs fixed. Updated to reflect new OpenAI pricing.
- ✨ **Feature** - Added support for the `gpt-3.5-turbo-16k` model. This model is a 16,000 token version of GPT-3.5. It's a good option if you need more tokens than the 4,000 token version of GPT-3.5. It's ~2x more expensive than `gpt-3.5-turbo`; however, it's still much cheaper than `gpt-4`. - *Thank you for the PR @raphael2692*
- 🌐 **i18n** - Added Traditional Chinese translation for Taiwan-based users.

## May 30, 2023 [v3.16.5]

- 🔧 **Fixes** - Onboarding - Fix api key verification issue relating to the api url config setting. - *Thanks for the PR @zzy-life*

## May 19, 2023 [v3.16.4]

- 🔧 **Fixes** - Onboarding - Fix api key verification not working with proxy api endpoints.

## May 9, 2023 [v3.16.3]

- 🌐 **i18n** - Translation file refactor to work more predictably. Right-click menu is now translated. - *Thanks for the PR @zzy-life*
- 🔧 **Fixes** - Expanded the VSCode support to version `v1.70.0` (July 2022). Previously it was to `v1.73.0` (October 2022). Can lower more if needed. - *Thanks for the bug report @zzy-life*
- 🖥️ **UI** - Text about this being a fork has been removed since it's no longer really needed, and clutters the UI. - *Thanks for the suggestion @danyalaytekin*

## April 8, 2023 [v3.16.1]

- 🔧 **Fixes** - Using a proxy causes "unexpected end of JSON" error. - *Thanks for the bug report @lvii*
- 🖥️ **UI** - Made error messages a little more helpful.

## April 3, 2023 [v3.15.2 - v3.16.0]

- 🖥️ **UI** - "Actions" page added. A couple actions are available, more will be added in the future. Automate your workflow with AI!
- 🖥️ **UI** - Codeblock buttons are now sticky.
- 🖥️ **UI** - UI fixes for light themes.
- 🖥️ **UI** - Token breakdown now warns about gpt-4 pricing.

## March 30, 2023 [v3.15.0 - v3.15.1]

- 🌐 **i18n** - Initial i18n support, localization is still a work in progress.
- 🔧 **Fixes** - Fix 404 error due to invalid API base URL. - *Thanks for the bug report @hakula139*

## March 28, 2023 [v3.14.0]

- 🖥️ **UI** - Add token count UI
- 🖥️ **UI** - "Clear" button added for clearning the conversation. Highly recommend using it to avoid expensive token usage with long conversations.
- 🖥️ **UI** - Minor tweaks to mini buttons below input box to prefer wrapping on smaller windows and ui fixes to actions menu on smaller windows.
- 🔧 **Fixes** - Token counting issues causing `4096` maxTokens config setting to fail. - *Thanks for the bug report @PeterDaveHello*
- 🔩 **Behind the scenes** - API provider refactor. Moving towards using the `OpenAI` library and its SDK for better maintainability. Note that `baseUrl` setting should now end in `/v1`, which matches OpenAI's SDK for `basePath`.

## March 26, 2023 [v3.12.0 - v3.12.1, v3.13.0 - v3.13.1]

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

## March 25, 2023 [v3.11.0 - v3.11.5]

- 🖥️ **UI** - General UI look/feel updates. Note that these UI upates have a heavy focus on VSCode's UI guidelines and respecting each theme's color palette.
- 🖥️ **UI** - Added multiple chats and model selector.
- 🖥️ **UI** - Added a model selector. This will only show the models your API key has access to and links to the GPT-4 waitlist if your key does not have access.
- 🔩 **Behind the scenes** - Refactor to use React+Redux for the UI. This will make it easier to build a dynamic UI.
- 🎮 **QoL** - Updated scroll behavior. You can now scroll up as code is being generated, or scroll back to the bottom to "re-lock" the auto-scroll.
- 🎮 **QoL** - When opening code in a new text editor, VSCode should now automatically know how to syntax highlight it.
- 🎮 **QoL** - Configuring "System message" is now an extension setting.

[Not yet released]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.25.0...HEAD
[v3.25.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.24.0...3.25.0
[v3.24.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.23.2...3.24.0
[v3.23.0 - v3.23.2]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.22.0...3.23.2
[v3.22.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.20.2...3.22.0
[v3.20.2]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.20.1...3.20.2
[v3.20.0 - v3.20.1]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.19.1...3.20.1
[v3.19.0 - v3.19.1]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.18.1...3.19.1
[v3.18.1]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.18.0...3.18.1
[v3.18.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.17.0...3.18.0
[v3.17.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.16.5...3.17.0
[v3.16.5]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.16.4...3.16.5
[v3.16.4]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.16.3...3.16.4
[v3.16.3]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.16.1...3.16.3
[v3.16.1]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.16.0...3.16.1
[v3.15.2 - v3.16.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.15.1...3.16.0
[v3.15.0 - v3.15.1]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.14.0...3.15.1
[v3.14.0]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.13.1...3.14.0
[v3.12.0 - v3.12.1, v3.13.0 - v3.13.1]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/3.11.5...3.13.1
[v3.11.0 - v3.11.5]: https://github.com/vscode-reborn-ai/vscode-reborn-ai/compare/4d4c1ec...3.11.5
