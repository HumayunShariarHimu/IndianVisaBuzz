const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public', 'indianvisabuzz-extension.zip');
fs.mkdirSync(path.dirname(output), { recursive: true });
try { fs.unlinkSync(output); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
execFileSync('zip', ['-X', '-r', output, 'extension'], { cwd: root, stdio: 'inherit' });
console.log(`Extension archive created: ${path.relative(root, output)}`);
