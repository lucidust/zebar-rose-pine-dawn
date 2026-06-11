import type { Tone } from './types';

export function IconBadge(props: { node: any; tone: Tone; class?: string }) {
  return (
    <span class={`icon-badge tone-${props.tone} ${props.class ?? ''}`.trim()}>
      {props.node}
    </span>
  );
}
