# zebar-rose-pine-dawn

Rosé Pine Dawn top bar pack for [Zebar](https://github.com/glzr-io/zebar).

[한국어](./README.ko.md)

![zebar-rose-pine-dawn preview](./resources/preview-image-1.png)

## Features

- Top bar themed with the official [Rosé Pine Dawn palette](https://rosepinetheme.com/palette/).
- Full-width rail with modular workspace and system chips.
- System tray overflow popover, audio, network traffic, weather, date/time, and combined CPU/memory status.
- Optional Windows Night Light control through [`wnlctl`](https://github.com/lucidust/wnlctl).
- Local SVG icons bundled with the pack; no remote icon font dependency at runtime.

## Chips

Shared chips:

- CPU/memory and network traffic.
- System tray overflow.
- Volume.
- Windows Night Light, when `wnlctl.exe` is installed.
- Weather.
- Date and time.

GlazeWM integration:

- Workspace buttons.
- Focused workspace and window context.
- Binding mode, pause state, and tiling direction controls.

On non-primary monitors, live system stats are hidden to keep secondary bars lighter. This currently affects CPU/memory and network traffic.

## Variants

This pack ships three widget variants:

- `vanilla`: shared system status bar without WM-specific controls.
- `with-glazewm`: GlazeWM workspaces and WM status controls.
- `with-komorebi`: builds successfully, but needs tester feedback before it is treated as fully verified.

`vanilla` and `with-glazewm` are the currently supported variants.

## Install

### Marketplace

Install the pack from the Zebar marketplace and choose one of the shipped variants.

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

The Night Light chip requires `wnlctl.exe`. If `wnlctl` is not available on `PATH`, the Night Light control is hidden and the rest of the bar continues to run.

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

`wnlctl` is maintained separately at [lucidust/wnlctl](https://github.com/lucidust/wnlctl). That repository owns Windows registry access, release binaries, and helper-specific limitations.

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

- Runtime UI strings and default widget labels are English.
- This pack is primarily tuned on a horizontal 4K monitor.

## License

MIT
