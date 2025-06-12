import * as path from 'path';
import * as fs from 'fs';

export function run(): Promise<void> {
    return new Promise((resolve, reject) => {
        const Mocha = require('mocha');
        const mocha = new Mocha({
            ui: 'bdd',
            color: true,
            timeout: 10000
        });

        const testsRoot = path.resolve(__dirname, '..');

        // Recursively find all test files
        function addTestFiles(dir: string) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    addTestFiles(fullPath);
                } else if (file.endsWith('.test.js')) {
                    mocha.addFile(fullPath);
                }
            }
        }

        try {
            addTestFiles(testsRoot);

            // Run the mocha test
            mocha.run((failures: number) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
} 