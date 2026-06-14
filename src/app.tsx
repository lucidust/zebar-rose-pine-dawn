import { useProviderOutput } from './app/use-provider-output';
import { BarShell } from './components/bar/BarShell';
import { GlazeLeftZone } from './features/glazewm/GlazeLeftZone';
import { KomorebiLeftZone } from './features/komorebi/KomorebiLeftZone';
import { SystemStatusZone } from './features/system/SystemStatusZone';
import type { Variant } from './providers';

type AppProps = {
  providers: any;
  variant: Variant;
  includeSystemStatus: boolean;
};

export function App(props: AppProps) {
  const output = useProviderOutput(props.providers);

  function renderLeftZone() {
    if (props.variant === 'with-glazewm') {
      return <GlazeLeftZone glazewm={output.glazewm} />;
    }

    if (props.variant === 'with-komorebi') {
      return <KomorebiLeftZone komorebi={output.komorebi} />;
    }

    return null;
  }

  return (
    <BarShell
      left={renderLeftZone()}
      right={
        <SystemStatusZone
          output={output}
          includeSystemStatus={props.includeSystemStatus}
        />
      }
    />
  );
}
