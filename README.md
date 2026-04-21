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

## Features

- Rose Pine Dawn palette-driven theme
- System tray, media controls, audio, network, keyboard layout, battery, and CPU/memory indicators
- Workspace switching and WM controls in `with-glazewm`
- Responsive top bar layout that collapses lower-priority content on narrower widths
