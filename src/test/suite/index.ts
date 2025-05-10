import { glob } from 'glob';
import Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true });
  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    try {
      const files = glob.sync('**/*.test.js', { cwd: testsRoot });
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    } catch (err) {
      reject(err);
    }
  });
}

