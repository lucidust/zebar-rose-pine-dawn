import type { JSX } from 'solid-js';

type SvgIconProps = {
  children: JSX.Element;
  class?: string;
  viewBox?: string;
};

function SvgIcon(props: SvgIconProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={props.viewBox ?? '0 0 24 24'}
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`icon ${props.class ?? ''}`.trim()}
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}

function CloudShape() {
  return <path d="M7 18h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1.2A3.8 3.8 0 0 0 7 18Z" />;
}

function SunShape() {
  return (
    <>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.25" />
      <path d="M12 18.25v2.25" />
      <path d="M3.5 12h2.25" />
      <path d="M18.25 12h2.25" />
      <path d="m5.9 5.9 1.6 1.6" />
      <path d="m16.5 16.5 1.6 1.6" />
      <path d="m18.1 5.9-1.6 1.6" />
      <path d="m7.5 16.5-1.6 1.6" />
    </>
  );
}

function MoonShape() {
  return <path d="M15.8 4.8a7.5 7.5 0 1 0 3.4 11.3 7 7 0 0 1-3.4-11.3Z" />;
}

function RainShape() {
  return (
    <>
      <path d="m9 18.75-.8 1.5" />
      <path d="m13 18.75-.8 1.5" />
      <path d="m17 18.75-.8 1.5" />
    </>
  );
}

function SnowShape() {
  return (
    <>
      <path d="m9 18.25 0 3" />
      <path d="m7.7 19.1 2.6 1.3" />
      <path d="m7.7 20.4 2.6-1.3" />
      <path d="m15 18.25 0 3" />
      <path d="m13.7 19.1 2.6 1.3" />
      <path d="m13.7 20.4 2.6-1.3" />
    </>
  );
}

function LightningShape() {
  return <path d="m13 13-2 4.5h2.5L11 22l6-7h-2.6l1.4-5Z" />;
}

function WifiShape(props: { level: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <>
      <path d="M4.5 9.75a11 11 0 0 1 15 0" opacity={props.level >= 1 ? 1 : 0.3} />
      <path d="M7.4 12.7a7 7 0 0 1 9.2 0" opacity={props.level >= 2 ? 1 : 0.3} />
      <path d="M10.25 15.65a3 3 0 0 1 3.5 0" opacity={props.level >= 3 ? 1 : 0.3} />
      <circle cx="12" cy="18.4" r="1.2" fill="currentColor" stroke="none" opacity={props.level >= 4 ? 1 : 0.3} />
    </>
  );
}

