// Convenience functions for the renderer code

export const getVSCodeAPI = () => {
    let vscode;

    try {
        // Try to acquire VS Code API for the first time
        vscode = acquireVsCodeApi();
    } catch (error) {
        // If an instance of the VS Code API has already been acquired,
        // use the existing VS Code API
        vscode = (window as any)?.vscode;
    }

    return vscode;
};

export const postMessage = (type: string, value: any = "", language: string = "") => {
    const message = {
        type,
    } as { type: string; value?: any; language?: any; };

    if (value) {
        message.value = value;

        if (language) {
            message.language = language;
        }
    }

    getVSCodeAPI().postMessage(message);
};