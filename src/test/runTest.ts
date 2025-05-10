import { runTests } from '@vscode/test-electron';
import * as path from 'path';

async function main() {
  try {
    // Set up paths
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Run the tests
    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
