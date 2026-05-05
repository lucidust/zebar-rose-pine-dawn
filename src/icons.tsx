import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';

type SvgNode = Array<[string, Record<string, string>]>;

// Tabler Icons 3.41.1 path data is vendored locally so chip icons stay legible
// without changing layout size or adding a runtime icon-library dependency.
const APP_WINDOW: SvgNode = [
  ['path', { d: 'M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10' }],
  ['path', { d: 'M6 8h.01' }],
  ['path', { d: 'M9 8h.01' }],
];

const BOX_MULTIPLE: SvgNode = [
  ['path', { d: 'M7 5a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -10' }],
  ['path', { d: 'M17 17v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2' }],
];

const APPS: SvgNode = [
  ['path', { d: 'M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4' }],
  ['path', { d: 'M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4' }],
  ['path', { d: 'M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4' }],
  ['path', { d: 'M14 7l6 0' }],
  ['path', { d: 'M17 4l0 6' }],
];

const ARROWS_DIAGONAL_MINIMIZE_2: SvgNode = [
  ['path', { d: 'M18 10h-4v-4' }],
  ['path', { d: 'M20 4l-6 6' }],
  ['path', { d: 'M6 14h4v4' }],
  ['path', { d: 'M10 14l-6 6' }],
];

const ARROWS_MAXIMIZE: SvgNode = [
  ['path', { d: 'M16 4h4v4' }],
  ['path', { d: 'M14 10l6 -6' }],
  ['path', { d: 'M8 20h-4v-4' }],
  ['path', { d: 'M4 20l6 -6' }],
  ['path', { d: 'M16 20h4v-4' }],
  ['path', { d: 'M14 14l6 6' }],
  ['path', { d: 'M8 4h-4v4' }],
  ['path', { d: 'M4 4l6 6' }],
];

const CALENDAR_CLOCK: SvgNode = [
  ['path', { d: 'M10.5 21h-4.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3' }],
  ['path', { d: 'M16 3v4' }],
  ['path', { d: 'M8 3v4' }],
  ['path', { d: 'M4 11h10' }],
  ['path', { d: 'M14 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' }],
  ['path', { d: 'M18 16.5v1.5l.5 .5' }],
];

const CLOUD: SvgNode = [
  ['path', { d: 'M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878' }],
];

const CLOUD_RAIN: SvgNode = [
  ['path', { d: 'M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7' }],
  ['path', { d: 'M11 13v2m0 3v2m4 -5v2m0 3v2' }],
];

const CLOUD_SNOW: SvgNode = [
  ['path', { d: 'M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7' }],
  ['path', { d: 'M11 15v.01m0 3v.01m0 3v.01m4 -4v.01m0 3v.01' }],
];

const CLOUD_STORM: SvgNode = [
  ['path', { d: 'M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1' }],
  ['path', { d: 'M13 14l-2 4l3 0l-2 4' }],
];

const COLUMNS_2: SvgNode = [
  ['path', { d: 'M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-16' }],
  ['path', { d: 'M12 3v18' }],
];

const COPY_RECTANGLE: SvgNode = [
  ['path', { d: 'M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z' }],
  ['path', { d: 'M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2' }],
];

const DEVICE_DESKTOP_ANALYTICS: SvgNode = [
  ['path', { d: 'M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -10' }],
  ['path', { d: 'M7 20h10' }],
  ['path', { d: 'M9 16v4' }],
  ['path', { d: 'M15 16v4' }],
  ['path', { d: 'M9 12v-4' }],
  ['path', { d: 'M12 12v-1' }],
  ['path', { d: 'M15 12v-2' }],
  ['path', { d: 'M12 12v-1' }],
];

const KEY: SvgNode = [
  ['path', { d: 'M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1 -4.069 0l-.301 -.301l-6.558 6.558a2 2 0 0 1 -1.239 .578l-.175 .008h-1.172a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.172a2 2 0 0 1 .467 -1.284l.119 -.13l.414 -.414h2v-2h2v-2l2.144 -2.144l-.301 -.301a2.877 2.877 0 0 1 0 -4.069l2.643 -2.643a2.877 2.877 0 0 1 4.069 0' }],
  ['path', { d: 'M15 9h.01' }],
];

const LAYOUT_DASHBOARD: SvgNode = [
  ['path', { d: 'M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1' }],
  ['path', { d: 'M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1' }],
  ['path', { d: 'M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1' }],
  ['path', { d: 'M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1' }],
];

const LAYOUT_GRID: SvgNode = [
  ['path', { d: 'M4 4m0 1a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z' }],
  ['path', { d: 'M13 4m0 1a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z' }],
  ['path', { d: 'M4 13m0 1a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z' }],
  ['path', { d: 'M13 13m0 1a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z' }],
];

const LAYOUT_ROWS: SvgNode = [
  ['path', { d: 'M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12' }],
  ['path', { d: 'M4 12l16 0' }],
];

