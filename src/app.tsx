import * as zebar from 'zebar';
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { icon, networkIcon, weatherIcon } from './icons';
import type { Variant } from './providers';
import {
  clamp,
  formatDataAmountParts,
  formatDataRateParts,
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

function isGlazeWorkspaceOccupied(workspace: {
  children?: Array<unknown> | null;
}) {
  return Boolean(workspace.children?.length);
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
  const audio = () => output.audio?.defaultPlaybackDevice;
  const weather = () => output.weather;
  const date = () => output.date?.formatted ?? '';

  function renderLeftZone() {
    if (props.variant === 'with-glazewm') {
      return (
        <>
          <BrandChip accent="iris" class="responsive-hide-md" />
          <Show when={glaze()}>
            <div class="chip chip-left-context segmented-cluster">
              <GlazeWorkspaceStrip glazewm={glaze()} />
              <SummaryChip
                class="responsive-hide-sm chip-context-summary"
                iconNode={icon('nf-md-application_outline')}
                label={glazeFocusedLabel(glaze())}
                detail={glazeFocusedDetail(glaze())}
                tone="iris"
              />
              <WmControlStrip glazewm={glaze()} />
            </div>
          </Show>
        </>
      );
    }

    if (props.variant === 'with-komorebi') {
      return (
        <>
          <BrandChip accent="foam" class="responsive-hide-md" />
          <Show when={komorebi()}>
            <div class="chip chip-left-context segmented-cluster">
              <KomorebiWorkspaceStrip komorebi={komorebi()} />
              <SummaryChip
                class="responsive-hide-sm chip-context-summary"
                iconNode={icon('nf-md-view_dashboard')}
                label={`Workspace ${workspaceLabel(komorebi().focusedWorkspace ?? {})}`}
                detail={komorebiWorkspaceDetail(komorebi())}
                tone="foam"
              />
            </div>
          </Show>
        </>
      );
    }

    return <BrandChip accent="rose" class="responsive-hide-md" />;
  }

  function renderRightZone() {
    return (
      <div class="chip chip-right-cluster segmented-cluster">
        <CpuMemoryChip cpu={output.cpu} memory={output.memory} />
        <NetworkChip network={output.network} />
        <SystrayStrip systray={output.systray} />
        <AudioChip audio={audio()} audioProvider={output.audio} />
        <WeatherChip weather={weather()} />
        <DateTimeChip value={date()} />
      </div>
    );
  }

  return (
    <div class="bar-shell">
      <div class="bar-rail" aria-hidden="true" />
      <div class="bar-grid">
        <div class="zone zone-left cluster-host">{renderLeftZone()}</div>
        <div class="zone zone-right cluster-host">{renderRightZone()}</div>
      </div>
    </div>
  );
}

function BrandChip(props: {
  accent: 'iris' | 'foam' | 'rose';
  class?: string;
}) {
  return (
    <div class={`chip chip-brand chip-accent-${props.accent} ${props.class ?? ''}`.trim()}>
      <div class="chip-body chip-body-brand">
        <button
          class="brand-mark brand-trigger"
          type="button"
          title="Brand action"
          aria-label="Brand action"
          onClick={() => undefined}
        >
          <IconBadge node={icon('custom-tulip')} tone="rose" />
        </button>
      </div>
    </div>
  );
}

function SummaryChip(props: {
  class?: string;
  iconNode: any;
  label: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div class={`chip chip-summary ${props.class ?? ''}`.trim()}>
      <div class="chip-body chip-body-fill">
        <IconBadge node={props.iconNode} tone={props.tone} />
        <div class="stacked">
          <span class="chip-label">{props.label}</span>
          <span class="chip-detail">{props.detail}</span>
        </div>
      </div>
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

function GlazeWorkspaceStrip(props: { glazewm: any }) {
  const [recentWorkspaceName, setRecentWorkspaceName] = createSignal<
    string | null
  >(null);
  let lastFocusedWorkspaceName: string | null = null;

  createEffect(() => {
    const focusedWorkspaceName = props.glazewm?.focusedWorkspace?.name ?? null;

    if (!focusedWorkspaceName) {
      return;
    }

    if (
      lastFocusedWorkspaceName &&
      lastFocusedWorkspaceName !== focusedWorkspaceName
    ) {
      setRecentWorkspaceName(lastFocusedWorkspaceName);
    }

    lastFocusedWorkspaceName = focusedWorkspaceName;
  });

  const isRecentWorkspace = (workspace: { name?: string | null }) =>
    Boolean(
      workspace.name &&
        workspace.name === recentWorkspaceName() &&
        workspace.name !== props.glazewm?.focusedWorkspace?.name,
    );

  const glazeWorkspaceLabel = (workspace: any) =>
    `${workspaceLabel(workspace)} workspace ${
      isGlazeWorkspaceOccupied(workspace) ? 'occupied' : 'empty'
    }${isRecentWorkspace(workspace) ? ', recent target' : ''}`;

  return (
    <Show when={props.glazewm?.currentWorkspaces?.length}>
      <WorkspaceStripChip>
        <For each={props.glazewm.currentWorkspaces}>
          {(workspace: any, index) => (
            <button
              class={`workspace-pill ${
                isGlazeWorkspaceOccupied(workspace) ? 'occupied' : 'empty'
              } ${isRecentWorkspace(workspace) ? 'recent' : ''} ${
                workspace.hasFocus ? 'focused' : ''
              } ${
                workspace.isDisplayed ? 'displayed' : ''
              }`}
              style={{ '--workspace-accent': workspaceAccentVar(index()) }}
              onClick={() =>
                props.glazewm.runCommand(`focus --workspace ${workspace.name}`)
              }
              title={glazeWorkspaceLabel(workspace)}
              aria-label={glazeWorkspaceLabel(workspace)}
            >
              <span class="workspace-dot" />
            </button>
          )}
        </For>
      </WorkspaceStripChip>
    </Show>
  );
}

function KomorebiWorkspaceStrip(props: { komorebi: any }) {
  return (
    <Show when={props.komorebi?.currentWorkspaces?.length}>
      <WorkspaceStripChip>
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
      </WorkspaceStripChip>
    </Show>
  );
}

function WorkspaceStripChip(props: { children: any }) {
  return (
    <div class="chip chip-left-workspaces">
      <div class="chip-body chip-left-workspaces-body">
        <div class="workspace-strip">{props.children}</div>
      </div>
    </div>
  );
}

function WmControlStrip(props: { glazewm: any }) {
  const activeBindingMode = () => props.glazewm?.bindingModes?.[0];
  const paused = () => Boolean(props.glazewm?.isPaused);
  const tilingDirection = () => props.glazewm?.tilingDirection;

  const tone = () => {
    if (paused()) {
      return 'gold';
    }

    if (activeBindingMode()) {
      return 'foam';
    }

    return 'iris';
  };

  const title = () => {
    if (paused()) {
      return 'GlazeWM Pause Mode Active';
    }

    if (activeBindingMode()) {
      return bindingModeIndicatorLabel(activeBindingMode());
    }

    return tilingDirectionIndicatorLabel(props.glazewm);
  };

  const iconNode = () => {
    if (paused()) {
      return icon('nf-md-pause_circle');
    }

    if (activeBindingMode()) {
      return bindingModeIcon(activeBindingMode());
    }

    return tilingDirection() === 'horizontal'
      ? icon('custom-split-horizontal')
      : icon('custom-split-vertical');
  };

  const onClick = () => {
    if (paused()) {
      props.glazewm.runCommand('wm-toggle-pause');
      return;
    }

    if (activeBindingMode()) {
      props.glazewm.runCommand(
        `wm-disable-binding-mode --name ${activeBindingMode().name}`,
      );
      return;
    }

    props.glazewm.runCommand('toggle-tiling-direction');
  };

  return (
    <ControlActionChip
      tone={tone()}
      title={title()}
      ariaLabel={title()}
      onClick={onClick}
      iconNode={iconNode()}
    />
  );
}

async function openTaskManager() {
  try {
    await zebar.shellSpawn('Taskmgr.exe');
  } catch (error) {
    console.error('Failed to launch Taskmgr.exe', error);
  }
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
            node={icon('nf-md-application_outline')}
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

function ControlActionButton(props: {
  tone: Tone;
  title: string;
  ariaLabel: string;
  iconNode: any;
  onClick: () => void;
  class?: string;
}) {
  return (
    <button
      class={`chip-action ${props.class ?? ''}`.trim()}
      type="button"
      title={props.title}
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      <IconBadge node={props.iconNode} tone={props.tone} />
    </button>
  );
}

function ControlActionChip(props: {
  tone: Tone;
  title: string;
  ariaLabel: string;
  iconNode: any;
  onClick: () => void;
  class?: string;
}) {
  return (
    <div class={`chip chip-left-control ${props.class ?? ''}`.trim()}>
      <div class="chip-body chip-left-control-body">
        <ControlActionButton
          tone={props.tone}
          title={props.title}
          ariaLabel={props.ariaLabel}
          iconNode={props.iconNode}
          onClick={props.onClick}
        />
      </div>
    </div>
  );
}

function IconBadge(props: { node: any; tone: Tone; class?: string }) {
  return (
    <span class={`icon-badge tone-${props.tone} ${props.class ?? ''}`.trim()}>
      {props.node}
    </span>
  );
}

function bindingModeIcon(mode: any) {
  const value = String(mode?.displayName ?? mode?.name ?? '').toLowerCase();

  if (value.includes('resize')) {
    return icon('custom-resize-mode');
  }

  return icon('nf-md-key_variant');
}

function tilingDirectionIndicatorLabel(glazewm: any) {
  return glazewm?.tilingDirection === 'horizontal'
    ? 'Horizontal Tiling Direction Active'
    : 'Vertical Tiling Direction Active';
}

function bindingModeIndicatorLabel(mode: any) {
  const raw = String(mode?.displayName ?? mode?.name ?? '').trim();
  if (!raw) {
    return 'Binding Mode Active';
  }

  const normalized = raw
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());

  return normalized.toLowerCase().endsWith(' mode')
    ? `${normalized} Active`
    : `${normalized} Mode Active`;
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