function iconNode(name: string): JSX.Element {
  switch (name) {
    case 'custom-tulip':
      return (
        <>
          <path
            d="M12 5c1.24 0 2.18.94 2.18 2.18 0 .33-.06.62-.16.91.95.14 1.8.59 2.42 1.28.75.82 1.17 1.93 1.17 3.11 0 1.83-.99 3.47-2.55 4.39-.55 1.22-1.47 2.21-2.81 3.04-1.34-.83-2.26-1.82-2.81-3.04-1.56-.92-2.55-2.56-2.55-4.39 0-1.18.42-2.29 1.17-3.11.62-.69 1.47-1.14 2.42-1.28a2.8 2.8 0 0 1-.16-.91C9.82 5.94 10.76 5 12 5Z"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M12 9.1c-.86 0-1.66.27-2.3.78-.84.67-1.34 1.7-1.34 2.83 0 1.14.5 2.17 1.34 2.85.64.51 1.44.78 2.3.78s1.66-.27 2.3-.78c.84-.68 1.34-1.71 1.34-2.85 0-1.13-.5-2.16-1.34-2.83A3.67 3.67 0 0 0 12 9.1Z"
            fill="var(--surface)"
            stroke="none"
            opacity="0.34"
          />
          <path
            d="M11.2 15.55c-.72.95-1.64 1.88-2.8 2.77.39.73 1.02 1.08 1.93 1.08.73 0 1.39-.15 1.97-.46.58.31 1.24.46 1.97.46.91 0 1.54-.35 1.93-1.08-1.16-.89-2.08-1.82-2.8-2.77h-2.2Z"
            fill="currentColor"
            stroke="none"
          />
        </>
      );
    case 'custom-memory':
      return (
        <>
          <rect x="4.5" y="8" width="15" height="8" rx="2.5" />
          <path d="M8 11v2" />
          <path d="M11 11v2" />
          <path d="M14 11v2" />
          <path d="M17 11v2" />
          <path d="M7 16v2" />
          <path d="M10 16v2" />
          <path d="M13 16v2" />
          <path d="M16 16v2" />
          <path d="M7 6v2" />
          <path d="M10 6v2" />
          <path d="M13 6v2" />
          <path d="M16 6v2" />
        </>
      );
    case 'custom-resize-mode':
      return (
        <>
          <path d="M8 4.5H4.5V8" />
          <path d="m4.5 4.5 5 5" />
          <path d="M16 4.5h3.5V8" />
          <path d="m19.5 4.5-5 5" />
          <path d="M8 19.5H4.5V16" />
          <path d="m4.5 19.5 5-5" />
          <path d="M16 19.5h3.5V16" />
          <path d="m19.5 19.5-5-5" />
        </>
      );
    case 'custom-split-horizontal':
      return (
        <>
          <rect x="4.5" y="6" width="15" height="12" rx="2.5" />
          <path d="M12 6v12" />
        </>
      );
    case 'custom-split-vertical':
      return (
        <>
          <rect x="4.5" y="6" width="15" height="12" rx="2.5" />
          <path d="M4.5 12h15" />
        </>
      );
    case 'custom-tray':
      return (
        <>
          <path d="M5 7.5h14" />
          <path d="M6.5 7.5v7.25a2.25 2.25 0 0 0 2.25 2.25h6.5a2.25 2.25 0 0 0 2.25-2.25V7.5" />
          <rect x="8.25" y="10" width="2.5" height="2.5" rx="0.8" />
          <rect x="13.25" y="10" width="2.5" height="2.5" rx="0.8" />
          <path d="M9 17.25v1.75" />
          <path d="M15 17.25v1.75" />
        </>
      );
    case 'nf-md-application_outline':
      return (
        <>
          <rect x="4.5" y="5" width="15" height="14" rx="2.5" />
          <path d="M4.5 9h15" />
          <path d="M8 7.1h.01" />
          <path d="M11 7.1h.01" />
        </>
      );
    case 'nf-md-view_dashboard':
      return (
        <>
          <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13" y="4.5" width="6.5" height="9" rx="1.5" />
          <rect x="4.5" y="13" width="9" height="6.5" rx="1.5" />
          <rect x="15.5" y="16" width="4" height="3.5" rx="1.25" />
        </>
      );
    case 'nf-md-calendar_clock':
      return (
        <>
          <rect x="4.5" y="5.5" width="11" height="13" rx="2.5" />
          <path d="M8 3.75v3.5" />
          <path d="M12 3.75v3.5" />
          <path d="M4.5 9h11" />
          <circle cx="18" cy="15.5" r="3.5" />
          <path d="M18 13.8v1.9l1.35.95" />
        </>
      );
    case 'nf-md-music_note':
      return (
        <>
          <path d="M14.5 5.5v9.5" />
          <path d="m14.5 6 4-1v8.5" />
          <circle cx="10" cy="17" r="2.5" />
          <circle cx="18.5" cy="15.5" r="2" />
        </>
      );
    case 'nf-md-skip_previous':
      return (
        <>
          <path d="M7 6v12" />
          <path d="m18 7-7 5 7 5V7Z" />
        </>
      );
    case 'nf-md-pause':
      return (
        <>
          <rect x="7.5" y="6.5" width="3" height="11" rx="1.25" />
          <rect x="13.5" y="6.5" width="3" height="11" rx="1.25" />
        </>
      );
    case 'nf-md-play':
      return <path d="m9 7 8 5-8 5V7Z" />;
    case 'nf-md-skip_next':
      return (
        <>
          <path d="M17 6v12" />
          <path d="m6 7 7 5-7 5V7Z" />
        </>
      );
    case 'nf-md-volume_high':
      return (
        <>
          <path d="M5 10h3l4-4v12l-4-4H5Z" />
          <path d="M16 9.25a4.5 4.5 0 0 1 0 5.5" />
          <path d="M18.6 6.75a8 8 0 0 1 0 10.5" />
        </>
      );
    case 'nf-md-volume_off':
      return (
        <>
          <path d="M5 10h3l4-4v12l-4-4H5Z" />
          <path d="m16.25 9.25 4.5 5.5" />
          <path d="m20.75 9.25-4.5 5.5" />
        </>
      );
    case 'nf-md-keyboard':
      return (
        <>
          <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" />
          <path d="M6.75 10.25h.01" />
          <path d="M9.75 10.25h.01" />
          <path d="M12.75 10.25h.01" />
          <path d="M15.75 10.25h.01" />
          <path d="M6.75 13.25h8.5" />
          <path d="M17.75 13.25h.01" />
        </>
      );
    case 'nf-oct-cpu':
      return (
        <>
          <rect x="7" y="7" width="10" height="10" rx="2.5" />
          <rect x="10" y="10" width="4" height="4" rx="1" />
          <path d="M9 2.75v2.5" />
          <path d="M15 2.75v2.5" />
          <path d="M9 18.75v2.5" />
          <path d="M15 18.75v2.5" />
          <path d="M2.75 9h2.5" />
          <path d="M2.75 15h2.5" />
          <path d="M18.75 9h2.5" />
          <path d="M18.75 15h2.5" />
        </>
      );
    case 'nf-md-pause_circle':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <rect x="9" y="8.5" width="2" height="7" rx="1" />
          <rect x="13" y="8.5" width="2" height="7" rx="1" />
        </>
      );
    case 'nf-md-key_variant':
      return (
        <>
          <circle cx="8.5" cy="11.5" r="3.5" />
          <path d="M12 11.5h7" />
          <path d="M16 11.5v2.5" />
          <path d="M18.5 11.5v1.5" />
        </>
      );
    case 'nf-md-swap_horizontal':
      return (
        <>
          <path d="M4 8h13" />
          <path d="m14 5 3 3-3 3" />
          <path d="M20 16H7" />
          <path d="m10 13-3 3 3 3" />
        </>
      );
    case 'nf-md-swap_vertical':
      return (
        <>
          <path d="M8 4v13" />
          <path d="m5 14 3 3 3-3" />
          <path d="M16 20V7" />
          <path d="m13 10 3-3 3 3" />
        </>
      );
    case 'nf-md-ethernet_cable':
      return (
        <>
          <path d="M8 6h8v5H8Z" />
          <path d="M10 11v3" />
          <path d="M14 11v3" />
          <path d="M6 14h12" />
          <path d="M12 14v4" />
        </>
      );
    case 'nf-md-shield_lock_outline':
      return (
        <>
          <path d="M12 4.5 6.5 6.6v4.7c0 3.4 2.1 6.4 5.5 8.2 3.4-1.8 5.5-4.8 5.5-8.2V6.6L12 4.5Z" />
          <rect x="10" y="10.25" width="4" height="4" rx="1" />
          <path d="M11 10.25V9.2a1 1 0 1 1 2 0v1.05" />
        </>
      );
    case 'nf-md-wifi_strength_4':
      return <WifiShape level={4} />;
    case 'nf-md-wifi_strength_3':
      return <WifiShape level={3} />;
    case 'nf-md-wifi_strength_2':
      return <WifiShape level={2} />;
    case 'nf-md-wifi_strength_1':
      return <WifiShape level={1} />;
    case 'nf-md-wifi_strength_outline':
      return <WifiShape level={0} />;
    case 'nf-md-wifi_strength_off_outline':
      return (
        <>
          <WifiShape level={0} />
          <path d="m5 5 14 14" />
        </>
      );
    case 'nf-weather-day_sunny':
      return <SunShape />;
    case 'nf-weather-night_clear':
      return <MoonShape />;
    case 'nf-weather-day_cloudy':
      return (
        <>
          <path d="M16.5 8.5a3.5 3.5 0 1 0-6.5-1.8" />
          <path d="M17.6 10.8a3.8 3.8 0 0 0-3.4-2.3 4.2 4.2 0 0 0-4 2.8" />
          <CloudShape />
        </>
      );
    case 'nf-weather-night_alt_cloudy':
      return (
        <>
          <path d="M17.8 7.2a5.2 5.2 0 0 1-3.4 4.4" />
          <MoonShape />
          <CloudShape />
        </>
      );
    case 'nf-weather-day_sprinkle':
    case 'nf-weather-night_alt_sprinkle':
    case 'nf-weather-day_rain':
    case 'nf-weather-night_alt_rain':
      return (
        <>
          <CloudShape />
          <RainShape />
        </>
      );
    case 'nf-weather-day_snow':
    case 'nf-weather-night_alt_snow':
      return (
        <>
          <CloudShape />
          <SnowShape />
        </>
      );
    case 'nf-weather-day_lightning':
    case 'nf-weather-night_alt_lightning':
      return (
        <>
          <CloudShape />
          <LightningShape />
        </>
      );
    case 'nf-md-weather_partly_cloudy':
      return (
        <>
          <SunShape />
          <CloudShape />
        </>
      );
    default:
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v4l2.5 2.5" />
        </>
      );
  }
}

export function icon(name: string, extraClass = ''): JSX.Element {
  return <SvgIcon class={extraClass}>{iconNode(name)}</SvgIcon>;
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

export function batteryIcon(battery: any) {
  const charge = Math.max(0, Math.min(100, Math.round(battery?.chargePercent ?? 0)));
  const fillWidth = Math.max(1.5, (charge / 100) * 9);
  const levelClass =
    battery?.state === 'charging'
      ? 'charging'
      : charge >= 60
        ? 'good'
        : charge >= 30
          ? 'mid'
          : 'low';

  return (
    <SvgIcon class={`battery-icon ${levelClass}`}>
      <rect x="4.5" y="8" width="13" height="8" rx="2.25" />
      <path d="M17.5 10.25h2v3.5h-2" />
      <rect
        x="6.5"
        y="10"
        width={fillWidth}
        height="4"
        rx="1.1"
        fill="currentColor"
        stroke="none"
        opacity="0.9"
      />
      {battery?.state === 'charging' ? (
        <path d="m11.2 7.2-1.2 3h1.45l-.8 3.5 2.95-4.6h-1.55l1.15-1.9" />
      ) : null}
    </SvgIcon>
  );
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
