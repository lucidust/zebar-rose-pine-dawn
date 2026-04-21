import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { pickRandomBrandCopy, resolveBrandCopy } from './brand-copy';
import { batteryIcon, icon, networkIcon, weatherIcon } from './icons';
import type { Variant } from './providers';
import {
  batteryDetail,
  batteryStatusText,
  clamp,
  compactNetworkLabel,
  compactTitle,
  formatDataAmount,
  formatDataRate,
  glazeFocusedDetail,
  glazeFocusedLabel,
  komorebiWorkspaceDetail,
  percent,
  weatherLabel,
  workspaceLabel,
} from './utils/formatters';

type AppProps = {
  providers: any;
  variant: Variant;
};

type Tone = 'love' | 'gold' | 'rose' | 'pine' | 'foam' | 'iris' | 'muted';

function workspaceAccentVar(index: number) {
  return `var(--ws-${(index % 6) + 1})`;
}

export function App(props: AppProps) {
  const [output, setOutput] = createStore<Record<string, any>>(
    props.providers.outputMap as Record<string, any>,
  );

  props.providers.onOutput((nextOutput: Record<string, any>) => {
    setOutput(reconcile(nextOutput));
  });

  const glaze = () => output.glazewm;
  const komorebi = () => output.komorebi;
  const media = () => output.media?.currentSession;
  const audio = () => output.audio?.defaultPlaybackDevice;
  const weather = () => output.weather;
  const date = () => output.date?.formatted ?? '';

  function renderLeftZone() {
    if (props.variant === 'with-glazewm') {
      return (
        <>
          <BrandChip variant="with-glazewm" accent="iris" />
          <GlazeWorkspaceStrip glazewm={glaze()} />
        </>
      );
    }

    if (props.variant === 'with-komorebi') {
      return (
        <>
          <BrandChip variant="with-komorebi" accent="foam" />
          <KomorebiWorkspaceStrip komorebi={komorebi()} />
        </>
      );
    }

    return <BrandChip variant="vanilla" accent="rose" />;
  }

  function renderCenterZone() {
    if (props.variant === 'with-glazewm') {
      return (
        <>
          <Show when={glaze()}>
            <SummaryChip
              iconNode={icon('nf-md-application_outline')}
              label={glazeFocusedLabel(glaze())}
              detail={glazeFocusedDetail(glaze())}
              tone="iris"
            />
          </Show>
          <DateTimeChip value={date()} />
          <WeatherChip weather={weather()} />
        </>
      );
    }

    if (props.variant === 'with-komorebi') {
      return (
        <>
          <Show when={komorebi()}>
            <SummaryChip
              iconNode={icon('nf-md-view_dashboard')}
              label={`Workspace ${workspaceLabel(komorebi().focusedWorkspace ?? {})}`}
              detail={komorebiWorkspaceDetail(komorebi())}
              tone="foam"
            />
          </Show>
          <DateTimeChip value={date()} />
          <WeatherChip weather={weather()} />
        </>
      );
    }

    return (
      <>
        <DateTimeChip value={date()} />
        <WeatherChip weather={weather()} />
      </>
    );
  }

  return (
    <div class="bar-shell">
      <div class="bar-grid">
        <div class="zone zone-left">{renderLeftZone()}</div>
        <div class="zone zone-center">{renderCenterZone()}</div>
        <div class="zone zone-right">
          <Show when={props.variant === 'with-glazewm' && glaze()}>
            <GlazeControls glazewm={glaze()} />
          </Show>
          <MemoryChip memory={output.memory} />
          <CpuChip cpu={output.cpu} />
          <BatteryChip battery={output.battery} />
          <NetworkChip network={output.network} />
          <AudioChip audio={audio()} audioProvider={output.audio} />
          <MediaChip media={media()} mediaProvider={output.media} />
          <SystrayStrip systray={output.systray} />
        </div>
      </div>
    </div>
  );
}

