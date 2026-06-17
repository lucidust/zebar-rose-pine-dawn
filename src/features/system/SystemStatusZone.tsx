import * as zebar from 'zebar';
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { IconBadge } from '../../components/chips';
import { icon, networkIcon, weatherIcon } from '../../icons';
import {
  clamp,
  formatDataAmountParts,
  formatDataRateParts,
  percent,
  weatherLabel,
} from '../../utils/formatters';

type SystemStatusZoneProps = {
  output: Record<string, any>;
  includeSystemStatus: boolean;
};

type NightLightStatus = {
  enabled: boolean;
  scheduleMode: string;
  colorTemperatureKelvin: number;
  scheduleStart: string;
  scheduleEnd: string;
  sunsetTime: string;
  sunriseTime: string;
};

type TrayDisplayMode = 'folded' | 'pinned' | 'all';

type PinnedTrayIcon = {
  id: string;
  tooltip: string;
  iconHash: string;
  label: string;
  pinnedAt: number;
  lastSeenAt: number;
};

const TRAY_MODE_STORAGE_KEY = 'zebar-rpd-tray-mode';
const PINNED_TRAY_STORAGE_KEY = 'zebar-rpd-pinned-tray-icons';
const MISSING_PIN_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function SystemStatusZone(props: SystemStatusZoneProps) {
  const audio = () => props.output.audio?.defaultPlaybackDevice;
  const weather = () => props.output.weather;
  const date = () => props.output.date?.formatted ?? '';

  return (
    <Show when={props.includeSystemStatus}>
      <div class="chip chip-right-cluster segmented-cluster">
        <CpuMemoryChip cpu={props.output.cpu} memory={props.output.memory} />
        <NetworkChip network={props.output.network} />
        <SystrayStrip systray={props.output.systray} />
        <AudioChip audio={audio()} audioProvider={props.output.audio} />
        <NightLightChip />
        <WeatherChip weather={weather()} />
        <DateTimeChip value={date()} />
      </div>
    </Show>
  );
}

function DateTimeChip(props: { value: string }) {
  return (
    <div class="chip chip-time">
      <div class="chip-body chip-body-right chip-body-fill">
        <IconBadge node={icon('nf-md-calendar_clock')} tone="rose" />
        <span class="time-text">{props.value}</span>
      </div>
    </div>
  );
}

function WeatherChip(props: { weather: any }) {
  return (
    <Show when={props.weather}>
      <div class="chip chip-weather">
        <div class="chip-body chip-body-right">
          <IconBadge node={weatherIcon(props.weather)} tone="gold" />
          <span class="weather-value">{weatherLabel(props.weather)}</span>
        </div>
      </div>
    </Show>
  );
}

async function openTaskManager() {
  try {
    await zebar.shellSpawn('Taskmgr.exe');
  } catch (error) {
    console.error('Failed to launch Taskmgr.exe', error);
  }
}

function NightLightChip() {
  const [status, setStatus] = createSignal<NightLightStatus | null>(null);
  const [isAvailable, setIsAvailable] = createSignal(false);
  const [isToggling, setIsToggling] = createSignal(false);
  let disposed = false;

  const readStatus = async (args: string[]) => {
    const result = await zebar.shellExec('wnlctl.exe', args);

    if (result.code !== 0) {
      throw new Error(result.stderr || `exit code ${result.code}`);
    }

    return JSON.parse(result.stdout.trim()) as NightLightStatus;
  };

  const applyStatus = (nextStatus: NightLightStatus) => {
    if (!disposed && typeof nextStatus.enabled === 'boolean') {
      setStatus(nextStatus);
      setIsAvailable(true);
    }
  };

  const refreshStatus = async () => {
    try {
      applyStatus(await readStatus(['status', '--json']));
    } catch (error) {
      console.warn('Failed to read Night Light status.', error);
      if (!disposed) {
        setIsAvailable(false);
      }
    }
  };

  onMount(() => {
    void refreshStatus();
    const intervalId = window.setInterval(() => void refreshStatus(), 60_000);

    onCleanup(() => {
      disposed = true;
      window.clearInterval(intervalId);
    });
  });

  const toggleNightLight = async () => {
    if (isToggling()) {
      return;
    }

    setIsToggling(true);

    try {
      applyStatus(await readStatus(['toggle', '--json']));
    } catch (error) {
      console.error('Failed to toggle Night Light.', error);
    } finally {
      if (!disposed) {
        setIsToggling(false);
      }
    }
  };

  const title = () => {
    const value = status();

    if (!value) {
      return 'Toggle Night Light';
    }

    const state = value.enabled ? 'On' : 'Off';
    const action = value.enabled ? 'turn off' : 'turn on';
    const schedule =
      value.scheduleMode === 'off'
        ? 'schedule off'
        : `${value.scheduleMode} ${value.scheduleStart}-${value.scheduleEnd}`;

    return `Night Light ${state}, ${schedule}, ${action}`;
  };

  return (
    <Show when={isAvailable() && status()}>
      <div class="chip chip-nightlight">
        <button
          class="chip-body chip-body-right chip-body-button nightlight-button"
          type="button"
          title={title()}
          aria-label={title()}
          disabled={isToggling()}
          onClick={() => void toggleNightLight()}
        >
          <IconBadge
            node={icon(
              status()?.enabled
                ? 'nf-weather-night_clear'
                : 'nf-md-weather_partly_cloudy',
            )}
            tone={status()?.enabled ? 'gold' : 'muted'}
            class="nightlight-badge"
          />
        </button>
      </div>
    </Show>
  );
}

