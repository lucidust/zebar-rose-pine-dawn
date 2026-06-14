import { render } from 'solid-js/web';
import { App } from '../app';
import { shouldShowSystemStatus } from '../monitor';
import { createProviders, type Variant } from '../providers';
import '../styles.css';

export async function mountVariant(variant: Variant) {
  const includeSystemStatus = await shouldShowSystemStatus();
  const providers = createProviders(variant, { includeSystemStatus });

  render(
    () => (
      <App
        providers={providers}
        variant={variant}
        includeSystemStatus={includeSystemStatus}
      />
    ),
    document.getElementById('root')!,
  );
}
