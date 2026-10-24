import fs from 'node:fs';
import path from 'node:path';

if (!process.env.VERCEL) {
  process.exit(0);
}

const sourceDirectory = path.resolve('.next');
const destinationDirectory = path.resolve('path0', '.next');

if (!fs.existsSync(sourceDirectory)) {
  process.exit(0);
}

fs.rmSync(destinationDirectory, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destinationDirectory), { recursive: true });
fs.cpSync(sourceDirectory, destinationDirectory, { recursive: true });