function BrandChip(props: {
  variant: Variant;
  accent: 'iris' | 'foam' | 'rose';
}) {
  const [now, setNow] = createSignal(new Date());
  const [manualCopy, setManualCopy] = createSignal<ReturnType<
    typeof resolveBrandCopy
  > | null>(null);
  let refreshTimer: number | undefined;

  const scheduleRefresh = () => {
    const current = new Date();
    const next = new Date(current);
    next.setHours(24, 0, 2, 0);

    refreshTimer = window.setTimeout(() => {
      setNow(new Date());
      setManualCopy(null);
      scheduleRefresh();
    }, Math.max(1_000, next.getTime() - current.getTime()));
  };

  scheduleRefresh();
  onCleanup(() => {
    if (refreshTimer != null) {
      window.clearTimeout(refreshTimer);
    }
  });

  const resolvedCopy = createMemo(() => resolveBrandCopy(props.variant, now()));
  const copy = createMemo(() => manualCopy() ?? resolvedCopy());

  return (
    <div class={`chip chip-brand chip-accent-${props.accent}`}>
      <button
        class="brand-mark brand-refresh"
        type="button"
        title="Refresh quote"
        aria-label="Refresh quote"
        onClick={() =>
          setManualCopy(pickRandomBrandCopy(props.variant, copy().entry.id))
        }
      >
        <IconBadge node={icon('custom-tulip')} tone="rose" />
      </button>
      <div class="stacked">
        <span class="chip-label brand-sentence">{copy().sentence}</span>
        <span class="chip-detail brand-category">{copy().detail}</span>
      </div>
    </div>
  );
}

function SummaryChip(props: {
  iconNode: any;
  label: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div class="chip chip-summary responsive-hide-sm">
      <IconBadge node={props.iconNode} tone={props.tone} />
      <div class="stacked">
        <span class="chip-label">{props.label}</span>
        <span class="chip-detail">{props.detail}</span>
      </div>
    </div>
  );
}

function DateTimeChip(props: { value: string }) {
  return (
    <div class="chip chip-time">
      <IconBadge node={icon('nf-md-calendar_clock')} tone="gold" />
      <span class="time-text">{props.value}</span>
    </div>
  );
}

function WeatherChip(props: { weather: any }) {
  return (
    <Show when={props.weather}>
      <div class="chip chip-weather responsive-hide-md">
        <IconBadge node={weatherIcon(props.weather)} tone="gold" />
        <span class="weather-value">{weatherLabel(props.weather)}</span>
      </div>
    </Show>
  );
}

function GlazeWorkspaceStrip(props: { glazewm: any }) {
  return (
    <Show when={props.glazewm?.currentWorkspaces?.length}>
      <div class="workspace-strip">
        <For each={props.glazewm.currentWorkspaces}>
          {(workspace: any, index) => (
            <button
              class={`workspace-pill ${workspace.hasFocus ? 'focused' : ''} ${workspace.isDisplayed ? 'displayed' : ''}`}
              style={{ '--workspace-accent': workspaceAccentVar(index()) }}
              onClick={() =>
                props.glazewm.runCommand(`focus --workspace ${workspace.name}`)
              }
              title={`${workspaceLabel(workspace)} workspace`}
              aria-label={`${workspaceLabel(workspace)} workspace`}
            >
              <span class="workspace-dot" />
            </button>
          )}
        </For>
      </div>
    </Show>
  );
}

