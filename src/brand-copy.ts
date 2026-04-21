import brandCopyEntries from './brand-copy.entries.json';
import type { Variant } from './providers';

export type BrandCopyLanguage = 'en' | 'ko';
export type BrandCopyMode = 'daily-random' | 'fixed';
export type BrandCopyBottomLineMode =
  | 'category'
  | 'variant'
  | 'category-and-variant';

export type BrandCopyEntry = {
  id: string;
  sentence: string;
  sentenceKo: string;
  categoryId: string;
  category: string;
  categoryKo: string;
};

export type BrandCopySelection = {
  entry: BrandCopyEntry;
  sentence: string;
  detail: string;
};

export type BrandCopyConfig = {
  language: BrandCopyLanguage;
  mode: BrandCopyMode;
  rotationDays: number;
  seedOffset: number;
  fixedEntryId: string;
  allowedCategories: string[];
  bottomLineMode: BrandCopyBottomLineMode;
};

export const brandCopyConfig: BrandCopyConfig = {
  language: 'ko',
  mode: 'daily-random',
  rotationDays: 1,
  seedOffset: 0,
  fixedEntryId: 'ten-years-a-lifes-change',
  allowedCategories: [],
  bottomLineMode: 'category',
};

const variantLabels: Record<BrandCopyLanguage, Record<Variant, string>> = {
  en: {
    vanilla: 'Vanilla',
    'with-glazewm': 'GlazeWM',
    'with-komorebi': 'Komorebi',
  },
  ko: {
    vanilla: '기본',
    'with-glazewm': 'GlazeWM',
    'with-komorebi': 'Komorebi',
  },
};

export const allBrandCopyEntries = brandCopyEntries as BrandCopyEntry[];

export function resolveBrandCopy(
  variant: Variant,
  now: Date,
  config: BrandCopyConfig = brandCopyConfig,
): BrandCopySelection {
  const pool = getAllowedEntries(config);
  const fallback = allBrandCopyEntries[0];

  const entry =
    config.mode === 'fixed'
      ? pool.find(candidate => candidate.id === config.fixedEntryId) ?? fallback
      : pickDailyEntry(pool, now, config);

  return {
    entry,
    sentence: renderSentence(entry, config.language),
    detail: renderBottomLine(entry, variant, config),
  };
}

function getAllowedEntries(config: BrandCopyConfig) {
  if (!config.allowedCategories.length) {
    return allBrandCopyEntries;
  }

  const allowed = new Set(config.allowedCategories);
  const filtered = allBrandCopyEntries.filter(entry =>
    allowed.has(entry.categoryId),
  );

  return filtered.length ? filtered : allBrandCopyEntries;
}

function pickDailyEntry(
  entries: BrandCopyEntry[],
  now: Date,
  config: BrandCopyConfig,
) {
  if (entries.length <= 1) {
    return entries[0];
  }

  const categoryIds = [...new Set(entries.map(entry => entry.categoryId))];
  const categorySeed = dailySeed(now, config);
  const categoryIndex = mixSeed(categorySeed) % categoryIds.length;
  const chosenCategoryId = categoryIds[categoryIndex];
  const categoryEntries = entries.filter(
    entry => entry.categoryId === chosenCategoryId,
  );
  const entrySeed = dailySeed(now, config) + categoryIndex * 9_973;
  const entryIndex = mixSeed(entrySeed) % categoryEntries.length;

  return categoryEntries[entryIndex];
}

function dailySeed(now: Date, config: BrandCopyConfig) {
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const dayNumber = Math.floor(localMidnight.getTime() / 86_400_000);
  const bucket = Math.floor(dayNumber / Math.max(1, config.rotationDays));

  return bucket + config.seedOffset * 1_048_573;
}

function mixSeed(value: number) {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;

  return Math.abs(hash);
}

function renderSentence(entry: BrandCopyEntry, language: BrandCopyLanguage) {
  return language === 'ko' ? entry.sentenceKo : entry.sentence;
}

function renderCategory(entry: BrandCopyEntry, language: BrandCopyLanguage) {
  return language === 'ko' ? entry.categoryKo : entry.category;
}

function renderBottomLine(
  entry: BrandCopyEntry,
  variant: Variant,
  config: BrandCopyConfig,
) {
  const categoryLabel = renderCategory(entry, config.language);
  const variantLabel = variantLabels[config.language][variant];

  if (config.bottomLineMode === 'variant') {
    return variantLabel;
  }

  if (config.bottomLineMode === 'category-and-variant') {
    return `${categoryLabel} · ${variantLabel}`;
  }

  return categoryLabel;
}
