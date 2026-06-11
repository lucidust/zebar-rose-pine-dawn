import type { JSX } from 'solid-js';

type BarShellProps = {
  left: JSX.Element;
  right: JSX.Element;
};

export function BarShell(props: BarShellProps) {
  return (
    <div class="bar-shell">
      <div class="bar-rail" aria-hidden="true" />
      <div class="bar-grid">
        <div class="zone zone-left cluster-host">{props.left}</div>
        <div class="zone zone-right cluster-host">{props.right}</div>
      </div>
    </div>
  );
}