function KomorebiWorkspaceStrip(props: { komorebi: any }) {
  return (
    <Show when={props.komorebi?.currentWorkspaces?.length}>
      <div class="workspace-strip">
        <For each={props.komorebi.currentWorkspaces}>
          {(workspace: any, index) => (
            <div
              class={`workspace-pill workspace-pill-passive ${
                workspace.name === props.komorebi?.focusedWorkspace?.name
                  ? 'focused'
                  : ''
              } ${
                workspace.name === props.komorebi?.displayedWorkspace?.name
                  ? 'displayed'
                  : ''
              }`}
              style={{ '--workspace-accent': workspaceAccentVar(index()) }}
              title={`${workspace.name} workspace`}
              aria-label={`${workspace.name} workspace`}
            >
              <span class="workspace-dot" />
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}

function GlazeControls(props: { glazewm: any }) {
  return (
    <>
      <Show when={props.glazewm?.isPaused}>
        <ChipActionControl
          class="responsive-hide-md"
          tone="gold"
          title="GlazeWM paused"
          ariaLabel="GlazeWM paused"
          onClick={() => props.glazewm.runCommand('wm-toggle-pause')}
          iconNode={icon('nf-md-pause_circle')}
        />
      </Show>
      <For each={props.glazewm?.bindingModes ?? []}>
        {(mode: any) => (
          <ChipActionControl
            class="responsive-hide-lg"
            tone="foam"
            title={`${mode.displayName ?? mode.name} mode`}
            ariaLabel={`${mode.displayName ?? mode.name} mode`}
            onClick={() =>
              props.glazewm.runCommand(
                `wm-disable-binding-mode --name ${mode.name}`,
              )
            }
            iconNode={bindingModeIcon(mode)}
          />
        )}
      </For>
      <ChipActionControl
        tone="iris"
        title={
          props.glazewm?.tilingDirection === 'horizontal'
            ? 'Horizontal tiling'
            : 'Vertical tiling'
        }
        ariaLabel={
          props.glazewm?.tilingDirection === 'horizontal'
            ? 'Horizontal tiling'
            : 'Vertical tiling'
        }
        onClick={() => props.glazewm.runCommand('toggle-tiling-direction')}
        iconNode={
          props.glazewm?.tilingDirection === 'horizontal'
            ? icon('custom-split-horizontal')
            : icon('custom-split-vertical')
        }
      />
    </>
  );
}

function MediaChip(props: { media: any; mediaProvider: any }) {
  return (
    <Show when={props.media}>
      <div class="chip chip-media responsive-hide-sm">
        <IconBadge node={icon('nf-md-music_note')} tone="rose" />
        <div class="stacked media-copy">
          <span class="chip-label">
            {compactTitle(props.media?.title, 'No media')}
          </span>
          <span class="chip-detail">
            {compactTitle(props.media?.artist, props.media?.isPlaying ? 'Playing' : 'Idle')}
          </span>
        </div>
        <div class="inline-actions">
          <button
            class="icon-button"
            disabled={!props.media?.isPreviousEnabled}
            onClick={() =>
              props.mediaProvider?.previous({
                sessionId: props.media?.sessionId,
              })
            }
            title="Previous"
          >
            {icon('nf-md-skip_previous')}
          </button>
          <button
            class="icon-button"
            onClick={() =>
              props.mediaProvider?.togglePlayPause({
                sessionId: props.media?.sessionId,
              })
            }
            title="Play/Pause"
          >
            {props.media?.isPlaying
              ? icon('nf-md-pause')
              : icon('nf-md-play')}
          </button>
          <button
            class="icon-button"
            disabled={!props.media?.isNextEnabled}
            onClick={() =>
              props.mediaProvider?.next({
                sessionId: props.media?.sessionId,
              })
            }
            title="Next"
          >
            {icon('nf-md-skip_next')}
          </button>
        </div>
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
        <button
          class="chip-action"
          type="button"
          title={isMuted() ? 'Unmute audio' : 'Mute audio'}
          aria-label={isMuted() ? 'Unmute audio' : 'Mute audio'}
          onClick={() => void toggleMute()}
        >
          <IconBadge
            node={icon(isMuted() ? 'nf-md-volume_off' : 'nf-md-volume_high')}
            tone={isMuted() ? 'muted' : 'foam'}
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
    </Show>
  );
}

function NetworkChip(props: { network: any }) {
  const [downBps, setDownBps] = createSignal<number | null>(null);
  const [upBps, setUpBps] = createSignal<number | null>(null);
  const [todayDown, setTodayDown] = createSignal(0);
  const [todayUp, setTodayUp] = createSignal(0);

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
    if (!traffic?.totalReceived || !traffic?.totalTransmitted) {
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
        class="chip chip-network responsive-hide-md"
        title={props.network?.defaultInterface ? networkTitle(props.network) : 'Offline'}
      >
        <IconBadge node={networkIcon(props.network)} tone="pine" />
        <div class="stacked">
          <span class="chip-label network-line">
            {`↓ ${formatDataRate(downBps())} · ${formatDataAmount(todayDown())}`}
          </span>
          <span class="chip-detail network-line network-line-secondary">
            {`↑ ${formatDataRate(upBps())} · ${formatDataAmount(todayUp())}`}
          </span>
        </div>
      </div>
    </Show>
  );
}

function MemoryChip(props: { memory: any }) {
  return (
    <Show when={props.memory != null}>
      <div class="chip chip-metric chip-priority">
        <div class="metric-pill tone-iris" title={`Memory ${percent(props.memory?.usage)}`}>
          {icon('custom-memory')}
          <span>{percent(props.memory?.usage)}</span>
        </div>
      </div>
    </Show>
  );
}

function CpuChip(props: { cpu: any }) {
  return (
    <Show when={props.cpu != null}>
      <div class="chip chip-metric chip-priority responsive-hide-md">
        <div class="metric-pill tone-rose" title={`CPU ${percent(props.cpu?.usage)}`}>
          {icon('nf-oct-cpu')}
          <span>{percent(props.cpu?.usage)}</span>
        </div>
      </div>
    </Show>
  );
}

function BatteryChip(props: { battery: any }) {
  return (
    <Show when={props.battery != null}>
      <div class="chip chip-mini chip-priority">
        <IconBadge node={batteryIcon(props.battery)} tone="foam" />
        <div class="stacked">
          <span class="chip-label">{batteryStatusText(props.battery)}</span>
          <span class="chip-detail">{batteryDetail(props.battery)}</span>
        </div>
      </div>
    </Show>
  );
}

function SystrayStrip(props: { systray: any }) {
  const [isOpen, setIsOpen] = createSignal(false);
  let rootRef: HTMLDivElement | undefined;

  const allIcons = createMemo(() => props.systray?.icons ?? []);

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
            class="tray-overflow-button"
            type="button"
            title={`Show ${allIcons().length} tray icons`}
            aria-label={`Show ${allIcons().length} tray icons`}
            onClick={() => setIsOpen(open => !open)}
          >
            {icon('custom-tray')}
            <span class="tray-overflow-count">{`+${allIcons().length}`}</span>
          </button>
        <Show when={isOpen()}>
          <div class="tray-popover">
            <For each={allIcons()}>
              {(trayIcon: any) => (
                <TrayIconButton systray={props.systray} trayIcon={trayIcon} />
              )}
            </For>
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

function ChipActionControl(props: {
  tone: Tone;
  title: string;
  ariaLabel: string;
  iconNode: any;
  onClick: () => void;
  class?: string;
}) {
  return (
    <div class={`chip chip-control ${props.class ?? ''}`.trim()}>
      <button
        class="chip-action"
        type="button"
        title={props.title}
        aria-label={props.ariaLabel}
        onClick={props.onClick}
      >
        <IconBadge node={props.iconNode} tone={props.tone} />
      </button>
    </div>
  );
}

function IconBadge(props: { node: any; tone: Tone }) {
  return <span class={`icon-badge tone-${props.tone}`}>{props.node}</span>;
}

function bindingModeIcon(mode: any) {
  const value = String(mode?.displayName ?? mode?.name ?? '').toLowerCase();

  if (value.includes('resize')) {
    return icon('custom-resize-mode');
  }

  return icon('nf-md-key_variant');
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
