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
  includeLiveSystemStats: boolean;
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

export function SystemStatusZone(props: SystemStatusZoneProps) {
  const audio = () => props.output.audio?.defaultPlaybackDevice;
  const weather = () => props.output.weather;
  const date = () => props.output.date?.formatted ?? '';

  return (
    <div class="chip chip-right-cluster segmented-cluster">
      <Show when={props.includeLiveSystemStats}>
        <CpuMemoryChip cpu={props.output.cpu} memory={props.output.memory} />
        <NetworkChip network={props.output.network} />
      </Show>
      <SystrayStrip systray={props.output.systray} />
      <AudioChip audio={audio()} audioProvider={props.output.audio} />
      <Show when={props.includeLiveSystemStats}>
        <NightLightChip />
      </Show>
      <WeatherChip weather={weather()} />
      <DateTimeChip value={date()} />
    </div>
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
  const [isOpen, setIsOpen] = createSignal(false);
  let rootRef: HTMLDivElement | undefined;

  const allIcons = createMemo(() => props.systray?.icons ?? []);
  const popoverStyle = createMemo(() => {
    const iconCount = allIcons().length;
    const buttonSize = 26;
    const gap = 6;
    const paddingX = 8;
    const idealWidth =
      iconCount * buttonSize + Math.max(iconCount - 1, 0) * gap + paddingX * 2;

    return {
      width: `${idealWidth}px`,
      'max-width': 'calc(100vw - 24px)',
    };
  });

  const closeOnOutsidePointer = (event: PointerEvent) => {
    if (!isOpen() || !rootRef) {
      return;
    }

    if (!rootRef.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  document.addEventListener('pointerdown', closeOnOutsidePointer);
  onCleanup(() => document.removeEventListener('pointerdown', closeOnOutsidePointer));

  return (
    <Show when={props.systray?.icons?.length}>
      <div class="chip chip-systray" ref={rootRef}>
        <button
          class="chip-body chip-body-right chip-body-button tray-overflow-button"
          type="button"
          title={`Show ${allIcons().length} tray icons`}
          aria-label={`Show ${allIcons().length} tray icons`}
          aria-expanded={isOpen()}
          onClick={() => setIsOpen(open => !open)}
        >
          <IconBadge node={icon('custom-tray')} tone="foam" />
          <span class="tray-overflow-count">{`+${allIcons().length}`}</span>
        </button>
        <Show when={isOpen()}>
          <div class="tray-popover" style={popoverStyle()}>
            <div class="tray-popover-grid">
              <For each={allIcons()}>
                {(trayIcon: any) => (
                  <TrayIconButton systray={props.systray} trayIcon={trayIcon} />
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
}

function TrayIconButton(props: { systray: any; trayIcon: any }) {
  return (
    <button
      class="tray-button"
      type="button"
      title={props.trayIcon.tooltip}
      onClick={event => {
        event.preventDefault();
        props.systray.onLeftClick(props.trayIcon.id);
      }}
      onContextMenu={event => {
        event.preventDefault();
        props.systray.onRightClick(props.trayIcon.id);
      }}
    >
      <img class="tray-icon" src={props.trayIcon.iconUrl} alt={props.trayIcon.tooltip} />
    </button>
  );
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