function AudioChip(props: { audio: any; audioProvider: any }) {
  const volume = () => clamp(props.audio?.volume ?? 0, 0, 100);
  const isMuted = () => Boolean(props.audio?.isMuted) || volume() <= 0;
  const [lastActiveVolume, setLastActiveVolume] = createSignal(35);

  createEffect(() => {
    if (!isMuted() && volume() > 0) {
      setLastActiveVolume(volume());
    }
  });

  const toggleMute = async () => {
    if (isMuted()) {
      const restoredVolume = Math.max(1, lastActiveVolume());
      await props.audioProvider?.setMute(false);
      await props.audioProvider?.setVolume(restoredVolume);
      return;
    }

    if (volume() > 0) {
      setLastActiveVolume(volume());
    }

    await props.audioProvider?.setVolume(0);
    await props.audioProvider?.setMute(true);
  };

  const onSliderInput = async (nextVolume: number) => {
    if (nextVolume > 0) {
      setLastActiveVolume(nextVolume);
    }

    await props.audioProvider?.setVolume(nextVolume);

    if (nextVolume > 0 && props.audio?.isMuted) {
      await props.audioProvider?.setMute(false);
    } else if (nextVolume <= 0 && !props.audio?.isMuted) {
      await props.audioProvider?.setMute(true);
    }
  };

  return (
    <Show when={props.audio}>
      <div class="chip chip-audio responsive-hide-lg">
        <div class="chip-body chip-body-right chip-body-fill">
          <button
            class="chip-action"
            type="button"
            title={isMuted() ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted() ? 'Unmute audio' : 'Mute audio'}
            onClick={() => void toggleMute()}
          >
            <IconBadge
              node={icon(isMuted() ? 'nf-md-volume_off' : 'nf-md-volume_high')}
              tone={isMuted() ? 'muted' : 'iris'}
            />
          </button>
          <input
            class="volume-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume()}
            onInput={event => void onSliderInput(event.currentTarget.valueAsNumber)}
          />
        </div>
      </div>
    </Show>
  );
}

