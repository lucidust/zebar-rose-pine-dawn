import { IconBadge } from './IconBadge';
import type { Tone } from './types';

export function ControlActionButton(props: {
  tone: Tone;
  title: string;
  ariaLabel: string;
  iconNode: any;
  onClick: () => void;
  class?: string;
}) {
  return (
    <button
      class={`chip-action ${props.class ?? ''}`.trim()}
      type="button"
      title={props.title}
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      <IconBadge node={props.iconNode} tone={props.tone} />
    </button>
  );
}

export function ControlActionChip(props: {
  tone: Tone;
  title: string;
  ariaLabel: string;
  iconNode: any;
  onClick: () => void;
  class?: string;
}) {
  return (
    <div class={`chip chip-left-control ${props.class ?? ''}`.trim()}>
      <div class="chip-body chip-left-control-body">
        <ControlActionButton
          tone={props.tone}
          title={props.title}
          ariaLabel={props.ariaLabel}
          iconNode={props.iconNode}
          onClick={props.onClick}
        />
      </div>
    </div>
  );
}

export function StatusIconChip(props: {
  tone: Tone;
  title: string;
  ariaLabel: string;
  iconNode: any;
  class?: string;
}) {
  return (
    <div
      class={`chip chip-left-control ${props.class ?? ''}`.trim()}
      title={props.title}
      aria-label={props.ariaLabel}
      role="status"
    >
      <div class="chip-body chip-left-control-body">
        <IconBadge node={props.iconNode} tone={props.tone} />
      </div>
    </div>
  );
}
