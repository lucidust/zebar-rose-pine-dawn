import * as zebar from 'zebar';

export type Variant = 'vanilla' | 'with-glazewm' | 'with-komorebi';

type CreateProviderOptions = {
  includeLiveSystemStats?: boolean;
};

export function createProviders(
  variant: Variant,
  options: CreateProviderOptions = {},
) {
  const includeLiveSystemStats = options.includeLiveSystemStats ?? true;
  const commonProviders = {
    audio: { type: 'audio' as const },
    systray: { type: 'systray' as const },
    date: {
      type: 'date' as const,
      formatting: 'LLL dd ccc HH:mm',
      locale: 'en-us',
      refreshInterval: 1_000,
    },
    weather: { type: 'weather' as const, refreshInterval: 1_800_000 },
    ...(includeLiveSystemStats
      ? {
          network: { type: 'network' as const, refreshInterval: 4_000 },
          cpu: { type: 'cpu' as const, refreshInterval: 4_000 },
          memory: { type: 'memory' as const, refreshInterval: 4_000 },
        }
      : {}),
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
