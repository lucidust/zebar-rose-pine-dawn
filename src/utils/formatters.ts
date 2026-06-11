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

function formatBytesCompactParts(bytes: number, suffix = '') {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { value: '0', unit: `B${suffix}` };
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return {
    value: value.toFixed(digits),
    unit: `${units[unitIndex]}${suffix}`,
  };
}

export function formatDataRateParts(bytesPerSecond: number | null | undefined) {
  return formatBytesCompactParts(bytesPerSecond ?? 0, '/s');
}

export function formatDataAmountParts(bytes: number | null | undefined) {
  return formatBytesCompactParts(bytes ?? 0);
}

export function weatherLabel(weather: any) {
  if (!weather) {
    return 'Weather';
  }

  return `${Math.round(weather.celsiusTemp)}°C`;
}

export function glazeFocusedContainerLabel(focused: any) {
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

export function glazeFocusedContainerDetail(focused: any, glazewm?: any) {
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

export function glazeFocusedLabel(glazewm: any) {
  return glazeFocusedContainerLabel(glazewm?.focusedContainer);
}

export function glazeFocusedDetail(glazewm: any) {
  return glazeFocusedContainerDetail(glazewm?.focusedContainer, glazewm);
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

export function komorebiLayoutLabel(layout: string | null | undefined) {
  if (!layout) {
    return 'Layout';
  }

  if (layout.toLowerCase() === 'bsp') {
    return 'BSP';
  }

  return layout
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function komorebiWindowLabel(window: any, fallback = 'No focus') {
  if (!window) {
    return fallback;
  }

  return compactTitle(window.title, window.exe || window.class || fallback);
}

export function komorebiWindowDetail(window: any, fallback = '') {
  if (!window) {
    return fallback;
  }

  return compactTitle(window.exe || window.class, fallback || 'Active window');
}
