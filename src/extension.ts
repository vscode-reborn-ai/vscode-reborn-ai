import * as vscode from "vscode";
import ChatGptViewProvider from './chatgpt-view-provider';
import { getSelectedModel } from "./utils";

const menuCommands = [
	"addTests", "findProblems", "optimize", "explain",
	"addComments", "completeCode", "generateCode",
	"customPrompt1", "customPrompt2", "customPrompt3", "customPrompt4", "customPrompt5", "customPrompt6",
	"adhoc"];

export async function activate(context: vscode.ExtensionContext) {
	let adhocCommandPrefix: string = context.globalState.get("chatgpt-adhoc-prompt") || '';
	const provider = new ChatGptViewProvider(context);

	const view = vscode.window.registerWebviewViewProvider(
		"vscode-chatgpt.view",
		provider,
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		}
	);

	const freeText = vscode.commands.registerCommand("vscode-chatgpt.freeText", async () => {
		const value = await vscode.window.showInputBox({
			prompt: "Ask anything...",
		});

		if (value) {
			const currentConversation = provider.currentConversation;

			if (currentConversation) {
				provider?.sendApiRequest(value, {
					command: "freeText",
					conversation: currentConversation,
					language: vscode.window.activeTextEditor?.document.languageId,
				});
			} else {
				console.error("freeText - No current conversation found");
			}
		}
	});

	const resetThread = vscode.commands.registerCommand("vscode-chatgpt.clearConversation", async () => {
		provider?.sendMessage({ type: 'clearConversation' }, true);
	});

	const exportConversation = vscode.commands.registerCommand("vscode-chatgpt.exportConversation", async () => {
		const currentConversation = provider.currentConversation;
		provider?.sendMessage({ type: 'exportToMarkdown', conversation: currentConversation }, true);
	});

	const clearSession = vscode.commands.registerCommand("vscode-chatgpt.clearSession", () => {
		context.globalState.update("chatgpt-gpt3-apiKey", null);
	});

	const configChanged = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('chatgpt.response.showNotification')) {
			provider.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
		}

		if (e.affectsConfiguration('chatgpt.gpt3.model')) {
			provider.model = getSelectedModel();
		}

		if (e.affectsConfiguration('chatgpt.promptPrefix') || e.affectsConfiguration('chatgpt.gpt3.generateCode-enabled') || e.affectsConfiguration('chatgpt.gpt3.model')) {
			setContext();
		}
	});

	const adhocCommand = vscode.commands.registerCommand("vscode-chatgpt.adhoc", async () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.document.getText(editor.selection);
		let dismissed = false;
		if (selection) {
			await vscode.window
				.showInputBox({
					title: "Add prefix to your ad-hoc command",
					prompt: "Prefix your code with your custom prompt. i.e. Explain this",
					ignoreFocusOut: true,
					placeHolder: "Ask anything...",
					value: adhocCommandPrefix
				})
				.then((value) => {
					if (!value) {
						dismissed = true;
						return;
					}

					adhocCommandPrefix = value.trim() || '';
					context.globalState.update("chatgpt-adhoc-prompt", adhocCommandPrefix);
				});

			if (!dismissed && adhocCommandPrefix?.length > 0) {
				const currentConversation = provider.currentConversation;

				if (currentConversation) {
					provider?.sendApiRequest(adhocCommandPrefix, {
						command: "adhoc",
						code: selection,
						conversation: currentConversation,
						language: editor.document.languageId,
					});
				} else {
					console.error("adhoc - No current conversation found");
				}
			}
		}
	});

	const generateCodeCommand = vscode.commands.registerCommand(`vscode-chatgpt.generateCode`, () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.document.getText(editor.selection);
		if (selection) {
			const currentConversation = provider.currentConversation;

			if (currentConversation) {
				provider?.sendApiRequest(selection, {
					command: "generateCode",
					language: editor.document.languageId,
					conversation: currentConversation,
				});
			} else {
				console.error("generateCode - No current conversation found");
			}
		}
	});

	// Skip AdHoc - as it was registered earlier
	const registeredCommands = menuCommands.filter(command => command !== "adhoc" && command !== "generateCode").map((command) => vscode.commands.registerCommand(`vscode-chatgpt.${command}`, () => {
		const prompt = vscode.workspace.getConfiguration("chatgpt").get<string>(`promptPrefix.${command}`);
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.document.getText(editor.selection);
		if (selection && prompt) {
			const currentConversation = provider.currentConversation;

			if (currentConversation) {
				provider?.sendApiRequest(prompt, {
					command,
					code: selection,
					language: editor.document.languageId,
					conversation: currentConversation,
				});
			} else {
				console.error(`${command} - No current conversation found`);
			}
		}
	}));

	context.subscriptions.push(view, freeText, resetThread, exportConversation, clearSession, configChanged, adhocCommand, generateCodeCommand, ...registeredCommands);

	const setContext = () => {
		menuCommands.forEach(command => {
			if (command === "generateCode") {
				let generateCodeEnabled = !!vscode.workspace.getConfiguration("chatgpt").get<boolean>("gpt3.generateCode-enabled");
				const modelName = getSelectedModel();
				const method = vscode.workspace.getConfiguration("chatgpt").get("method") as string;
				generateCodeEnabled = generateCodeEnabled && method === "GPT3 OpenAI API Key" && modelName.startsWith("code-");
				vscode.commands.executeCommand('setContext', "generateCode-enabled", generateCodeEnabled);
			} else {
				const enabled = !!vscode.workspace.getConfiguration("chatgpt.promptPrefix").get<boolean>(`${command}-enabled`);
				vscode.commands.executeCommand('setContext', `${command}-enabled`, enabled);
			}
		});
	};

	setContext();
}

export function deactivate() { }
