import fs from "fs";
import upath from 'upath';

export function readDirRecursively(dir: string, maxDepth: number, currentDepth: number = 0): string[] {
  if (currentDepth > maxDepth) {
    return [];
  }

  const items: string[] = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const entryPath = upath.join(dir, entry);
    const entryStat = fs.statSync(entryPath);

    if (entryStat.isDirectory()) {
      items.push(entryPath, ...readDirRecursively(entryPath, maxDepth, currentDepth + 1));
    } else {
      items.push(entryPath);
    }
  }

  return items;
}

// Get the list of items in the current project directory
export function listItems(currentProjectDir: string): string[] {
  // Ignore .gitignore and .git entries
  const gitignorePath = upath.join(currentProjectDir, '.gitignore');
  let gitignoreContents = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
  // Also ignore .git
  gitignoreContents += '\n.git';
  const gitignoreEntries = gitignoreContents.split('\n').map(line => line.trim()).filter(line => line.length > 0).filter(line => !line.startsWith('#'));

  // Read up to 50 items and up to 3 levels deep of the current project directory
  const items = readDirRecursively(currentProjectDir, 2); // "2" for up to 3 levels (0, 1, 2)
  const filteredItems = items
    .filter(item => !gitignoreEntries.some(gitignoreEntry => item.includes(gitignoreEntry)))
    .slice(0, 50);

  return filteredItems;
}