function NetworkChip(props: { network: any }) {
  const [downBps, setDownBps] = createSignal<number | null>(null);
  const [upBps, setUpBps] = createSignal<number | null>(null);
  const [todayDown, setTodayDown] = createSignal(0);
  const [todayUp, setTodayUp] = createSignal(0);
  const downRate = () => formatDataRateParts(downBps());
  const upRate = () => formatDataRateParts(upBps());
  const totalDown = () => formatDataAmountParts(todayDown());
  const totalUp = () => formatDataAmountParts(todayUp());

  let prevReceived: number | null = null;
  let prevTransmitted: number | null = null;
  let prevTimestamp: number | null = null;
  let baselineDayKey = '';
  let baselineReceived = 0;
  let baselineTransmitted = 0;

  const currentDayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const baselineStorageKey = (dayKey: string) =>
    `zebar-rpd-traffic-baseline:${dayKey}`;

  const persistBaseline = (dayKey: string) => {
    try {
      window.localStorage.setItem(
        baselineStorageKey(dayKey),
        JSON.stringify({
          received: baselineReceived,
          transmitted: baselineTransmitted,
        }),
      );
    } catch {
      // Ignore storage failures and keep the runtime baseline only.
    }
  };

  const ensureBaseline = (
    dayKey: string,
    totalReceived: number,
    totalTransmitted: number,
  ) => {
    if (baselineDayKey === dayKey) {
      if (
        totalReceived < baselineReceived ||
        totalTransmitted < baselineTransmitted
      ) {
        baselineReceived = totalReceived;
        baselineTransmitted = totalTransmitted;
        persistBaseline(dayKey);
      }

      return;
    }

    baselineDayKey = dayKey;

    try {
      const stored = window.localStorage.getItem(baselineStorageKey(dayKey));
      if (stored) {
        const parsed = JSON.parse(stored) as {
          received?: number;
          transmitted?: number;
        };
        baselineReceived = Math.max(0, parsed.received ?? totalReceived);
        baselineTransmitted = Math.max(0, parsed.transmitted ?? totalTransmitted);
      } else {
        baselineReceived = totalReceived;
        baselineTransmitted = totalTransmitted;
        persistBaseline(dayKey);
      }
    } catch {
      baselineReceived = totalReceived;
      baselineTransmitted = totalTransmitted;
    }
  };

  createEffect(() => {
    const traffic = props.network?.traffic;
    if (traffic?.totalReceived == null || traffic?.totalTransmitted == null) {
      return;
    }

    const totalReceived = Math.max(0, traffic.totalReceived.bytes ?? 0);
    const totalTransmitted = Math.max(0, traffic.totalTransmitted.bytes ?? 0);
    const timestamp = Date.now();
    const dayKey = currentDayKey();

    ensureBaseline(dayKey, totalReceived, totalTransmitted);

    if (
      prevTimestamp != null &&
      prevReceived != null &&
      prevTransmitted != null &&
      timestamp > prevTimestamp &&
      totalReceived >= prevReceived &&
      totalTransmitted >= prevTransmitted
    ) {
      const elapsedSeconds = (timestamp - prevTimestamp) / 1_000;
      setDownBps((totalReceived - prevReceived) / elapsedSeconds);
      setUpBps((totalTransmitted - prevTransmitted) / elapsedSeconds);
    }

    prevReceived = totalReceived;
    prevTransmitted = totalTransmitted;
    prevTimestamp = timestamp;

    setTodayDown(Math.max(0, totalReceived - baselineReceived));
    setTodayUp(Math.max(0, totalTransmitted - baselineTransmitted));
  });

  return (
    <Show when={props.network}>
      <div
        class="chip chip-network"
        title={props.network?.defaultInterface ? networkTitle(props.network) : 'Offline'}
      >
        <div class="chip-body chip-body-right">
          <IconBadge node={networkIcon(props.network)} tone="pine" />
          <div class="stacked">
            <span class="chip-label network-line">
              <span class="network-prefix">↓</span>
              <span class="network-stat network-stat-rate">
                <span class="network-stat-value">{downRate().value}</span>
                <span class="network-stat-unit">{downRate().unit}</span>
              </span>
              <span class="network-separator">·</span>
              <span class="network-stat network-stat-amount">
                <span class="network-stat-value">{totalDown().value}</span>
                <span class="network-stat-unit">{totalDown().unit}</span>
              </span>
            </span>
            <span class="chip-detail network-line network-line-secondary">
              <span class="network-prefix">↑</span>
              <span class="network-stat network-stat-rate">
                <span class="network-stat-value">{upRate().value}</span>
                <span class="network-stat-unit">{upRate().unit}</span>
              </span>
              <span class="network-separator">·</span>
              <span class="network-stat network-stat-amount">
                <span class="network-stat-value">{totalUp().value}</span>
                <span class="network-stat-unit">{totalUp().unit}</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </Show>
  );
}

