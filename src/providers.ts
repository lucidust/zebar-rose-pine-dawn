import * as zebar from 'zebar';

export type Variant = 'vanilla' | 'with-glazewm' | 'with-komorebi';

export function createProviders(variant: Variant) {
  const commonProviders = {
    audio: { type: 'audio' as const },
    media: { type: 'media' as const },
    systray: { type: 'systray' as const },
    network: { type: 'network' as const, refreshInterval: 3_000 },
    keyboard: { type: 'keyboard' as const, refreshInterval: 2_000 },
    battery: { type: 'battery' as const, refreshInterval: 5_000 },
    cpu: { type: 'cpu' as const, refreshInterval: 4_000 },
    memory: { type: 'memory' as const, refreshInterval: 4_000 },
    date: {
      type: 'date' as const,
      formatting: 'ccc, d LLL HH:mm',
      locale: 'en-gb',
      refreshInterval: 1_000,
    },
    weather: { type: 'weather' as const, refreshInterval: 1_800_000 },
  };

  if (variant === 'with-glazewm') {
    return zebar.createProviderGroup({
      ...commonProviders,
      glazewm: { type: 'glazewm' as const },
    });
  }

  if (variant === 'with-komorebi') {
    return zebar.createProviderGroup({
      ...commonProviders,
      komorebi: { type: 'komorebi' as const },
    });
  }

  return zebar.createProviderGroup(commonProviders);
}
