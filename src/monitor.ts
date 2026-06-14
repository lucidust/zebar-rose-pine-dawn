import {
  currentMonitor,
  primaryMonitor,
  type Monitor,
} from '@tauri-apps/api/window';

function sameMonitor(a: Monitor, b: Monitor) {
  return (
    a.name === b.name &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y &&
    a.size.width === b.size.width &&
    a.size.height === b.size.height &&
    a.scaleFactor === b.scaleFactor
  );
}

function shouldShowSystemStatusByWidth() {
  return !window.matchMedia('(max-width: 1220px)').matches;
}

export async function shouldShowSystemStatus() {
  try {
    const [current, primary] = await Promise.all([
      currentMonitor(),
      primaryMonitor(),
    ]);

    if (current && primary) {
      return sameMonitor(current, primary);
    }
  } catch (error) {
    console.warn('Failed to detect Zebar monitor placement.', error);
  }

  return shouldShowSystemStatusByWidth();
}