const MINUS_RECTANGLE: SvgNode = [
  ['path', { d: 'M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z' }],
  ['path', { d: 'M9 12h6' }],
];

const MOON: SvgNode = [
  ['path', { d: 'M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008' }],
];

const PLUG_CONNECTED: SvgNode = [
  ['path', { d: 'M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5' }],
  ['path', { d: 'M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5' }],
  ['path', { d: 'M3 21l2.5 -2.5' }],
  ['path', { d: 'M18.5 5.5l2.5 -2.5' }],
  ['path', { d: 'M10 11l-2 2' }],
  ['path', { d: 'M13 14l-2 2' }],
];

const PLAYER_PAUSE: SvgNode = [
  ['path', { d: 'M6 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12' }],
  ['path', { d: 'M14 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12' }],
];

const SHIELD_LOCK: SvgNode = [
  ['path', { d: 'M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3' }],
  ['path', { d: 'M11 11a1 1 0 1 0 2 0a1 1 0 1 0 -2 0' }],
  ['path', { d: 'M12 12l0 2.5' }],
];

const SUN: SvgNode = [
  ['path', { d: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' }],
  ['path', { d: 'M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7' }],
];

const SUN_MOON: SvgNode = [
  ['path', { d: 'M9.173 14.83a4 4 0 1 1 5.657 -5.657' }],
  ['path', { d: 'M11.294 12.707l.174 .247a7.5 7.5 0 0 0 8.845 2.492a9 9 0 0 1 -14.671 2.914' }],
  ['path', { d: 'M3 12h1' }],
  ['path', { d: 'M12 3v1' }],
  ['path', { d: 'M5.6 5.6l.7 .7' }],
  ['path', { d: 'M3 21l18 -18' }],
];

const VOLUME_HIGH: SvgNode = [
  ['path', { d: 'M15 8a5 5 0 0 1 0 8' }],
  ['path', { d: 'M17.7 5a9 9 0 0 1 0 14' }],
  ['path', { d: 'M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5' }],
];

const VOLUME_OFF: SvgNode = [
  ['path', { d: 'M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602a5 5 0 0 1 -.535 .464' }],
  ['path', { d: 'M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299a9 9 0 0 1 -.686 .615' }],
  ['path', { d: 'M9.069 5.054l.431 -.554a.8 .8 0 0 1 1.5 .5v2m0 4v8a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l1.294 -1.664' }],
  ['path', { d: 'M3 3l18 18' }],
];

const WIFI: SvgNode = [
  ['path', { d: 'M12 18l.01 0' }],
  ['path', { d: 'M9.172 15.172a4 4 0 0 1 5.656 0' }],
  ['path', { d: 'M6.343 12.343a8 8 0 0 1 11.314 0' }],
  ['path', { d: 'M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0' }],
];

const WIFI_0: SvgNode = [['path', { d: 'M12 18l.01 0' }]];

const WIFI_1: SvgNode = [
  ['path', { d: 'M12 18l.01 0' }],
  ['path', { d: 'M9.172 15.172a4 4 0 0 1 5.656 0' }],
];

const WIFI_2: SvgNode = [
  ['path', { d: 'M12 18l.01 0' }],
  ['path', { d: 'M9.172 15.172a4 4 0 0 1 5.656 0' }],
  ['path', { d: 'M6.343 12.343a8 8 0 0 1 11.314 0' }],
];

const WIFI_OFF: SvgNode = [
  ['path', { d: 'M12 18l.01 0' }],
  ['path', { d: 'M9.172 15.172a4 4 0 0 1 5.656 0' }],
  ['path', { d: 'M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2' }],
  ['path', { d: 'M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374' }],
  ['path', { d: 'M3 3l18 18' }],
];

function SvgIcon(props: { nodes: SvgNode; class?: string }): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`icon ${props.class ?? ''}`.trim()}
      aria-hidden="true"
    >
      {props.nodes.map(([tag, attrs]) => (
        <Dynamic component={tag as keyof JSX.IntrinsicElements} {...attrs} />
      ))}
    </svg>
  );
}

function renderIcon(nodes: SvgNode, extraClass = ''): JSX.Element {
  return <SvgIcon nodes={nodes} class={extraClass} />;
}