function CpuMemoryChip(props: { cpu: any; memory: any }) {
  const hasCpu = () => props.cpu != null;
  const hasMemory = () => props.memory != null;
  const cpuValue = () => percent(props.cpu?.usage);
  const memoryValue = () => percent(props.memory?.usage);
  const metricTooltip = () => {
    const parts: string[] = [];

    if (hasCpu()) {
      parts.push(`CPU ${cpuValue()}`);
    }

    if (hasMemory()) {
      parts.push(`Memory ${memoryValue()}`);
    }

    return parts.join(' • ');
  };

  return (
    <Show when={hasCpu() || hasMemory()}>
      <div class="chip chip-metric-combo chip-priority">
        <button
          class="chip-body chip-body-right chip-body-button metric-combo-action"
          type="button"
          title={metricTooltip()}
          aria-label={`${metricTooltip()}, open Task Manager`}
          onClick={() => void openTaskManager()}
        >
          <IconBadge
            node={icon('custom-metrics')}
            tone="love"
            class="metric-chip-badge"
          />
          <div class="stacked metric-stack">
            <Show when={hasCpu()}>
              <MetricStackLine
                label="C"
                value={cpuValue()}
              />
            </Show>
            <Show when={hasMemory()}>
              <MetricStackLine
                label="M"
                value={memoryValue()}
                secondary
              />
            </Show>
          </div>
        </button>
      </div>
    </Show>
  );
}

function MetricStackLine(props: {
  label: string;
  value: string;
  secondary?: boolean;
}) {
  return (
    <span class={`metric-line ${props.secondary ? 'metric-line-secondary' : ''}`.trim()}>
      <span class="metric-line-label">{props.label}</span>
      <span class="metric-stack-value">{props.value}</span>
    </span>
  );
}

