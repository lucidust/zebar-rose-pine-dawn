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

## Features

- Rose Pine Dawn palette-driven theme
- System tray, media controls, audio, network, keyboard layout, battery, and CPU/memory indicators
- Workspace switching and WM controls in `with-glazewm`
- Responsive top bar layout that collapses lower-priority content on narrower widths
