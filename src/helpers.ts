import { randomValues } from '@aws-crypto/random-source-browser';
import path from 'path-browserify';
import * as vscode from 'vscode';
const fs = vscode.workspace.fs;

export async function readDirRecursively(dir: string, maxDepth: number, currentDepth: number = 0): Promise<string[]> {
  if (currentDepth > maxDepth) {
    return [];
  }

  const fileList: string[] = [];
  const entryList = await fs.readDirectory(vscode.Uri.file(dir));

  for (const [entryName, entryType] of entryList) {
    const filePath = path.join(dir, entryName);

    if (entryType === vscode.FileType.Directory) {
      fileList.push(entryName, ...await readDirRecursively(filePath, maxDepth, currentDepth + 1));
    } else {
      fileList.push(entryName);
    }
  }

  return fileList;
}

// Get the list of items in the current project directory
export async function listItems(currentProjectDir: string): Promise<string[]> {
  // Ignore .gitignore and .git entries
  const gitignorePath = path.join(currentProjectDir, '.gitignore');
  let gitignoreContents = await readFileIfExists(gitignorePath) ?? '';

  // Also ignore .git
  gitignoreContents += '\n.git';
  const gitignoreEntries = gitignoreContents.split('\n').map(line => line.trim()).filter(line => line.length > 0).filter(line => !line.startsWith('#'));

  // Read up to 50 items and up to 3 levels deep of the current project directory
  const items = await readDirRecursively(currentProjectDir, 2); // "2" for up to 3 levels (0, 1, 2)
  const filteredItems = items
    .filter(item => !gitignoreEntries.some(gitignoreEntry => item.includes(gitignoreEntry)))
    .slice(0, 50);

  return filteredItems;
}

const deprecatedModelMap = new Map<string, string>([
  // Legacy - gpt-4-turbo is no longer in preview, use the latest model alias
  ['gpt-4-1106-preview', 'gpt-4-turbo'],
  // Legacy - All gpt-3.5-turbo models are now 16k
  ['gpt-3.5-turbo-16k', 'gpt-3.5-turbo'],
  // With gpt-4o and gpt-4-turbo, this model is of limited use
  ['gpt-4-32k', 'gpt-4'],
]);

export function getUpdatedModel(modelId: string): string {
  // Replace deprecated model with the newer equivalent
  return deprecatedModelMap.get(modelId) || modelId;
}

export function getSelectedModelId(): string {
  // Fetch the current model and update if it's deprecated
  const currentModelId = vscode.workspace.getConfiguration("chatgpt").get("gpt3.model", 'gpt-4-turbo');
  const updatedModelId = getUpdatedModel(currentModelId);

  if (currentModelId !== updatedModelId) {
    vscode.workspace.getConfiguration("chatgpt").update("gpt3.model", updatedModelId, vscode.ConfigurationTarget.Global);

    console.debug(`[Reborn AI] Updated deprecated model "${currentModelId}" to "${updatedModelId}".`);
  }

  return updatedModelId;
}

// Not using the official UUID package because it uses crypto, which is not available in the browser
export async function uuidv4(): Promise<string> {
  const randomBytes = await randomValues(16);
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;  // Version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;  // Variant 10

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c, p) {
    const r = randomBytes[p] % 16;
    return ((c === 'x') ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// File system helpers
export async function fileExists(filePath: string): Promise<vscode.Uri | null> {

  try {
    const uri = vscode.Uri.file(filePath);

    await fs.stat(uri);

    return uri;
  } catch (err: any) {
    return null;
  }
}

export async function readFileIfExists(filePath: string): Promise<string | null> {
  const uri = await fileExists(filePath);

  if (uri) {
    return (await fs.readFile(uri)).toString();
  }

  return null;
}

export function throttle(func: Function, timeFrame: number) {
  var lastTime = 0;

  return function (...args: any[]) {
    var now: number = new Date().getTime();

    if (now - lastTime >= timeFrame) {
      func(...args);
      lastTime = now;
    }
  };
}

// VS Code API has not write stream
// We make our own, and add throttling to it for performance
export class WriteStream {
  private data: string = '';
  private uri: vscode.Uri;

  constructor(filePath: string) {
    this.uri = vscode.Uri.file(filePath);
  }

  write(data: string): void {
    this.data += data;

    // Throttle the write operation
    throttle(this.writeFile, 1000);
  }

  private writeFile(): void {
    fs.writeFile(this.uri, Buffer.from(this.data));
  }

  end(): void {
    this.writeFile();
  }
}

