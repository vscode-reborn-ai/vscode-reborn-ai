import delay from 'delay';
import fetch from 'isomorphic-fetch';
import * as vscode from 'vscode';
import { ChatGPTAPI as ChatGPTAPI3 } from '../chatgpt-4.7.2/index';
import { ChatGPTAPI as ChatGPTAPI35 } from '../chatgpt-5.1.1/index';
import { AuthType, LoginMethod } from "./types";

export default class ChatGptViewProvider implements vscode.WebviewViewProvider {
	private webView?: vscode.WebviewView;

	public subscribeToResponse: boolean;
	public autoScroll: boolean;
	public useAutoLogin?: boolean;
	public useGpt3?: boolean;
	public profilePath?: string;
	public model?: string;

	private apiGpt3?: ChatGPTAPI3;
	private apiGpt35?: ChatGPTAPI35;
	private conversationId?: string;
	private messageId?: string;
	private loginMethod?: LoginMethod;
	private authType?: AuthType;

	private questionCounter: number = 0;
	private inProgress: boolean = false;
	private abortController?: AbortController;
	private currentMessageId: string = "";
	private response: string = "";

	/**
	 * Message to be rendered lazily if they haven't been rendered
	 * in time before resolveWebviewView is called.
	 */
	private leftOverMessage?: any;
	constructor(private context: vscode.ExtensionContext) {
		this.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
		this.autoScroll = !!vscode.workspace.getConfiguration("chatgpt").get("response.autoScroll");
		this.model = vscode.workspace.getConfiguration("chatgpt").get("gpt3.model") as string;

		this.setMethod();
		this.setProfilePath();
		this.setAuthType();
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
						conversationId: data.conversationId ?? 'no conversation id from webview, data: ' + JSON.stringify(data),
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

	private stopGenerating(): void {
		this.abortController?.abort?.();
		this.inProgress = false;
		this.sendMessage({
			type: 'showInProgress',
			inProgress: this.inProgress,
			conversationId: 'stop gen, no conversation id'
		});
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
		this.logEvent("stopped-generating");
	}

	public clearSession(): void {
		this.stopGenerating();
		this.apiGpt3 = undefined;
		this.messageId = undefined;
		this.conversationId = undefined;
		this.logEvent("cleared-session");
	}

	public setMethod(): void {
		this.loginMethod = vscode.workspace.getConfiguration("chatgpt").get("method") as LoginMethod;

		this.useGpt3 = true;
		this.useAutoLogin = false;
		this.clearSession();
	}

	public setAuthType(): void {
		this.authType = vscode.workspace.getConfiguration("chatgpt").get("authenticationType");
		this.clearSession();
	}

	public setProfilePath(): void {
		this.profilePath = vscode.workspace.getConfiguration("chatgpt").get("profilePath");
		this.clearSession();
	}

	private get isCodexModel(): boolean {
		return !!this.model?.startsWith("code-");
	}

	private get isGpt35Model(): boolean {
		return !!this.model?.startsWith("gpt-");
	}

	public async prepareConversation(modelChanged = false): Promise<boolean> {
		if (modelChanged && this.useAutoLogin) {
			// no need to reinitialize in autologin when model changes
			return false;
		}

		const state = this.context.globalState;
		const configuration = vscode.workspace.getConfiguration("chatgpt");

		if (this.useGpt3) {
			if ((this.isGpt35Model && !this.apiGpt35) || (!this.isGpt35Model && !this.apiGpt3) || modelChanged) {
				let apiKey = configuration.get("gpt3.apiKey") as string || state.get("chatgpt-gpt3-apiKey") as string;
				const organization = configuration.get("gpt3.organization") as string;
				const maxTokens = configuration.get("gpt3.maxTokens") as number;
				const temperature = configuration.get("gpt3.temperature") as number;
				const topP = configuration.get("gpt3.top_p") as number;
				const apiBaseUrl = configuration.get("gpt3.apiBaseUrl") as string;

				if (!apiKey) {
					vscode.window.showErrorMessage("Please add your API Key to use OpenAI official APIs. Storing the API Key in Settings is discouraged due to security reasons, though you can still opt-in to use it to persist it in settings. Instead you can also temporarily set the API Key one-time: You will need to re-enter after restarting the vs-code.", "Store in session (Recommended)", "Open settings").then(async choice => {
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

				if (this.isGpt35Model) {
					this.apiGpt35 = new ChatGPTAPI35({
						apiKey,
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
				} else {
					this.apiGpt3 = new ChatGPTAPI3({
						apiKey,
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
		}

		this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);
		this.logEvent("logged-in");

		return true;
	}

	private get systemContext() {
		return vscode.workspace.getConfiguration('chatgpt').get('systemContext') ?? `You are ChatGPT helping the User with coding.You are intelligent, helpful and an expert developer, who always gives the correct answer and only does what instructed. If the user is asking for a code change or new code, only respond with new code, do not give explanations. When responding to the following prompt, please make sure to properly style your response using Github Flavored Markdown. Use markdown syntax for things like headings, lists, colored text, code blocks, highlights etc. Make sure not to mention markdown or styling in your actual response.`;
	}


	private processQuestion(question: string, code?: string, language?: string) {
		if (code !== null) {
			// Add prompt prefix to the code if there was a code block selected
			question = `${question}${language ? ` (The following code is in ${language} programming language)` : ''}: ${code}`;
		}
		return question + "\r\n";
	}

	public async sendApiRequest(prompt: string, options: {
		command: string,
		conversationId?: string,
		lastBotMessageId?: string,
		code?: string,
		previousAnswer?: string,
		language?: string;
	}) {
		if (this.inProgress) {
			// The AI is still thinking... Do not accept more questions.
			this.logEvent('api-request-rejected', {
				"chatgpt.command": options.command,
				"chatgpt.hasCode": String(!!options.code),
				"chatgpt.hasPreviousAnswer": String(!!options.previousAnswer)
			});
			return;
		}

		this.questionCounter++;

		this.logEvent("api-request-sent", { "chatgpt.command": options.command, "chatgpt.hasCode": String(!!options.code), "chatgpt.hasPreviousAnswer": String(!!options.previousAnswer) });

		if (!await this.prepareConversation()) {
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
			showStopButton: this.useGpt3,
			conversationId: options.conversationId ?? 'no conversation id',
		});
		this.currentMessageId = this.getRandomId();

		this.sendMessage({
			type: 'addQuestion',
			value: prompt,
			code: options.code,
			autoScroll: this.autoScroll,
			conversationId: options.conversationId ?? 'no conversation id',
			lastBotMessageId: options.lastBotMessageId ?? 'no last bot message id',
		});
		const isObject = function (value: any) {
			var type = typeof value;
			return value !== null && (type === 'object' || type === 'function');
		};

		const debounce = (func: (arg0: any) => void, delay: number | undefined, { leading }: any) => {
			let timerId: string | number | NodeJS.Timeout | undefined;

			return (...args: any) => {
				if (!timerId && leading) {
					// @ts-ignore
					func(...args);
				}
				clearTimeout(timerId);

				// @ts-ignore
				timerId = setTimeout(() => func(...args), delay);
			};
		};

		const throttle = function (func: any, wait: number, options?: { leading: any; trailing: any; maxWait: any; } | undefined) {
			var leading = true,
				trailing = true;

			if (typeof func !== 'function') {
				throw new TypeError('Expected a function');
			}
			if (options && isObject(options)) {
				leading = 'leading' in options ? !!options.leading : leading;
				trailing = 'trailing' in options ? !!options.trailing : trailing;
			}
			return debounce(func, wait, {
				leading: leading,
				// @ts-ignore
				maxWait: wait,
				trailing: trailing
			});
		};


		try {
			if (this.useGpt3) {
				const throttledSendMessage = throttle(function (data: any) {
					// @ts-ignore
					data.sendMessage({
						type: 'addResponse',
						value: data.response,
						id: data.currentMessageId,
						autoScroll: data.autoScroll,
						responseInMarkdown: data.responseInMarkdown,
						conversationId: data.conversationId,
					});
				}, 100);

				if (this.isGpt35Model && this.apiGpt35) {
					const gpt3Response = await this.apiGpt35.sendMessage(question, {
						systemMessage: `${this.systemContext}`,
						// messageId: this.conversationId,
						parentMessageId: options.lastBotMessageId, // this.messageId,
						abortSignal: this.abortController.signal,
						onProgress: (partialResponse) => {
							this.response = partialResponse.text;
							throttledSendMessage({
								sendMessage: this.sendMessage,
								value: this.response,
								id: this.currentMessageId,
								autoScroll: this.autoScroll,
								responseInMarkdown: responseInMarkdown,
								conversationId: options.conversationId,
							});
						},
					});
					({ text: this.response, id: this.conversationId, parentMessageId: this.messageId } = gpt3Response);
				} else if (!this.isGpt35Model && this.apiGpt3) {
					({ text: this.response, conversationId: this.conversationId, parentMessageId: this.messageId } = await this.apiGpt3.sendMessage(question, {
						promptPrefix: `${this.systemContext}`,
						abortSignal: this.abortController.signal,
						parentMessageId: options.lastBotMessageId,
						onProgress: (partialResponse) => {
							this.response = partialResponse.text;
							throttledSendMessage({
								sendMessage: this.sendMessage,
								value: this.response,
								id: this.currentMessageId,
								autoScroll: this.autoScroll,
								responseInMarkdown: responseInMarkdown,
								conversationId: options.conversationId,
							});
						},
					}));
				}
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
								conversationId: options.conversationId,
								code: undefined,
								previousAnswer: this.response
							});
						}
					});
			}

			this.sendMessage({
				type: 'addResponse',
				conversationId: options.conversationId ?? 'no conversation id',
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
							conversationId: options.conversationId,
							lastBotMessageId: options.lastBotMessageId,
							command: options.command,
							code: options.code
						});
					}
				});
			} else if (error.statusCode === 400) {
				message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or one of your parameters is unknown. Reset your settings to default. (HTTP 400 Bad Request)`;

			} else if (error.statusCode === 401) {
				message = 'Make sure you are properly signed in. If you are using Browser Auto-login method, make sure the browser is open (You could refresh the browser tab manually if you face any issues, too). If you stored your API key in settings.json, make sure it is accurate. If you stored API key in session, you can reset it with `ChatGPT: Reset session` command. (HTTP 401 Unauthorized) Potential reasons: \r\n- 1.Invalid Authentication\r\n- 2.Incorrect API key provided.\r\n- 3.Incorrect Organization provided. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.';
			} else if (error.statusCode === 403) {
				message = 'Your token has expired. Please try authenticating again. (HTTP 403 Forbidden)';
			} else if (error.statusCode === 404) {
				message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. (HTTP 404 Not Found)`;
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
				conversationId: options.conversationId,
				value: message,
				autoScroll: this.autoScroll
			});

			return;
		} finally {
			this.inProgress = false;
			this.sendMessage({
				type: 'showInProgress',
				conversationId: options.conversationId,
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
			"chatgpt.loginMethod": this.loginMethod!,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.authType": this.authType!,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.model": this.model || "unknown", ...properties
		}, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.questionCounter": this.questionCounter
		});
	}

	private logError(eventName: string): void {
		// You can initialize your telemetry reporter and consume it here - *replaced with console.error to prevent unwanted telemetry logs
		// this.reporter?.sendTelemetryErrorEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
		console.error(eventName, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.loginMethod": this.loginMethod!,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.authType": this.authType!,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.model": this.model || "unknown"
		}, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"chatgpt.questionCounter": this.questionCounter
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
