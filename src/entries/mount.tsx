import { render } from 'solid-js/web';
import { App } from '../app';
import { shouldShowLiveSystemStats } from '../monitor';
import { createProviders, type Variant } from '../providers';
import '../styles.css';

export async function mountVariant(variant: Variant) {
  const includeLiveSystemStats = await shouldShowLiveSystemStats();
  const providers = createProviders(variant, { includeLiveSystemStats });

  render(
    () => (
      <App
        providers={providers}
        variant={variant}
        includeLiveSystemStats={includeLiveSystemStats}
      />
    ),
    document.getElementById('root')!,
  );
}
