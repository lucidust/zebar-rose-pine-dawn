import type { JSX } from 'solid-js';

export function icon(className: string, extraClass = ''): JSX.Element {
  return <i class={`nf ${className} ${extraClass}`.trim()} />;
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
  const charge = battery?.chargePercent ?? 0;

  if (battery?.state === 'charging') {
    return icon('nf-md-battery_charging_high');
  }
  if (charge >= 90) return icon('nf-fa-battery_4');
  if (charge >= 65) return icon('nf-fa-battery_3');
  if (charge >= 40) return icon('nf-fa-battery_2');
  if (charge >= 20) return icon('nf-fa-battery_1');
  return icon('nf-fa-battery_0');
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
