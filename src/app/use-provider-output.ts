import { createStore, reconcile } from 'solid-js/store';

export type ProviderRestartState = {
  count: number;
  isRestarting: boolean;
  lastError: string | null;
  lastRestartedAt: number | null;
};

export function useProviderOutput(providers: any) {
  const [output, setOutput] = createStore<Record<string, any>>(
    providers.outputMap as Record<string, any>,
  );
  const [providerEmissionCounts, setProviderEmissionCounts] = createStore<
    Record<string, number>
  >({});
  const [providerRestartStates, setProviderRestartStates] = createStore<
    Record<string, ProviderRestartState>
  >({});

  Object.entries(providers.raw ?? {}).forEach(([providerName, provider]) => {
    const rawProvider = provider as any;

    rawProvider.onOutput((nextOutput: any) => {
      setProviderEmissionCounts(
        providerName,
        count => (count ?? 0) + 1,
      );
      setOutput(providerName, reconcile(nextOutput));
    });

    if (rawProvider.output != null) {
      setOutput(providerName, reconcile(rawProvider.output));
    }
  });

  const patchProviderRestartState = (
    providerName: string,
    patch: Partial<ProviderRestartState>,
  ) => {
    setProviderRestartStates(providerName, state => ({
      count: state?.count ?? 0,
      isRestarting: state?.isRestarting ?? false,
      lastError: state?.lastError ?? null,
      lastRestartedAt: state?.lastRestartedAt ?? null,
      ...patch,
    }));
  };

  const restartProvider = async (providerName: string) => {
    const rawProvider = providers.raw?.[providerName] as any;

    if (typeof rawProvider?.restart !== 'function') {
      patchProviderRestartState(providerName, {
        lastError: 'provider restart unavailable',
      });
      return false;
    }

    patchProviderRestartState(providerName, {
      isRestarting: true,
      lastError: null,
    });

    try {
      await rawProvider.restart();
      patchProviderRestartState(providerName, {
        count: (providerRestartStates[providerName]?.count ?? 0) + 1,
        isRestarting: false,
        lastError: null,
        lastRestartedAt: Date.now(),
      });
      return true;
    } catch (error) {
      patchProviderRestartState(providerName, {
        isRestarting: false,
        lastError: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  };

  return {
    output,
    providerEmissionCounts,
    providerRestartStates,
    restartProvider,
  };
}
