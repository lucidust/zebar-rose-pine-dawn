# zebar-rose-pine-dawn

Rose Pine Dawn top bar pack for Zebar.

## Standards

- The canonical interpretation entry points for this repository are `repo-metadata.yaml` and `.agent/standards-baseline.md`.
- Workspace standards are not automation or sync helpers; they define how this repository should be read and interpreted.
- The canonical runtime and pack contract artifact is `zpack.json`.

## Language Policy

- The repository default language is English.
- Korean documentation is provided as companion material, starting with [README.ko.md](./README.ko.md).
- Runtime UI strings, labels, and shipped widget text should default to English unless a task explicitly introduces localization.

## Variants

- `vanilla`: shared system status bar without WM-specific controls
- `with-glazewm`: GlazeWM workspaces and WM status controls
- `with-komorebi`: Komorebi workspace-aware status bar

## Development

```bash
pnpm install
pnpm typecheck
pnpm validate:pack
pnpm build
```

After building, Zebar loads the generated `dist/` assets from this directory through `zpack.json`.

## Design References

- Official Rosé Pine palette overview: [rosepinetheme.com/palette](https://rosepinetheme.com/palette/)
- Official Rosé Pine ingredient table with canonical hex values, including Dawn: [rosepinetheme.com/palette/ingredients](https://rosepinetheme.com/palette/ingredients/)
- Zebar runtime and provider documentation: [github.com/glzr-io/zebar](https://github.com/glzr-io/zebar)
- Legacy visual reference used for this pack refresh: [github.com/adriankarlen/rose-pine.zebar](https://github.com/adriankarlen/rose-pine.zebar)

Use the Rosé Pine Dawn values from the official palette references above as the color source of truth for this repository.

## Customization

- Font stacks are configured in [src/styles.css](./src/styles.css) through the `--font-sans` and `--font-mono` root variables.
- Shipped icons are local inline SVGs in [src/icons.tsx](./src/icons.tsx), so the pack does not depend on remote icon fonts for runtime rendering.
- Candidate brand copy for the left chip is stored in [docs/brand-copy.md](./docs/brand-copy.md), with a Korean companion in [docs/brand-copy.ko.md](./docs/brand-copy.ko.md).
- Runtime brand-copy data and rotation rules live in [src/brand-copy.entries.json](./src/brand-copy.entries.json) and [src/brand-copy.ts](./src/brand-copy.ts).
- To verify that all candidate lines still fit in the current brand-chip width budget, run `pnpm check:brand-copy`.

## Recommended Setup

This pack is currently tuned around a horizontal 4K primary monitor.

- Tested target: one horizontal 4K primary monitor
- Secondary monitor status: a portrait 4K secondary monitor exists in the current workstation, but the shipped spacing and placement are not tuned for it yet
- Current widget scope: the default `zpack.json` preset targets the primary monitor only

### GlazeWM gaps

Use the following GlazeWM gap values as the current recommended set for this pack:

```yaml
gaps:
  scale_with_dpi: true
  inner_gap: '8px'
  outer_gap:
    top: '50px'
    right: '8px'
    bottom: '8px'
    left: '8px'
```

### Zebar spacing

Keep the Zebar side aligned with the following values when matching the GlazeWM profile above:

- `zpack.json`: `offsetY: 0px`, `height: 50px`, primary monitor preset only
- `src/styles.css`: `--shell-padding-x: 8px`
- `src/styles.css`: `--pill-height: 36px`
- `src/styles.css`: `--right-cluster-item-height: 30px`
- `src/styles.css`: `--pill-radius: 14px`
- `src/styles.css`: `--cluster-inner-radius: 9px`

These values intentionally keep the bar docked to the top edge while leaving the visible breathing room between the bar and tiled windows to GlazeWM's `outer_gap.top`.

## Layout Guidelines

- Keep the shipped variants aligned to the same zone order: left for brand, workspace-aware context, and WM controls when available; center for media; right for shared system widgets ending with weather and date/time.
- Restrict variant-specific differences to workspace-aware content and WM controls; do not reorder shared system widgets per variant without updating all shipped variants together.
- Treat `vanilla`, `with-glazewm`, and `with-komorebi` as one layout family for future maintenance.

## Right Cluster Rules

- Keep right-side widgets implemented as feature-specific chips for maintenance, even when they are presented as one visual cluster.
- Use one outer pill for the right-side system cluster to reduce visual noise.
- Prefer background-backed sub-chips for interactive controls such as tray, audio, and clickable metrics.
- Prefer separators or spacing for text-heavy informational chips such as network, weather, and date/time.
- Use both backgrounds and separators only when they serve different roles, and keep both subtle.
- Treat these as guidelines rather than fixed rules; adjust per widget density and interaction cost.

## Features

- Rose Pine Dawn palette-driven theme
- System tray overflow popover, centered media controls, audio, network traffic, weather, and a combined CPU/memory indicator
- Workspace switching and WM controls in `with-glazewm`
- Responsive top bar layout that collapses lower-priority content on narrower widths
