import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configSchemas } from 'zebar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const zpackPath = path.join(rootDir, 'zpack.json');

const raw = await readFile(zpackPath, 'utf8');
const parsed = JSON.parse(raw);
configSchemas.widgetPack.parse(parsed);

console.log('zpack.json is valid');