function SystrayStrip(props: { systray: any }) {
  const [mode, setMode] = createSignal<TrayDisplayMode>(readTrayMode());
  const [isManaging, setIsManaging] = createSignal(false);
  const [pinnedIcons, setPinnedIcons] = createSignal<PinnedTrayIcon[]>(
    readPinnedTrayIcons(),
  );
  let rootRef: HTMLDivElement | undefined;

  const allIcons = createMemo(() => props.systray?.icons ?? []);
  const matchedPinnedIcons = createMemo(() =>
    pinnedIcons()
      .map(pinnedIcon => ({
        pinnedIcon,
        trayIcon: findMatchingTrayIcon(pinnedIcon, allIcons()),
      }))
      .filter(
        (match): match is { pinnedIcon: PinnedTrayIcon; trayIcon: any } =>
          match.trayIcon != null,
      ),
  );
  const missingPinnedIcons = createMemo(() =>
    pinnedIcons().filter(pinnedIcon => !findMatchingTrayIcon(pinnedIcon, allIcons())),
  );
  const displayedIcons = createMemo(() => {
    if (isManaging() || mode() === 'all') {
      return allIcons();
    }

    if (mode() === 'pinned') {
      return matchedPinnedIcons().map(match => match.trayIcon);
    }

    return [];
  });
  const hasTrayState = createMemo(
    () => allIcons().length > 0 || pinnedIcons().length > 0,
  );
  const hiddenIconCount = createMemo(() => {
    if (isManaging() || mode() === 'all') {
      return 0;
    }

    if (mode() === 'pinned') {
      return Math.max(allIcons().length - displayedIcons().length, 0);
    }

    return allIcons().length;
  });

  const closeOnOutsidePointer = (event: PointerEvent) => {
    if (!isManaging() || !rootRef) {
      return;
    }

    if (!rootRef.contains(event.target as Node)) {
      setIsManaging(false);
    }
  };

  const closeOnEscape = (event: KeyboardEvent) => {
    if (isManaging() && event.key === 'Escape') {
      setIsManaging(false);
    }
  };

  createEffect(() => {
    window.localStorage.setItem(TRAY_MODE_STORAGE_KEY, mode());
  });

  createEffect(() => {
    writePinnedTrayIcons(pinnedIcons());
  });

  createEffect(() => {
    const icons = allIcons();

    if (!icons.length) {
      return;
    }

    setPinnedIcons(currentPinnedIcons =>
      refreshPinnedTrayIcons(currentPinnedIcons, icons),
    );
  });

  onMount(() => {
    const cleanupTimerId = window.setTimeout(() => {
      setPinnedIcons(currentPinnedIcons =>
        pruneExpiredMissingPinnedIcons(currentPinnedIcons, allIcons()),
      );
    }, 5_000);

    onCleanup(() => window.clearTimeout(cleanupTimerId));
  });

  document.addEventListener('pointerdown', closeOnOutsidePointer);
  document.addEventListener('keydown', closeOnEscape);
  onCleanup(() => {
    document.removeEventListener('pointerdown', closeOnOutsidePointer);
    document.removeEventListener('keydown', closeOnEscape);
  });

  const cycleMode = () => {
    setMode(currentMode => {
      if (currentMode === 'folded') {
        return 'pinned';
      }

      if (currentMode === 'pinned') {
        return 'all';
      }

      return 'folded';
    });
  };

  const togglePin = (trayIcon: any) => {
    setPinnedIcons(currentPinnedIcons => {
      const matchingPinnedIcon = findMatchingPinnedIcon(
        trayIcon,
        currentPinnedIcons,
      );

      if (matchingPinnedIcon) {
        return currentPinnedIcons.filter(
          pinnedIcon => pinnedIcon !== matchingPinnedIcon,
        );
      }

      return [...currentPinnedIcons, createPinnedTrayIcon(trayIcon)];
    });
  };

  const removeMissingPins = () => {
    setPinnedIcons(currentPinnedIcons =>
      currentPinnedIcons.filter(pinnedIcon =>
        findMatchingTrayIcon(pinnedIcon, allIcons()),
      ),
    );
  };

  const scrollTrayStrip = (event: WheelEvent) => {
    const strip = event.currentTarget as HTMLDivElement;
    const scrollDelta = event.deltaY || event.deltaX;

    if (!scrollDelta) {
      return;
    }

    event.preventDefault();
    strip.scrollLeft += scrollDelta;
  };

  return (
    <Show when={hasTrayState()}>
      <div
        class="chip chip-systray"
        data-tray-mode={mode()}
        data-managing={isManaging() ? 'true' : 'false'}
        ref={rootRef}
      >
        <Show when={displayedIcons().length}>
          <div class="tray-inline-strip" onWheel={scrollTrayStrip}>
            <For each={displayedIcons()}>
              {(trayIcon: any) => (
                <TrayIconButton
                  systray={props.systray}
                  trayIcon={trayIcon}
                  isManaging={isManaging()}
                  isPinned={
                    isManaging() && isTrayIconPinned(trayIcon, pinnedIcons())
                  }
                  togglePin={() => togglePin(trayIcon)}
                />
              )}
            </For>
          </div>
        </Show>
        <button
          class="chip-body chip-body-right chip-body-button tray-overflow-button"
          type="button"
          title={trayControlTitle(
            mode(),
            isManaging(),
            allIcons().length,
            displayedIcons().length,
            hiddenIconCount(),
          )}
          aria-label={trayControlTitle(
            mode(),
            isManaging(),
            allIcons().length,
            displayedIcons().length,
            hiddenIconCount(),
          )}
          aria-expanded={isManaging()}
          onClick={event => {
            event.preventDefault();

            if (event.ctrlKey) {
              setIsManaging(managing => !managing);
              return;
            }

            if (isManaging()) {
              setIsManaging(false);
              return;
            }

            cycleMode();
          }}
        >
          <span class="tray-control-icon" data-mode={trayControlMode(mode(), isManaging())}>
            <IconBadge node={icon('custom-tray')} tone="foam" />
          </span>
          <Show when={hiddenIconCount() > 0}>
            <span class="tray-overflow-count">{`+${hiddenIconCount()}`}</span>
          </Show>
        </button>
        <Show when={isManaging() && missingPinnedIcons().length > 0}>
          <button
            class="tray-missing-button"
            type="button"
            title="Remove missing pinned tray icons"
            aria-label="Remove missing pinned tray icons"
            onClick={event => {
              event.preventDefault();
              removeMissingPins();
            }}
          >
            <span class="tray-missing-label">missing</span>
            <span class="tray-missing-count">{missingPinnedIcons().length}</span>
          </button>
        </Show>
      </div>
    </Show>
  );
}

