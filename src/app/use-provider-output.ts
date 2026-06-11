import { createStore, reconcile } from 'solid-js/store';

export function useProviderOutput(providers: any) {
  const [output, setOutput] = createStore<Record<string, any>>(
    providers.outputMap as Record<string, any>,
  );

  Object.entries(providers.raw ?? {}).forEach(([providerName, provider]) => {
    const rawProvider = provider as any;

    rawProvider.onOutput((nextOutput: any) => {
      setOutput(providerName, reconcile(nextOutput));
    });

    if (rawProvider.output != null) {
      setOutput(providerName, reconcile(rawProvider.output));
    }
  });

  return output;
}
