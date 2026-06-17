# zebar-rose-pine-dawn

Rosé Pine Dawn top bar pack for [Zebar](https://github.com/glzr-io/zebar).

[한국어](./README.ko.md)

## Previews

GlazeWM:

![zebar-rose-pine-dawn GlazeWM preview](./resources/preview-image-1.png)

Komorebi:

![zebar-rose-pine-dawn Komorebi preview](./resources/preview-image-2.png)

## Features

- Top bar themed with the official [Rosé Pine Dawn palette](https://rosepinetheme.com/palette/).
- Full-width rail with modular workspace and system status chips.
- System tray display modes, audio, network traffic, weather, date/time, and combined CPU/memory status.
- Optional Windows Night Light control through [`wnlctl`](https://github.com/lucidust/wnlctl).
- Bundled local SVG icons; no remote icon font dependency at runtime.

## Chips

Shared chips:

- CPU/memory and network traffic.
- System tray chip with folded, pinned, and all-icons display modes.
- Volume.
- Windows Night Light, when `wnlctl.exe` is installed.
- Weather.
- Date and time.

GlazeWM:

- Workspace buttons.
- Focused workspace and window context.
- Binding mode, pause state, and tiling direction controls.

Komorebi:

- Workspace buttons.
- Focused workspace, container, stack, and window context.
- Layout, pause, tiling, stack, floating, maximized, and monocle focus status.

On non-primary monitors, the right-side system status group is hidden to keep secondary bars compact.

### System Tray

The system tray chip keeps tray icons inline with the bar. Click the tray chip to cycle through three display modes:

- `Folded`: hide tray icons and show the number of hidden icons.
- `Pinned`: show only pinned tray icons and show the number of remaining hidden icons.
- `All`: show every tray icon in a horizontally scrollable strip.

Ctrl+click the tray chip to enter manage mode. In manage mode, click tray icons to pin or unpin them. Missing pinned icons are counted in the chip, and clicking the missing indicator removes pinned entries that are not currently visible from Zebar's systray provider. Pinned icons are stored locally and entries that stay missing for more than 14 days are removed automatically.

## Variants

This pack ships three widget variants:

- `vanilla`: shared system status bar without WM-specific controls.
- `with-glazewm`: GlazeWM workspaces and WM status controls.
- `with-komorebi`: Komorebi workspaces, layout status, and focused container/window context.

## Install

### Marketplace

Install the pack from the Zebar marketplace, then choose one of the shipped variants.

### Custom Widget

For development or local customization, clone this repository under your Zebar config directory and point Zebar at the local pack:

```powershell
git clone https://github.com/lucidust/zebar-rose-pine-dawn.git "$env:USERPROFILE\.glzr\zebar\zebar-rose-pine-dawn"
cd "$env:USERPROFILE\.glzr\zebar\zebar-rose-pine-dawn"
pnpm install
pnpm build
```

Zebar loads the generated `dist/` assets through `zpack.json`.

## Optional Night Light Helper

The Night Light chip requires `wnlctl.exe`. If `wnlctl` is not available on `PATH`, only the Night Light control is hidden.

Install with Scoop:

```powershell
scoop bucket add lucidust https://github.com/lucidust/scoop-bucket
scoop install wnlctl
```

The pack uses only these helper commands:

```powershell
wnlctl status --json
wnlctl toggle --json
```

For helper details and releases, see [lucidust/wnlctl](https://github.com/lucidust/wnlctl).

## Recommended GlazeWM Setup

This pack is tuned around a 50px top bar region. A matching GlazeWM gap configuration is:

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

## Recommended Komorebi Setup

Use the `with-komorebi` variant when Komorebi is running and `komorebic.exe` is available to Zebar. Workspace UI state comes from Zebar's Komorebi provider. The bar also uses `komorebic.exe state` for focus details across tiling, stack, floating, maximized, and monocle workspaces.

If provider updates appear to stall, the bar can restart its Komorebi provider subscription to recover the displayed state.

The pack allows only these Komorebi helper commands:

```powershell
komorebic state
komorebic focus-monitor-workspace <monitor-index> <workspace-index>
```

The bar is tuned around the same 50px top region as the GlazeWM variant. Configure Komorebi work area or application gaps separately if windows should avoid the bar.

### Komorebi Debug Chip

The `with-komorebi` variant has a build-time debug chip for local troubleshooting. Enable it with `VITE_KOMOREBI_DEBUG=1` before running `pnpm build`. Normal builds hide the chip.

## Development

```powershell
pnpm install
pnpm validate:pack
pnpm typecheck
pnpm build
```

Useful files:

- `zpack.json`: canonical Zebar pack contract.
- `src/providers.ts`: provider wiring for each variant.
- `src/entries/*`: Vite entrypoints for shipped variants.
- `src/styles.css`: layout, spacing, and theme tokens.

## Notes

- Runtime UI strings and default widget labels are in English.
- This pack is primarily tuned for a horizontal 4K monitor.

## License

MIT
