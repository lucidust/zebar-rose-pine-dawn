import { IconBadge } from './IconBadge';
import type { Tone } from './types';

export function SummaryChip(props: {
  class?: string;
  iconNode: any;
  label: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div class={`chip chip-summary ${props.class ?? ''}`.trim()}>
      <div class="chip-body chip-body-fill">
        <IconBadge node={props.iconNode} tone={props.tone} />
        <div class="stacked">
          <span class="chip-label">{props.label}</span>
          <span class="chip-detail">{props.detail}</span>
        </div>
      </div>
    </div>
  );
}
