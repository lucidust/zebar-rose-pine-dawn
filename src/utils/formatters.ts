export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function percent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }

  return `${Math.round(value)}%`;
}

export function compactTitle(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.length > 28 ? `${value.slice(0, 27)}…` : value;
}

export function workspaceLabel(workspace: {
  displayName?: string | null;
  name?: string | null;
}) {
  return workspace.displayName || workspace.name || '?';
}

export function networkLabel(network: any) {
  return (
    network?.defaultGateway?.ssid ||
    network?.defaultInterface?.friendlyName ||
    network?.defaultInterface?.name ||
    'Offline'
  );
}

export function compactNetworkLabel(network: any) {
  const label = networkLabel(network).trim();

  if (label.length <= 16) {
    return label;
  }

  return `${label.slice(0, 15)}…`;
}

function formatBytesCompact(bytes: number, suffix = '') {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return `0B${suffix}`;
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)}${units[unitIndex]}${suffix}`;
}

export function formatDataRate(bytesPerSecond: number | null | undefined) {
  return formatBytesCompact(bytesPerSecond ?? 0, '/s');
}

export function formatDataAmount(bytes: number | null | undefined) {
  return formatBytesCompact(bytes ?? 0);
}

export function batteryStatusText(battery: any) {
  if (!battery) {
    return '';
  }

  if (battery.state === 'charging') {
    return 'Charging';
  }

  if (battery.state === 'full') {
    return 'Full';
  }

  if (battery.state === 'empty') {
    return 'No battery';
  }

  return 'Battery';
}

export function weatherLabel(weather: any) {
  if (!weather) {
    return 'Weather';
  }

  return `${Math.round(weather.celsiusTemp)}°C`;
}

export function timeRemainingLabel(minutes: number | null | undefined) {
  if (minutes == null || minutes < 0) {
    return '';
  }

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (!hours) {
    return `${remainder}m`;
  }

  if (!remainder) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function batteryDetail(battery: any) {
  if (!battery) {
    return '';
  }

  if (battery.state === 'charging') {
    const remaining = timeRemainingLabel(battery.timeTillFull);
    return remaining ? `${percent(battery.chargePercent)} · ${remaining}` : percent(battery.chargePercent);
  }

  if (battery.state === 'discharging') {
    const remaining = timeRemainingLabel(battery.timeTillEmpty);
    return remaining ? `${percent(battery.chargePercent)} · ${remaining}` : percent(battery.chargePercent);
  }

  return percent(battery.chargePercent);
}

export function glazeFocusedLabel(glazewm: any) {
  const focused = glazewm?.focusedContainer;

  if (!focused) {
    return 'No focus';
  }

  if (focused.type === 'window') {
    const title = compactTitle(focused.title, focused.processName || 'Window');
    return title;
  }

  if (focused.type === 'workspace') {
    return `Workspace ${workspaceLabel(focused)}`;
  }

  return focused.type || 'Container';
}

export function glazeFocusedDetail(glazewm: any) {
  const focused = glazewm?.focusedContainer;

  if (!focused) {
    return '';
  }

  if (focused.type === 'window') {
    return compactTitle(focused.processName, 'Active window');
  }

  if (focused.type === 'workspace') {
    const childCount = Array.isArray(focused.children) ? focused.children.length : 0;
    return childCount ? `${childCount} windows` : 'Empty';
  }

  return glazewm?.tilingDirection === 'horizontal' ? 'Horizontal split' : 'Vertical split';
}

export function komorebiWorkspaceDetail(komorebi: any) {
  const focused = komorebi?.focusedWorkspace;

  if (!focused) {
    return '';
  }

  const containers = focused.tilingContainers?.length ?? 0;
  const floating = focused.floatingWindows?.length ?? 0;
  const parts: string[] = [];

  if (focused.layout) {
    parts.push(String(focused.layout).replaceAll('_', ' '));
  }

  if (containers) {
    parts.push(`Tiles ${containers}`);
  }

  if (floating) {
    parts.push(`Floating ${floating}`);
  }

  return parts.join(' · ');
}
