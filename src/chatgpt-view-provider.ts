import delay from 'delay';
import hljs from 'highlight.js';
import fetch from 'isomorphic-fetch';
import { Configuration, OpenAIApi } from "openai";
import * as vscode from 'vscode';
import { ChatGPTAPI as ChatGPTAPI3 } from '../chatgpt-4.7.2/index';
import Auth from "./auth";
import { ChatGPTAPI as ChatGPTAPI35 } from './chatgpt-api';
import { Conversation, DeltaMessage, Message, Model, Role } from "./renderer/types";

export default class ChatGptViewProvider implements vscode.WebviewViewProvider {
	private webView?: vscode.WebviewView;

	public subscribeToResponse: boolean;
	public autoScroll: boolean;
	public useAutoLogin?: boolean;
	public model?: string;

	private apiGpt3?: ChatGPTAPI3;
	private apiGpt35?: ChatGPTAPI35;
	private chatMode?: boolean = true;
	private conversationId?: string;
	private messageId?: string;
	private systemContext: string;

	private inProgress: boolean = false;
	private throttling: number = 100;
	private abortController?: AbortController;
	private currentMessageId: string = "";
	private response: string = "";
	private chatGPTModels: Model[] = [];
	private authStore?: Auth;

	/**
	 * Message to be rendered lazily if they haven't been rendered
	 * in time before resolveWebviewView is called.
	 */
	private leftOverMessage?: any;
	constructor(private context: vscode.ExtensionContext) {
		this.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
		this.autoScroll = !!vscode.workspace.getConfiguration("chatgpt").get("response.autoScroll");
		this.model = vscode.workspace.getConfiguration("chatgpt").get("gpt3.model") as string;
		this.systemContext = vscode.workspace.getConfiguration('chatgpt').get('systemContext') ?? vscode.workspace.getConfiguration('chatgpt').get('systemContext.default') ?? '';
		this.throttling = vscode.workspace.getConfiguration("chatgpt").get("throttling") || 100;

		// Secret storage
		Auth.init(context);
		this.authStore = Auth.instance;
		vscode.commands.registerCommand("chatgptReborn.setOpenAIApiKey", async (apiKey: string) => {
			if (this.authStore) {
				await this.authStore.storeAuthData(apiKey);
			} else {
				console.error("Auth store not initialized");
			}
		});
		vscode.commands.registerCommand("chatgptReborn.getOpenAIApiKey", async () => {
			if (this.authStore) {
				const tokenOutput = await this.authStore.getAuthData();
				return tokenOutput;
			} else {
				console.error("Auth store not initialized");
				return undefined;
			}
		});

		// Check config settings for "chatgpt.gpt3.apiKey", if it exists, move it to the secret storage and remove it from the config
		const apiKey = vscode.workspace.getConfiguration("chatgpt").get("gpt3.apiKey") as string;
		if (apiKey) {
			this.authStore.storeAuthData(apiKey);
			vscode.workspace.getConfiguration("chatgpt").update("gpt3.apiKey", undefined, true);
		}

		// if the model or the system context changes, update the data members
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("chatgpt.gpt3.model")) {
				this.model = vscode.workspace.getConfiguration("chatgpt").get("gpt3.model") as string;
			}
			if (e.affectsConfiguration("chatgpt.systemContext")) {
				this.systemContext = vscode.workspace.getConfiguration('chatgpt').get('systemContext') ?? vscode.workspace.getConfiguration('chatgpt').get('systemContext.default') ?? '';
			}
			if (e.affectsConfiguration("chatgpt.throttling")) {
				this.throttling = vscode.workspace.getConfiguration("chatgpt").get("throttling") || 100;
			}
		});

		// if any of the extension settings change, send a message to the webview for the "settingsUpdate" event
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("chatgpt")) {
				this.sendMessage({
					type: "settingsUpdate",
					value: vscode.workspace.getConfiguration("chatgpt")
				});
			}
		});
	}

	// Param is optional - if provided, it will change the API key to the provided value
	// This func validates the API key against the OpenAI API (and notifies the webview of the result)
	// If valid it updates the chatGPTModels array (and notifies the webview of the available models)
	public async updateApiKeyState(apiKey: string = '') {
		if (apiKey) {
			// Run the setOpenAIApiKey command
			await vscode.commands.executeCommand("chatgptReborn.setOpenAIApiKey", apiKey);
		}

		let { valid, models } = await this.isGoodApiKey(apiKey);

		this.sendMessage({
			type: "updateApiKeyStatus",
			value: valid,
		});

		if (valid) {
			// Get an updated list of models
			this.getChatGPTModels(models).then(async (models) => {
				this.chatGPTModels = models;

				this.sendMessage({
					type: "chatGPTModels",
					value: this.chatGPTModels
				});
			});
		}
	}

	// reset the API key to the default value
	public async resetApiKey() {
		await vscode.commands.executeCommand("chatgptReborn.setOpenAIApiKey", "-");
		this.updateApiKeyState();
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.webView = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this.context.extensionUri
			]
		};

		webviewView.webview.html = this.getWebviewHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async data => {
			console.log("Main Process - Received message from webview: ", data);
			switch (data.type) {
				case 'addFreeTextQuestion':
					this.sendApiRequest(data.value, {
						command: "freeText",
						conversation: data.conversation ?? null,
						questionId: data.questionId ?? null,
						messageId: data.messageId ?? null,
						lastBotMessageId: data.lastBotMessageId,
					});
					break;
				case 'editCode':
					const escapedString = (data.value as string).replace(/\$/g, '\\$');;
					vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(escapedString));

					this.logEvent("code-inserted");
					break;
				case 'setModel':
					this.model = data.value;
					await vscode.workspace.getConfiguration("chatgpt").update("gpt3.model", data.value, vscode.ConfigurationTarget.Global);
					this.logEvent("model-changed to " + data.value);
					break;
				case 'openNew':
					const document = await vscode.workspace.openTextDocument({
						content: data.value,
						language: data.language
					});
					vscode.window.showTextDocument(document);

					this.logEvent(data.language === "markdown" ? "code-exported" : "code-opened");
					break;
				case 'clearConversation':
					this.messageId = undefined;
					this.conversationId = undefined;

					this.logEvent("conversation-cleared");
					break;
				case 'cleargpt3':
					this.apiGpt3 = undefined;

					this.logEvent("gpt3-cleared");
					break;
				case 'login':
					this.prepareConversation();
					break;
				case 'openSettings':
					vscode.commands.executeCommand('workbench.action.openSettings', "@ext:chris-hayes.chatgpt-reborn chatgpt.");

					this.logEvent("settings-opened");
					break;
				case 'openSettingsPrompt':
					vscode.commands.executeCommand('workbench.action.openSettings', "@ext:chris-hayes.chatgpt-reborn promptPrefix");

					this.logEvent("settings-prompt-opened");
					break;
				case "stopGenerating":
					this.stopGenerating();
					break;
				case "getSettings":
					this.sendMessage({
						type: "settingsUpdate",
						value: vscode.workspace.getConfiguration("chatgpt")
					});
					break;
				case "exportToMarkdown":
					// convert all messages in the conversation to markdown and open a new document with the markdown
					if (data?.conversation) {
						const markdown = this.convertMessagesToMarkdown(data.conversation);

						const markdownExport = await vscode.workspace.openTextDocument({
							content: markdown,
							language: 'markdown'
						});

						vscode.window.showTextDocument(markdownExport);
					} else {
						console.log("Main Process - No conversation to export to markdown");
					}
					break;
				case "getChatGPTModels":
					this.sendMessage({
						type: "chatGPTModels",
						value: this.chatGPTModels
					});
					break;
				case "changeApiKey":
					this.updateApiKeyState(data.value);
					break;
				case "getApiKeyStatus":
					this.updateApiKeyState();
					break;
				case "resetApiKey":
					this.resetApiKey();
					break;
				default:
					console.log('Main Process - Uncaught message type: "' + data.type + '"');
					break;
			}
		});

		if (this.leftOverMessage !== null) {
			// If there were any messages that wasn't delivered, render after resolveWebView is called.
			this.sendMessage(this.leftOverMessage);
			this.leftOverMessage = null;
		}
	}
	private convertMessagesToMarkdown(conversation: Conversation): string {
		let markdown = conversation.messages.reduce((accumulator: string, message: Message) => {
			const role = message.role === Role.user ? "You" : "ChatGPT";
			const isError = message.isError ? "ERROR: " : "";
			const content = message.rawContent ?? message.content;

			// Add language to code blocks using highlight.js auto-detection
			const wrappedContent = hljs.highlightAuto(content).value;
			const formattedMessage = `<code>**${isError}[${role}]**</code>\n\`\`\`${wrappedContent}\`\`\`\n\n`;
			return accumulator + formattedMessage;
		}, "");

		return markdown;
	}


	private stopGenerating(): void {
		this.abortController?.abort?.();
		this.inProgress = false;

		// show inProgress status update
		this.sendMessage({
			type: 'showInProgress',
			inProgress: this.inProgress,
			conversationId: 'stop gen, no conversation id'
		});

		// add response
		const responseInMarkdown = !this.isCodexModel;
		this.sendMessage({
			type: 'addResponse',
			value: this.response,
			done: true,
			id: this.currentMessageId,
			autoScroll: this.autoScroll,
			responseInMarkdown,
			conversationId: 'stop gen, no conversation id'
		});

		// log event
		this.logEvent("stopped-generating");
	}

	private get isCodexModel(): boolean {
		return !!this.model?.startsWith("code-");
	}

	private get isGpt35Model(): boolean {
		return !!this.model?.startsWith("gpt-");
	}

	private async getApiKey(): Promise<string> {
		return await vscode.commands.executeCommand('chatgptReborn.getOpenAIApiKey') ?? '';
	}

	async isGoodApiKey(apiKey: string = ''): Promise<{
		valid: boolean,
		models?: any[],
	}> {
		if (!apiKey) {
			// Get OpenAI API key from secret store
			apiKey = await vscode.commands.executeCommand('chatgptReborn.getOpenAIApiKey') as string;
		}

		// If empty, return false
		if (!apiKey) {
			return {
				valid: false,
			};
		}

		let configuration = new Configuration({
			apiKey,
		});

		// if the organization id is set in settings, use it
		const organizationId = await vscode.workspace.getConfiguration("chatgpt").get("organizationId") as string;
		if (organizationId) {
			configuration.organization = organizationId;
		}

		try {
			const openai = new OpenAIApi(configuration);
			const response = await openai.listModels();

			return {
				valid: true,
				models: response.data?.data
			};
		} catch (error) {
			return {
				valid: false,
			};
		}
	}

	async getModels(): Promise<any[]> {
		// Get OpenAI API key from secret store
		const apiKey = await vscode.commands.executeCommand('chatgptReborn.getOpenAIApiKey') as string;

		const configuration = new Configuration({
			apiKey,
		});

		// if the organization id is set in settings, use it
		const organizationId = await vscode.workspace.getConfiguration("chatgpt").get("organizationId") as string;
		if (organizationId) {
			configuration.organization = organizationId;
		}

		console.log('run getModels openai network call');

		try {
			const openai = new OpenAIApi(configuration);
			const response = await openai.listModels();

			return response.data?.data;
		} catch (error) {
			console.error('Main Process - Error getting models', error);
			return [];
		}
	}

	async getChatGPTModels(fullModelList: any[] = []): Promise<Model[]> {
		if (fullModelList?.length && fullModelList?.length > 0) {
			return fullModelList.filter((model: any) => ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-32k'].includes(model.id)).map((model: any) => {
				return model.id as Model;
			});
		} else {
			const models = await this.getModels();

			return models.filter((model: any) => ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-32k'].includes(model.id)).map((model: any) => {
				return model.id as Model;
			});
		}
	}
	public async prepareConversation(modelChanged = false): Promise<boolean> {
		const state = this.context.globalState;
		const configuration = vscode.workspace.getConfiguration("chatgpt");

		// Check if chat mode is enabled
		if (this.chatMode) {
			// Check if an API key is required and available
			if ((this.isGpt35Model && !this.apiGpt35) || (!this.isGpt35Model && !this.apiGpt3) || modelChanged) {

				// Retrieve API key and other configuration parameters from vscode workspace settings
				let apiKey = configuration.get("gpt3.apiKey") as string || state.get("chatgpt-gpt3-apiKey") as string;
				const organization = configuration.get("gpt3.organization") as string;
				const maxTokens = configuration.get("gpt3.maxTokens") as number;
				const temperature = configuration.get("gpt3.temperature") as number;
				const topP = configuration.get("gpt3.top_p") as number;
				const apiBaseUrl = configuration.get("gpt3.apiBaseUrl") as string;

				// If API key is not found, prompt user to enter it manually or store it in session
				if (!apiKey) {
					vscode.window.showErrorMessage(
						"Please add your API Key to use OpenAI official APIs. Storing the API Key in Settings is discouraged due to security reasons, though you can still opt-in to use it to persist it in settings. Instead you can also temporarily set the API Key one-time: You will need to re-enter after restarting the vs-code.",
						"Store in session (Recommended)",
						"Open settings"
					).then(async choice => {
						if (choice === "Open settings") {
							vscode.commands.executeCommand('workbench.action.openSettings', "chatgpt.gpt3.apiKey");
							return false;
						} else if (choice === "Store in session (Recommended)") {
							await vscode.window
								.showInputBox({
									title: "Store OpenAI API Key in session",
									prompt: "Please enter your OpenAI API Key to store in your session only. This option won't persist the token on your settings.json file. You may need to re-enter after restarting your VS-Code",
									ignoreFocusOut: true,
									placeHolder: "API Key",
									value: apiKey || ""
								})
								.then((value) => {
									if (value) {
										apiKey = value;
										state.update("chatgpt-gpt3-apiKey", apiKey);
										this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);
									}
								});
						}
					});

					return false;
				}

				// Initialize new instance of ChatGPTAPI35 or ChatGPTAPI3 with specified configuration parameters
				if (this.isGpt35Model) {
					this.apiGpt35 = new ChatGPTAPI35({
						apiKey: await vscode.commands.executeCommand('chatgptReborn.getOpenAIApiKey') ?? '',
						fetch,
						apiBaseUrl: apiBaseUrl?.trim() || undefined,
						organizationId: organization,
						systemMessage: this.systemContext,
						completionParams: {
							model: this.model,
							// eslint-disable-next-line @typescript-eslint/naming-convention
							max_tokens: maxTokens,
							temperature,
							// eslint-disable-next-line @typescript-eslint/naming-convention
							top_p: topP,
						},
					});
				} else {
					this.apiGpt3 = new ChatGPTAPI3({
						apiKey: await vscode.commands.executeCommand('chatgptReborn.getOpenAIApiKey') ?? '',
						fetch: fetch,
						apiBaseUrl: apiBaseUrl?.trim() || undefined,
						organization,
						completionParams: {
							model: this.model,
							// eslint-disable-next-line @typescript-eslint/naming-convention
							max_tokens: maxTokens,
							temperature,
							// eslint-disable-next-line @typescript-eslint/naming-convention
							top_p: topP,
						}
					});
				}
			}

		} else {
			// If chat mode is disabled, skip preparing conversation and return false
			this.logEvent('chat-mode-disabled (not sending request)');
			return false;
		}

		// Send loginSuccessful message to initiate conversation and log in event
		this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);
		this.logEvent("logged-in");

		return true;
	}

	private processQuestion(question: string, code?: string, language?: string) {
		if (code !== null && code !== undefined) {
			// If the lanague is not specified, get it from the active editor's language
			if (!language) {
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					language = editor.document.languageId;
				}
			}

			// if the language is still not specified, ask hljs to guess it
			if (!language) {
				const result = hljs.highlightAuto(code);
				language = result.language;
			}

			// Add prompt prefix to the code if there was a code block selected
			question = `${question}. ${language ? ` The following code is in ${language} programming language.` : ''} Code in question:\n\n###\n\n\`\`\`${language}\n${code}\n\`\`\``;
		}
		return question;
	}

	public async sendApiRequest(prompt: string, options: {
		command: string,
		conversation: Conversation,
		lastBotMessageId?: string,
		questionId?: string,
		messageId?: string,
		code?: string,
		previousAnswer?: string,
		language?: string;
	}) {
		if (this.inProgress) {
			// The AI is still thinking... Do not accept more questions.
			this.logEvent('api-request-rejected', {
				"chatgpt.command": options.command,
				"chatgpt.conversation": options.conversation,
				"chatgpt.lastBotMessageId": options.lastBotMessageId,
				"chatgpt.hasCode": String(!!options.code),
				"chatgpt.hasPreviousAnswer": String(!!options.previousAnswer)
			});
			return;
		}

		this.logEvent("api-request-sent", { "chatgpt.command": options.command, "chatgpt.hasCode": String(!!options.code), "chatgpt.hasPreviousAnswer": String(!!options.previousAnswer) });

		// TODO: this seems to rebuild the api object, consider not doing this on every request
		if (!await this.prepareConversation()) {
			this.logEvent('prepare-conversation-failed, exiting');
			return;
		}

		this.response = '';
		let question = this.processQuestion(prompt, options.code, options.language);
		const responseInMarkdown = !this.isCodexModel;

		// If the ChatGPT view is not in focus/visible; focus on it to render Q&A
		if (this.webView === null) {
			vscode.commands.executeCommand('vscode-chatgpt.view.focus');
		} else {
			this.webView?.show?.(true);
		}

		this.inProgress = true;
		this.abortController = new AbortController();
		this.sendMessage({
			type: 'showInProgress',
			inProgress: this.inProgress,
			showStopButton: true,
			conversationId: options.conversation?.id ?? 'no conversation id',
		});
		this.currentMessageId = options.messageId ?? this.getRandomId();

		// Only if the question doesn't already exist in the conversation
		if (!options.questionId) {
			this.sendMessage({
				type: 'addQuestion',
				value: prompt,
				code: options.code,
				autoScroll: this.autoScroll,
				conversationId: options.conversation.id ?? 'no conversation id',
				lastBotMessageId: options.lastBotMessageId ?? 'no last bot message id',
			});
		}

		this.logEvent('sending-message', {
			"chatgpt.command": options.command,
			"chatgpt.conversation": options.conversation,
			"chatgpt.lastBotMessageId": options.lastBotMessageId,
			"chatgpt.hasCode": String(!!options.code),
			"chatgpt.hasPreviousAnswer": String(!!options.previousAnswer)
		});
		try {
			if (this.chatMode) {
				let lastMessageTime = 0;

				if (this.isGpt35Model && this.apiGpt35) {
					this.sendMessage({
						type: 'debug',
						value: `sending message to GPT-3.5 ${question} ${options.lastBotMessageId} ${this.conversationId} ${this.messageId} ${this.isGpt35Model}`,
					});
					({ content: this.response, id: this.conversationId, parentMessageId: this.messageId } = await this.apiGpt35.sendMessage(question, options.conversation, {
						systemMessage: `${this.systemContext}`,
						messageId: this.conversationId,
						parentMessageId: options.lastBotMessageId, // this.messageId,
						abortSignal: this.abortController.signal,
						onProgress: (partialResponse: DeltaMessage) => {
							this.response = partialResponse.content;

							// Throttle sending messages to the webview
							const now = Date.now();
							if (now - lastMessageTime > this.throttling) {
								// @ts-ignore
								this.sendMessage({
									type: 'addResponse',
									value: this.response,
									id: this.currentMessageId,
									responseInMarkdown: responseInMarkdown,
									conversationId: options.conversation.id,
								});

								lastMessageTime = now;
							}
						},
					}));
				} else if (!this.isGpt35Model && this.apiGpt3) {
					this.logEvent('sending message to GPT-3.0 (not 3.5)');
					({ text: this.response, conversationId: this.conversationId, parentMessageId: this.messageId } = await this.apiGpt3.sendMessage(question, {
						promptPrefix: `${this.systemContext}`,
						abortSignal: this.abortController.signal,
						parentMessageId: options.lastBotMessageId,
						onProgress: (partialResponse) => {
							this.response = partialResponse.text;

							// Throttle sending messages to the webview
							const now = Date.now();
							if (now - lastMessageTime > this.throttling) {
								// @ts-ignore
								this.sendMessage({
									type: 'addResponse',
									value: this.response,
									id: this.currentMessageId,
									responseInMarkdown: responseInMarkdown,
									conversationId: options.conversation.id,
								});

								lastMessageTime = now;
							}
						},
					}));
				}
			} else {
				this.logEvent('chat-mode-off (not sending message)');
			}

			if (options.previousAnswer !== null && options.previousAnswer !== undefined) {
				this.response = options.previousAnswer + this.response;
			}

			const hasContinuation = ((this.response.split("```").length) % 2) === 0;

			if (hasContinuation) {
				this.response = this.response + " \r\n ```\r\n";
				vscode.window.showInformationMessage("It looks like ChatGPT didn't complete their answer for your coding question. You can ask it to continue and combine the answers.", "Continue and combine answers")
					.then(async (choice) => {
						if (choice === "Continue and combine answers") {
							this.sendApiRequest("Continue", {
								command: options.command,
								conversation: options.conversation,
								code: undefined,
								previousAnswer: this.response
							});
						}
					});
			}

			this.logEvent('sending-add-response-message', {
				"chatgpt.response": this.response,
				"chatgpt.conversation": options.conversation,
				"chatgpt.lastBotMessageId": options.lastBotMessageId,
				"chatgpt.hasCode": String(!!options.code),
				"chatgpt.hasPreviousAnswer": String(!!options.previousAnswer)
			});

			this.sendMessage({
				type: 'addResponse',
				conversationId: options.conversation.id ?? 'no conversation id',
				value: this.response,
				done: true,
				id: this.currentMessageId,
				autoScroll: this.autoScroll,
				responseInMarkdown
			});

			if (this.subscribeToResponse) {
				vscode.window.showInformationMessage("ChatGPT responded to your question.", "Open conversation").then(async () => {
					await vscode.commands.executeCommand('vscode-chatgpt.view.focus');
				});
			}
		} catch (error: any) {
			let message;
			let apiMessage = error?.response?.data?.error?.message || error?.tostring?.() || error?.message || error?.name;

			this.logError("api-request-failed");

			if (error?.response?.status || error?.response?.statusText) {
				message = `${error?.response?.status || ""} ${error?.response?.statusText || ""}`;

				vscode.window.showErrorMessage("An error occured. If this is due to max_token you could try `ChatGPT: Clear Conversation` command and retry sending your prompt.", "Clear conversation and retry").then(async choice => {
					if (choice === "Clear conversation and retry") {
						await vscode.commands.executeCommand("vscode-chatgpt.clearConversation");
						await delay(250);
						this.sendApiRequest(prompt, {
							conversation: options.conversation,
							lastBotMessageId: options.lastBotMessageId,
							command: options.command,
							code: options.code
						});
					}
				});
			} else if (error.statusCode === 400) {
				message = `Your model: '${this.model}' may be incompatible or one of your parameters is unknown. Reset your settings to default. (HTTP 400 Bad Request)`;
			} else if (error.statusCode === 401) {
				message = 'Make sure you are properly signed in. If you are using Browser Auto-login method, make sure the browser is open (You could refresh the browser tab manually if you face any issues, too). If you stored your API key in settings.json, make sure it is accurate. If you stored API key in session, you can reset it with `ChatGPT: Reset session` command. (HTTP 401 Unauthorized) Potential reasons: \r\n- 1.Invalid Authentication\r\n- 2.Incorrect API key provided.\r\n- 3.Incorrect Organization provided. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.';
			} else if (error.statusCode === 403) {
				message = 'Your token has expired. Please try authenticating again. (HTTP 403 Forbidden)';
			} else if (error.statusCode === 404) {
				message = `Your model: '${this.model}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. (HTTP 404 Not Found)`;
			} else if (error.statusCode === 429) {
				message = "Too many requests try again later. (HTTP 429 Too Many Requests) Potential reasons: \r\n 1. You exceeded your current quota, please check your plan and billing details\r\n 2. You are sending requests too quickly \r\n 3. The engine is currently overloaded, please try again later. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			} else if (error.statusCode === 500) {
				message = "The server had an error while processing your request, please try again. (HTTP 500 Internal Server Error)\r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
			}

			if (apiMessage) {
				message = `${message ? message + " " : ""}

	${apiMessage}
`;
			}

			this.sendMessage({
				type: 'addError',
				conversationId: options.conversation.id,
				value: message,
				autoScroll: this.autoScroll
			});

			return;
		} finally {
			this.inProgress = false;
			this.sendMessage({
				type: 'showInProgress',
				conversationId: options.conversation.id,
				inProgress: this.inProgress
			});
		}
	}

	/**
	 * Message sender, stores if a message cannot be delivered
	 * @param message Message to be sent to WebView
	 * @param ignoreMessageIfNullWebView We will ignore the command if webView is null/not-focused
	 */
	public sendMessage(message: any, ignoreMessageIfNullWebView?: boolean) {
		if (this.webView) {
			this.webView?.webview.postMessage(message);
		} else if (!ignoreMessageIfNullWebView) {
			this.leftOverMessage = message;
		}
	}


	private logEvent(eventName: string, properties?: {}): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.debug to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown", ...properties }, { "chatgpt.questionCounter": this.questionCounter });
		console.debug(eventName, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.model": this.model || "unknown", ...properties
		}, {
			"chatgpt.properties": properties,
		});
	}

	private logError(eventName: string): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.error to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryErrorEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
		console.error(eventName, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.model": this.model || "unknown"
		});
	}

	private getWebviewHtml(webview: vscode.Webview): string {
		const vendorHighlightCss = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.css'));
		const vendorHighlightJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.js'));
		const vendorMarkedJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'marked.min.js'));
		const vendorTurndownJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'turndown.js'));
		// React code bundled by webpack, this includes styling
		const webpackScript = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.bundle.js'));

		const nonce = this.getRandomId();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body class="overflow-hidden">
				<div id="root" class="flex flex-col h-screen">
				<script src="${vendorHighlightJs}" defer async></script>
				<script src="${vendorMarkedJs}" defer async></script>
				<script src="${vendorTurndownJs}" defer async></script>
				<script nonce="${nonce}" src="${webpackScript}" defer async></script>
				<link href="${vendorHighlightCss}" rel="stylesheet">
			</body>
			</html>`;
	}

	private getRandomId() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