function TrayIconButton(props: {
  systray: any;
  trayIcon: any;
  isManaging?: boolean;
  isPinned?: boolean;
  togglePin?: () => void;
}) {
  return (
    <button
      class="tray-button"
      type="button"
      title={props.trayIcon.tooltip}
      data-pinned={props.isPinned ? 'true' : 'false'}
      onClick={event => {
        event.preventDefault();

        if (props.isManaging) {
          props.togglePin?.();
          return;
        }

        void props.systray.onLeftClick(props.trayIcon.id);
      }}
      onContextMenu={event => {
        event.preventDefault();

        if (props.isManaging) {
          props.togglePin?.();
          return;
        }

        void props.systray.onRightClick(props.trayIcon.id);
      }}
    >
      <img class="tray-icon" src={props.trayIcon.iconUrl} alt={props.trayIcon.tooltip} />
    </button>
  );
}

function readTrayMode(): TrayDisplayMode {
  const storedMode = window.localStorage.getItem(TRAY_MODE_STORAGE_KEY);

  if (
    storedMode === 'folded' ||
    storedMode === 'pinned' ||
    storedMode === 'all'
  ) {
    return storedMode;
  }

  return 'folded';
}

function readPinnedTrayIcons(): PinnedTrayIcon[] {
  try {
    const rawPinnedIcons = window.localStorage.getItem(PINNED_TRAY_STORAGE_KEY);

    if (!rawPinnedIcons) {
      return [];
    }

    const parsedPinnedIcons = JSON.parse(rawPinnedIcons);

    if (!Array.isArray(parsedPinnedIcons)) {
      return [];
    }

    return parsedPinnedIcons
      .map(normalizePinnedTrayIcon)
      .filter((pinnedIcon): pinnedIcon is PinnedTrayIcon => pinnedIcon != null);
  } catch (error) {
    console.warn('Failed to read pinned tray icons.', error);
    return [];
  }
}

function writePinnedTrayIcons(pinnedIcons: PinnedTrayIcon[]) {
  try {
    window.localStorage.setItem(
      PINNED_TRAY_STORAGE_KEY,
      JSON.stringify(pinnedIcons),
    );
  } catch (error) {
    console.warn('Failed to store pinned tray icons.', error);
  }
}

function normalizePinnedTrayIcon(rawPinnedIcon: any): PinnedTrayIcon | null {
  if (!rawPinnedIcon || typeof rawPinnedIcon !== 'object') {
    return null;
  }

  const id = String(rawPinnedIcon.id ?? '');
  const tooltip = String(rawPinnedIcon.tooltip ?? '');
  const iconHash = String(rawPinnedIcon.iconHash ?? '');

  if (!id && (!tooltip || !iconHash)) {
    return null;
  }

  const pinnedAt = validTimestamp(rawPinnedIcon.pinnedAt) ?? Date.now();
  const lastSeenAt =
    validTimestamp(rawPinnedIcon.lastSeenAt) ??
    validTimestamp(rawPinnedIcon.pinnedAt) ??
    Date.now();

  return {
    id,
    tooltip,
    iconHash,
    label: trayIconLabel(rawPinnedIcon),
    pinnedAt,
    lastSeenAt,
  };
}

function validTimestamp(value: any): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function createPinnedTrayIcon(trayIcon: any): PinnedTrayIcon {
  const now = Date.now();

  return {
    id: String(trayIcon?.id ?? ''),
    tooltip: String(trayIcon?.tooltip ?? ''),
    iconHash: String(trayIcon?.iconHash ?? ''),
    label: trayIconLabel(trayIcon),
    pinnedAt: now,
    lastSeenAt: now,
  };
}

function trayIconLabel(trayIcon: any): string {
  const tooltip = String(trayIcon?.tooltip ?? '').trim();
  const firstLine = tooltip.split(/\r?\n/u)[0]?.trim();

  return firstLine || String(trayIcon?.id ?? 'Tray icon');
}

function trayFingerprint(trayIcon: any) {
  return {
    tooltip: String(trayIcon?.tooltip ?? ''),
    iconHash: String(trayIcon?.iconHash ?? ''),
  };
}

function hasSameTrayFingerprint(a: any, b: any) {
  const aFingerprint = trayFingerprint(a);
  const bFingerprint = trayFingerprint(b);

  return (
    aFingerprint.tooltip !== '' &&
    aFingerprint.iconHash !== '' &&
    aFingerprint.tooltip === bFingerprint.tooltip &&
    aFingerprint.iconHash === bFingerprint.iconHash
  );
}