export function icon(name: string, extraClass = ''): JSX.Element {
  switch (name) {
    case 'custom-focus-floating':
      return renderIcon(COPY_RECTANGLE, extraClass);
    case 'custom-focus-fullscreen':
      return renderIcon(ARROWS_MAXIMIZE, extraClass);
    case 'custom-focus-minimized':
      return renderIcon(MINUS_RECTANGLE, extraClass);
    case 'custom-focus-none':
      return renderIcon(APP_WINDOW, extraClass);
    case 'custom-focus-tiling':
      return renderIcon(LAYOUT_GRID, extraClass);
    case 'custom-metrics':
      return renderIcon(DEVICE_DESKTOP_ANALYTICS, extraClass);
    case 'custom-resize-mode':
      return renderIcon(ARROWS_DIAGONAL_MINIMIZE_2, extraClass);
    case 'custom-split-horizontal':
      return renderIcon(COLUMNS_2, extraClass);
    case 'custom-split-vertical':
      return renderIcon(LAYOUT_ROWS, extraClass);
    case 'custom-tray':
      return renderIcon(BOX_MULTIPLE, extraClass);
    case 'nf-md-application_outline':
      return renderIcon(APP_WINDOW, extraClass);
    case 'nf-md-view_dashboard':
      return renderIcon(LAYOUT_DASHBOARD, extraClass);
    case 'nf-md-calendar_clock':
      return renderIcon(CALENDAR_CLOCK, extraClass);
    case 'nf-md-volume_high':
      return renderIcon(VOLUME_HIGH, extraClass);
    case 'nf-md-volume_off':
      return renderIcon(VOLUME_OFF, extraClass);
    case 'nf-md-pause_circle':
      return renderIcon(PLAYER_PAUSE, extraClass);
    case 'nf-md-key_variant':
      return renderIcon(KEY, extraClass);
    case 'nf-md-swap_horizontal':
      return renderIcon(COLUMNS_2, extraClass);
    case 'nf-md-swap_vertical':
      return renderIcon(LAYOUT_ROWS, extraClass);
    case 'nf-md-ethernet_cable':
      return renderIcon(PLUG_CONNECTED, extraClass);
    case 'nf-md-shield_lock_outline':
      return renderIcon(SHIELD_LOCK, extraClass);
    case 'nf-md-wifi_strength_4':
      return renderIcon(WIFI, extraClass);
    case 'nf-md-wifi_strength_3':
      return renderIcon(WIFI_2, extraClass);
    case 'nf-md-wifi_strength_2':
      return renderIcon(WIFI_1, extraClass);
    case 'nf-md-wifi_strength_1':
    case 'nf-md-wifi_strength_outline':
      return renderIcon(WIFI_0, extraClass);
    case 'nf-md-wifi_strength_off_outline':
      return renderIcon(WIFI_OFF, extraClass);
    case 'nf-weather-day_sunny':
      return renderIcon(SUN, extraClass);
    case 'nf-weather-night_clear':
      return renderIcon(MOON, extraClass);
    case 'nf-weather-day_cloudy':
    case 'nf-weather-night_alt_cloudy':
      return renderIcon(CLOUD, extraClass);
    case 'nf-weather-day_sprinkle':
    case 'nf-weather-night_alt_sprinkle':
    case 'nf-weather-day_rain':
    case 'nf-weather-night_alt_rain':
      return renderIcon(CLOUD_RAIN, extraClass);
    case 'nf-weather-day_snow':
    case 'nf-weather-night_alt_snow':
      return renderIcon(CLOUD_SNOW, extraClass);
    case 'nf-weather-day_lightning':
    case 'nf-weather-night_alt_lightning':
      return renderIcon(CLOUD_STORM, extraClass);
    case 'nf-md-weather_partly_cloudy':
      return renderIcon(SUN_MOON, extraClass);
    default:
      return renderIcon(APPS, extraClass);
  }
}

export function networkIcon(network: any) {
  switch (network?.defaultInterface?.type) {
    case 'ethernet':
      return icon('nf-md-ethernet_cable');
    case 'proprietary_virtual':
      return icon('nf-md-shield_lock_outline');
    case 'wifi': {
      const strength = network?.defaultGateway?.signalStrength ?? 0;
      if (strength >= 80) return icon('nf-md-wifi_strength_4');
      if (strength >= 60) return icon('nf-md-wifi_strength_3');
      if (strength >= 40) return icon('nf-md-wifi_strength_2');
      if (strength >= 20) return icon('nf-md-wifi_strength_1');
      return icon('nf-md-wifi_strength_outline');
    }
    default:
      return icon('nf-md-wifi_strength_off_outline');
  }
}

export function weatherIcon(weather: any) {
  switch (weather?.status) {
    case 'clear_day':
      return icon('nf-weather-day_sunny');
    case 'clear_night':
      return icon('nf-weather-night_clear');
    case 'cloudy_day':
      return icon('nf-weather-day_cloudy');
    case 'cloudy_night':
      return icon('nf-weather-night_alt_cloudy');
    case 'light_rain_day':
      return icon('nf-weather-day_sprinkle');
    case 'light_rain_night':
      return icon('nf-weather-night_alt_sprinkle');
    case 'heavy_rain_day':
      return icon('nf-weather-day_rain');
    case 'heavy_rain_night':
      return icon('nf-weather-night_alt_rain');
    case 'snow_day':
      return icon('nf-weather-day_snow');
    case 'snow_night':
      return icon('nf-weather-night_alt_snow');
    case 'thunder_day':
      return icon('nf-weather-day_lightning');
    case 'thunder_night':
      return icon('nf-weather-night_alt_lightning');
    default:
      return icon('nf-md-weather_partly_cloudy');
  }
}
