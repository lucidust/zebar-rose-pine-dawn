import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const entriesPath = path.join(rootDir, 'src', 'brand-copy.entries.json');

const raw = await readFile(entriesPath, 'utf8');
const entries = JSON.parse(raw);

const sentenceBudgetPx = 255;
const categoryBudgetPx = 255;
const sentenceFontPx = 10.5;
const categoryFontPx = 9.5;

function estimateWidth(text, fontSize) {
  let units = 0;

  for (const char of text) {
    if (char === ' ') {
      units += 0.34;
      continue;
    }

    if (/[가-힣]/.test(char)) {
      units += 0.98;
      continue;
    }

    if (/[.,'’:&\-()]/.test(char)) {
      units += 0.38;
      continue;
    }

    if (/[0-9]/.test(char)) {
      units += 0.62;
      continue;
    }

    if (/[iljftI]/.test(char)) {
      units += 0.42;
      continue;
    }

    if (/[mwMWQG@%&]/.test(char)) {
      units += 0.9;
      continue;
    }

    if (/[A-Z]/.test(char)) {
      units += 0.7;
      continue;
    }

    units += 0.6;
  }

  return units * fontSize;
}

function collectLongestLines(lines, label) {
  return [...lines]
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 5)
    .map(line => `${label} :: ${line.text.length} chars :: ${line.text}`);
}

const lineSets = [
  {
    name: 'English sentences',
    lines: entries.map(entry => ({ id: entry.id, text: entry.sentence })),
    budget: sentenceBudgetPx,
    fontSize: sentenceFontPx,
  },
  {
    name: 'Korean sentences',
    lines: entries.map(entry => ({ id: entry.id, text: entry.sentenceKo })),
    budget: sentenceBudgetPx,
    fontSize: sentenceFontPx,
  },
  {
    name: 'English categories',
    lines: [...new Map(entries.map(entry => [entry.category, { id: entry.categoryId, text: entry.category }])).values()],
    budget: categoryBudgetPx,
    fontSize: categoryFontPx,
  },
  {
    name: 'Korean categories',
    lines: [...new Map(entries.map(entry => [entry.categoryKo, { id: entry.categoryId, text: entry.categoryKo }])).values()],
    budget: categoryBudgetPx,
    fontSize: categoryFontPx,
  },
];

const overflows = [];

console.log('Brand copy fit check');
console.log(`Sentence budget: ${sentenceBudgetPx}px @ ${sentenceFontPx}px`);
console.log(`Category budget: ${categoryBudgetPx}px @ ${categoryFontPx}px`);

for (const set of lineSets) {
  console.log(set.name);
  for (const line of collectLongestLines(set.lines, set.name)) {
    console.log(`- ${line}`);
  }

  for (const line of set.lines) {
    const width = estimateWidth(line.text, set.fontSize);
    if (width > set.budget) {
      overflows.push({
        set: set.name,
        id: line.id,
        text: line.text,
        width,
      });
    }
  }
}

if (overflows.length) {
  console.error('Overflows detected:');
  for (const entry of overflows) {
    console.error(`- ${entry.set} :: ${entry.id} :: ${entry.width.toFixed(1)}px :: ${entry.text}`);
  }
  process.exit(1);
}

console.log('All English and Korean lines fit within the current brand chip width budget.');