function findMatchingTrayIcon(pinnedIcon: PinnedTrayIcon, trayIcons: any[]) {
  const idMatch = trayIcons.find(trayIcon => trayIcon?.id === pinnedIcon.id);

  if (idMatch) {
    return idMatch;
  }

  return trayIcons.find(trayIcon => hasSameTrayFingerprint(pinnedIcon, trayIcon));
}

function findMatchingPinnedIcon(
  trayIcon: any,
  pinnedIcons: PinnedTrayIcon[],
) {
  const idMatch = pinnedIcons.find(
    pinnedIcon => pinnedIcon.id === String(trayIcon?.id ?? ''),
  );

  if (idMatch) {
    return idMatch;
  }

  return pinnedIcons.find(pinnedIcon => hasSameTrayFingerprint(pinnedIcon, trayIcon));
}

function isTrayIconPinned(trayIcon: any, pinnedIcons: PinnedTrayIcon[]) {
  return findMatchingPinnedIcon(trayIcon, pinnedIcons) != null;
}

function refreshPinnedTrayIcons(
  pinnedIcons: PinnedTrayIcon[],
  trayIcons: any[],
) {
  const now = Date.now();
  let hasChanges = false;

  const nextPinnedIcons = pinnedIcons.map(pinnedIcon => {
    const matchingTrayIcon = findMatchingTrayIcon(pinnedIcon, trayIcons);

    if (!matchingTrayIcon) {
      return pinnedIcon;
    }

    const nextPinnedIcon = {
      ...pinnedIcon,
      id: String(matchingTrayIcon?.id ?? ''),
      tooltip: String(matchingTrayIcon?.tooltip ?? ''),
      iconHash: String(matchingTrayIcon?.iconHash ?? ''),
      label: trayIconLabel(matchingTrayIcon),
      lastSeenAt:
        now - pinnedIcon.lastSeenAt > 60_000 ? now : pinnedIcon.lastSeenAt,
    };

    hasChanges =
      hasChanges ||
      nextPinnedIcon.id !== pinnedIcon.id ||
      nextPinnedIcon.tooltip !== pinnedIcon.tooltip ||
      nextPinnedIcon.iconHash !== pinnedIcon.iconHash ||
      nextPinnedIcon.label !== pinnedIcon.label ||
      nextPinnedIcon.lastSeenAt !== pinnedIcon.lastSeenAt;

    return nextPinnedIcon;
  });

  return hasChanges ? nextPinnedIcons : pinnedIcons;
}

function pruneExpiredMissingPinnedIcons(
  pinnedIcons: PinnedTrayIcon[],
  trayIcons: any[],
) {
  const now = Date.now();

  return pinnedIcons.filter(pinnedIcon => {
    if (findMatchingTrayIcon(pinnedIcon, trayIcons)) {
      return true;
    }

    return now - pinnedIcon.lastSeenAt <= MISSING_PIN_MAX_AGE_MS;
  });
}

function trayControlTitle(
  mode: TrayDisplayMode,
  isManaging: boolean,
  iconCount: number,
  visibleIconCount: number,
  hiddenIconCount: number,
) {
  if (isManaging) {
    return `Managing ${iconCount} tray icons. Click icons to pin or unpin. Click tray control to leave manage mode.`;
  }

  if (mode === 'folded') {
    return `${iconCount} tray icons hidden. Click to show pinned icons. Ctrl+click to manage pins.`;
  }

  if (mode === 'pinned') {
    return `${visibleIconCount} pinned tray icons shown, ${hiddenIconCount} hidden. Click to show all icons. Ctrl+click to manage pins.`;
  }

  return `All ${iconCount} tray icons shown. Click to fold tray icons. Ctrl+click to manage pins.`;
}

function trayControlMode(mode: TrayDisplayMode, isManaging: boolean) {
  if (isManaging) {
    return 'manage';
  }

  if (mode === 'pinned') {
    return 'pinned';
  }

  if (mode === 'all') {
    return 'all';
  }

  return 'folded';
}

function networkTitle(network: any) {
  const interfaceName =
    network?.defaultGateway?.ssid ||
    network?.defaultInterface?.friendlyName ||
    network?.defaultInterface?.name ||
    'Offline';
  const interfaceType = network?.defaultInterface?.type ?? 'unknown';

  return `${interfaceName} (${interfaceType})`;
}
