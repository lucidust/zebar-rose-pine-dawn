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
import { useProviderOutput } from './app/use-provider-output';
import { BarShell } from './components/bar/BarShell';
import {
  ControlActionChip,
  IconBadge,
  StatusIconChip,
  SummaryChip,
  WorkspaceStripChip,
  type Tone,
} from './components/chips';
import { icon, networkIcon, weatherIcon } from './icons';
import type { Variant } from './providers';
import {
  clamp,
  formatDataAmountParts,
  formatDataRateParts,
  glazeFocusedContainerDetail,
  glazeFocusedContainerLabel,
  komorebiLayoutLabel,
  komorebiWindowDetail,
  komorebiWindowLabel,
  komorebiWorkspaceDetail,
  percent,
  weatherLabel,
  workspaceLabel,
} from './utils/formatters';

type AppProps = {
  providers: any;
  variant: Variant;
  includeLiveSystemStats: boolean;
};

type FocusWindowState = 'none' | 'tiling' | 'floating' | 'fullscreen' | 'minimized';
type KomorebiFocusState =
  | 'empty'
  | 'tiling-disabled'
  | 'tiling'
  | 'stack'
  | 'floating'
  | 'maximized'
  | 'monocle';

type GlazeIpcMessage = {
  messageType?: string;
  clientMessage?: string;
  data?: any;
};

const FOCUS_STATE_POLL_INTERVAL = 500;
const KOMOREBI_STATE_POLL_INTERVAL = 750;
const KOMOREBI_STATE_CHANNEL = 'zebar-rose-pine-dawn-komorebi-state';
const KOMOREBI_STATE_DISCOVERY_WINDOW = 220;
const KOMOREBI_STATE_CLAIM_WINDOW = 80;
const KOMOREBI_STATE_LEADER_TIMEOUT = 2_500;
const KOMOREBI_STATE_HEARTBEAT_INTERVAL = 1_000;
const KOMOREBI_LAYOUT_CYCLE = [
  { state: 'bsp', command: 'bsp' },
  { state: 'columns', command: 'columns' },
  { state: 'rows', command: 'rows' },
  { state: 'vertical_stack', command: 'vertical-stack' },
  { state: 'horizontal_stack', command: 'horizontal-stack' },
  { state: 'ultrawide_vertical_stack', command: 'ultrawide-vertical-stack' },
  { state: 'grid', command: 'grid' },
  { state: 'right_main_vertical_stack', command: 'right-main-vertical-stack' },
] as const;

type KomorebiStateChannelMessage =
  | {
      type: 'hello' | 'claim' | 'heartbeat' | 'refresh-request';
      instanceId: string;
      timestamp: number;
    }
  | {
      type: 'state';
      instanceId: string;
      timestamp: number;
      rawState: unknown;
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

function workspaceAccentVar(index: number) {
  return `var(--ws-${(index % 6) + 1})`;
}

function isGlazeWorkspaceOccupied(workspace: {
  children?: Array<unknown> | null;
}) {
  return Boolean(workspace.children?.length);
}

function isKomorebiWorkspaceOccupied(workspace: any) {
  return Boolean(
    workspace?.tilingContainers?.length ||
      workspace?.floatingWindows?.length ||
      workspace?.maximizedWindow ||
      workspace?.monocleContainer,
  );
}

export function App(props: AppProps) {
  const output = useProviderOutput(props.providers);

  const glaze = () => output.glazewm;
  const [komorebiRefreshNonce, setKomorebiRefreshNonce] = createSignal(0);
  const polledKomorebi = usePolledKomorebiState(
    props.variant === 'with-komorebi',
    () => output.komorebi,
    komorebiRefreshNonce,
  );
  const komorebi = () => polledKomorebi() ?? output.komorebi;
  const refreshKomorebiState = () => setKomorebiRefreshNonce(value => value + 1);
  const audio = () => output.audio?.defaultPlaybackDevice;
  const weather = () => output.weather;
  const date = () => output.date?.formatted ?? '';
  const polledGlazeFocusedContainer = usePolledGlazeFocusedContainer(
    props.variant === 'with-glazewm',
  );
  const glazeFocusedContainer = () => {
    const polledFocused = polledGlazeFocusedContainer();
    return polledFocused === undefined
      ? glaze()?.focusedContainer
      : polledFocused;
  };

  function renderLeftZone() {
    if (props.variant === 'with-glazewm') {
      return (
        <Show when={glaze()}>
          <div class="chip chip-left-context segmented-cluster">
            <GlazeWorkspaceStrip glazewm={glaze()} />
            <WmControlStrip glazewm={glaze()} />
            <FocusWindowStateChip focusedContainer={glazeFocusedContainer()} />
            <SummaryChip
              class="responsive-hide-sm chip-context-summary"
              iconNode={icon('nf-md-application_outline')}
              label={glazeFocusedContainerLabel(glazeFocusedContainer())}
              detail={glazeFocusedContainerDetail(
                glazeFocusedContainer(),
                glaze(),
              )}
              tone="iris"
            />
          </div>
        </Show>
      );
    }

    if (props.variant === 'with-komorebi') {
      return (
        <Show when={komorebi()}>
          <div class="chip chip-left-context segmented-cluster">
            <KomorebiWorkspaceStrip
              komorebi={komorebi()}
              onRequestStateRefresh={refreshKomorebiState}
            />
            <KomorebiLayoutControlChip
              komorebi={komorebi()}
              onRequestStateRefresh={refreshKomorebiState}
            />
            <KomorebiFocusStateChip komorebi={komorebi()} />
            <SummaryChip
              class="responsive-hide-sm chip-context-summary"
              iconNode={komorebiFocusedSummaryIcon(komorebi())}
              label={komorebiFocusedSummaryLabel(komorebi())}
              detail={komorebiFocusedSummaryDetail(komorebi())}
              tone="foam"
            />
          </div>
        </Show>
      );
    }

    return null;
  }

  function renderRightZone() {
    return (
      <div class="chip chip-right-cluster segmented-cluster">
        <Show when={props.includeLiveSystemStats}>
          <CpuMemoryChip cpu={output.cpu} memory={output.memory} />
          <NetworkChip network={output.network} />
        </Show>
        <SystrayStrip systray={output.systray} />
        <AudioChip audio={audio()} audioProvider={output.audio} />
        <Show when={props.includeLiveSystemStats}>
          <NightLightChip />
        </Show>
        <WeatherChip weather={weather()} />
        <DateTimeChip value={date()} />
      </div>
    );
  }

  return <BarShell left={renderLeftZone()} right={renderRightZone()} />;
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

function KomorebiWorkspaceStrip(props: {
  komorebi: any;
  onRequestStateRefresh: () => void;
}) {
  const komorebiWorkspaceTitle = (workspace: any, workspaceIndex: number) =>
    `${komorebiWorkspaceLabel(workspace, workspaceIndex)} workspace ${
      isKomorebiWorkspaceOccupied(workspace) ? 'occupied' : 'empty'
    }`;

  return (
    <Show when={props.komorebi?.currentWorkspaces?.length}>
      <WorkspaceStripChip>
        <For each={props.komorebi.currentWorkspaces}>
          {(workspace: any, index) => (
            <button
              class={`workspace-pill ${
                isKomorebiWorkspaceOccupied(workspace) ? 'occupied' : 'empty'
              } ${
                isKomorebiFocusedWorkspace(props.komorebi, index())
                  ? 'focused'
                  : ''
              } ${
                isKomorebiDisplayedWorkspace(props.komorebi, index())
                  ? 'displayed'
                  : ''
              }`}
              style={{ '--workspace-accent': workspaceAccentVar(index()) }}
              title={komorebiWorkspaceTitle(workspace, index())}
              aria-label={komorebiWorkspaceTitle(workspace, index())}
              onClick={() =>
                void focusKomorebiWorkspace(props.komorebi, index()).then(
                  props.onRequestStateRefresh,
                )
              }
            >
              <span class="workspace-dot" />
            </button>
          )}
        </For>
      </WorkspaceStripChip>
    </Show>
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

function KomorebiLayoutControlChip(props: {
  komorebi: any;
  onRequestStateRefresh: () => void;
}) {
  const layout = () => komorebiBarWorkspace(props.komorebi)?.layout;
  const layoutLabel = () => komorebiLayoutLabel(layout());
  const title = () => `${layoutLabel()} Layout Active, cycle layout`;

  return (
    <ControlActionChip
      tone="iris"
      title={title()}
      ariaLabel={title()}
      onClick={() =>
        void cycleKomorebiLayout(props.komorebi).then(
          props.onRequestStateRefresh,
        )
      }
      iconNode={komorebiLayoutIcon(layout())}
    />
  );
}

function KomorebiFocusStateChip(props: { komorebi: any }) {
  const focusState = createMemo(() =>
    komorebiFocusState(komorebiBarWorkspace(props.komorebi)),
  );
  const metadata = createMemo(() =>
    komorebiFocusStateMetadata(focusState()),
  );

  return (
    <StatusIconChip
      class="chip-focus-state"
      tone={metadata().tone}
      title={metadata().title}
      ariaLabel={metadata().title}
      iconNode={icon(metadata().icon)}
    />
  );
}

async function runKomorebic(args: string[]) {
  try {
    const result = await zebar.shellExec('komorebic.exe', args);

    if (result.code !== 0) {
      throw new Error(result.stderr || `exit code ${result.code}`);
    }

    return result.stdout;
  } catch (error) {
    console.error('Failed to run komorebic.exe', args, error);
    return null;
  }
}

async function cycleKomorebiLayout(komorebi: any) {
  const workspaceIndex = komorebiBarWorkspaceIndex(komorebi);
  const nextLayout = nextKomorebiLayoutCommand(
    komorebiBarWorkspace(komorebi)?.layout,
  );

  await runKomorebic([
    'workspace-layout',
    String(komorebiCurrentMonitorIndex(komorebi)),
    String(workspaceIndex),
    nextLayout,
  ]);
}

function focusKomorebiWorkspace(komorebi: any, workspaceIndex: number) {
  const monitorIndex = komorebiCurrentMonitorIndex(komorebi);

  return runKomorebic([
    'focus-monitor-workspace',
    String(monitorIndex),
    String(workspaceIndex),
  ]);
}

function nextKomorebiLayoutCommand(layout: string | null | undefined) {
  const currentLayoutIndex = KOMOREBI_LAYOUT_CYCLE.findIndex(
    candidate => candidate.state === normalizeKomorebiLayoutValue(layout),
  );
  const nextLayoutIndex =
    currentLayoutIndex === -1
      ? 0
      : (currentLayoutIndex + 1) % KOMOREBI_LAYOUT_CYCLE.length;

  return KOMOREBI_LAYOUT_CYCLE[nextLayoutIndex].command;
}

function komorebiCurrentMonitorIndex(komorebi: any) {
  const allMonitors = komorebi?.allMonitors ?? [];
  const currentMonitor = komorebi?.currentMonitor;
  const index = allMonitors.findIndex((monitor: any) =>
    isSameKomorebiMonitor(monitor, currentMonitor),
  );

  return Math.max(0, index);
}

function komorebiBarWorkspaceIndex(komorebi: any) {
  return komorebi?.currentMonitor?.focusedWorkspaceIndex ?? 0;
}

function komorebiBarWorkspace(komorebi: any) {
  return (
    komorebi?.currentWorkspaces?.[komorebiBarWorkspaceIndex(komorebi)] ??
    komorebi?.displayedWorkspace ??
    komorebi?.focusedWorkspace
  );
}

function isKomorebiDisplayedWorkspace(komorebi: any, workspaceIndex: number) {
  return komorebi?.currentMonitor?.focusedWorkspaceIndex === workspaceIndex;
}

function isKomorebiFocusedWorkspace(komorebi: any, workspaceIndex: number) {
  return (
    isSameKomorebiMonitor(komorebi?.currentMonitor, komorebi?.focusedMonitor) &&
    komorebi?.focusedMonitor?.focusedWorkspaceIndex === workspaceIndex
  );
}

function komorebiWorkspaceLabel(workspace: any, workspaceIndex: number) {
  const label = workspaceLabel(workspace);

  return label === '?' ? String(workspaceIndex + 1) : label;
}

function komorebiBarWorkspaceLabel(komorebi: any) {
  const label = workspaceLabel(komorebiBarWorkspace(komorebi) ?? {});

  if (label !== '?') {
    return label;
  }

  return String(komorebiBarWorkspaceIndex(komorebi) + 1);
}

function isSameKomorebiMonitor(a: any, b: any) {
  if (!a || !b) {
    return false;
  }

  return (
    a === b ||
    (a.id != null && a.id === b.id) ||
    (a.deviceId && a.deviceId === b.deviceId) ||
    (a.name && a.name === b.name)
  );
}

function normalizeKomorebiState(rawState: any, baseKomorebi: any) {
  const rawMonitors = rawState?.monitors?.elements;

  if (!Array.isArray(rawMonitors) || !rawMonitors.length) {
    return null;
  }

  const allMonitors = rawMonitors.map(normalizeKomorebiMonitor);
  const focusedMonitorIndex = clamp(
    rawState?.monitors?.focused ?? 0,
    0,
    allMonitors.length - 1,
  );
  const currentMonitorIndex = komorebiCurrentMonitorIndexFromList(
    allMonitors,
    baseKomorebi?.currentMonitor,
    focusedMonitorIndex,
  );
  const currentMonitor = allMonitors[currentMonitorIndex];
  const focusedMonitor = allMonitors[focusedMonitorIndex];
  const displayedWorkspace =
    currentMonitor.workspaces[currentMonitor.focusedWorkspaceIndex];
  const focusedWorkspace =
    focusedMonitor.workspaces[focusedMonitor.focusedWorkspaceIndex];

  return {
    displayedWorkspace,
    focusedWorkspace,
    currentWorkspaces: currentMonitor.workspaces,
    allWorkspaces: allMonitors.flatMap((monitor: any) => monitor.workspaces),
    allMonitors,
    focusedMonitor,
    currentMonitor,
  };
}

function komorebiCurrentMonitorIndexFromList(
  monitors: any[],
  currentMonitor: any,
  fallbackIndex: number,
) {
  const index = monitors.findIndex(monitor =>
    isSameKomorebiMonitor(monitor, currentMonitor),
  );

  return index === -1 ? fallbackIndex : index;
}

function normalizeKomorebiMonitor(rawMonitor: any) {
  const rawWorkspaces = rawMonitor?.workspaces?.elements ?? [];
  const workspaces = rawWorkspaces.map(normalizeKomorebiWorkspace);
  const focusedWorkspaceIndex = clamp(
    rawMonitor?.workspaces?.focused ?? 0,
    0,
    Math.max(workspaces.length - 1, 0),
  );

  return {
    id: rawMonitor?.id,
    device: rawMonitor?.device ?? null,
    deviceId: rawMonitor?.device_id ?? rawMonitor?.deviceId,
    focusedWorkspaceIndex,
    name: rawMonitor?.name ?? null,
    size: rawMonitor?.size,
    workAreaOffset: rawMonitor?.work_area_offset ?? rawMonitor?.workAreaOffset,
    workAreaSize: rawMonitor?.work_area_size ?? rawMonitor?.workAreaSize,
    workspaces,
  };
}

function normalizeKomorebiWorkspace(rawWorkspace: any) {
  const tilingContainers = (
    rawWorkspace?.containers?.elements ??
    rawWorkspace?.tilingContainers ??
    []
  ).map(normalizeKomorebiContainer);

  return {
    containerPadding:
      rawWorkspace?.container_padding ?? rawWorkspace?.containerPadding ?? null,
    floatingWindows: normalizeKomorebiWindowList(
      rawWorkspace?.floating_windows ?? rawWorkspace?.floatingWindows,
    ),
    focusedContainerIndex: clamp(
      rawWorkspace?.containers?.focused ??
        rawWorkspace?.focusedContainerIndex ??
        0,
      0,
      Math.max(tilingContainers.length - 1, 0),
    ),
    latestLayout: rawWorkspace?.latest_layout ?? rawWorkspace?.latestLayout ?? [],
    layout: normalizeKomorebiLayoutValue(rawWorkspace?.layout),
    layoutFlip: rawWorkspace?.layout_flip ?? rawWorkspace?.layoutFlip ?? null,
    maximizedWindow: normalizeKomorebiWindow(
      rawWorkspace?.maximized_window ?? rawWorkspace?.maximizedWindow,
    ),
    monocleContainer: rawWorkspace?.monocle_container
      ? normalizeKomorebiContainer(rawWorkspace.monocle_container)
      : rawWorkspace?.monocleContainer ?? null,
    name: rawWorkspace?.name ?? null,
    tile: rawWorkspace?.tile,
    tilingContainers,
    workspacePadding:
      rawWorkspace?.workspace_padding ?? rawWorkspace?.workspacePadding ?? null,
  };
}

function normalizeKomorebiContainer(rawContainer: any) {
  const rawWindows = rawContainer?.windows;
  const windows = normalizeKomorebiWindowList(rawWindows);

  return {
    id: rawContainer?.id,
    focusedWindowIndex: clamp(
      rawWindows?.focused ?? rawContainer?.focusedWindowIndex ?? 0,
      0,
      Math.max(windows.length - 1, 0),
    ),
    windows,
  };
}

function normalizeKomorebiWindowList(rawWindows: any) {
  const windows = Array.isArray(rawWindows)
    ? rawWindows
    : rawWindows?.elements ?? [];

  return windows.map(normalizeKomorebiWindow).filter(Boolean);
}

function normalizeKomorebiWindow(rawWindow: any) {
  if (!rawWindow) {
    return null;
  }

  return {
    id: rawWindow?.id ?? rawWindow?.hwnd ?? null,
    class: rawWindow?.class ?? null,
    exe: rawWindow?.exe ?? null,
    hwnd: rawWindow?.hwnd ?? null,
    title: rawWindow?.title ?? null,
    role: rawWindow?.role ?? null,
    subrole: rawWindow?.subrole ?? null,
    icon_path: rawWindow?.icon_path ?? null,
  };
}

function normalizeKomorebiLayoutValue(rawLayout: any) {
  const value =
    typeof rawLayout === 'string'
      ? rawLayout
      : rawLayout?.Default ?? rawLayout?.default ?? rawLayout;

  if (!value) {
    return null;
  }

  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll('-', '_')
    .toLowerCase();
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

function usePolledKomorebiState(
  enabled: boolean,
  baseKomorebi: () => any,
  refreshTrigger: () => number,
) {
  const instanceId = createKomorebiStateInstanceId();
  const [rawState, setRawState] = createSignal<unknown | undefined>(undefined);
  const [state, setState] = createSignal<any | undefined>(undefined);
  let channel: BroadcastChannel | null = null;
  let disposed = false;
  let isLeader = false;
  let queryInFlight = false;
  let candidates = new Set<string>();
  let knownLeaderId: string | null = null;
  let lastLeaderMessageAt = 0;
  let discoveryTimer: number | undefined;
  let claimTimer: number | undefined;
  let heartbeatTimer: number | undefined;
  let intervalId: number | undefined;
  let leaderTimeoutTimer: number | undefined;

  const postChannelMessage = (message: KomorebiStateChannelMessage) => {
    channel?.postMessage(message);
  };

  const clearLeaderTimers = () => {
    window.clearInterval(intervalId);
    window.clearInterval(heartbeatTimer);
    intervalId = undefined;
    heartbeatTimer = undefined;
  };

  const clearClaimTimer = () => {
    window.clearTimeout(claimTimer);
    claimTimer = undefined;
  };

  const sendHeartbeat = () => {
    postChannelMessage({
      type: 'heartbeat',
      instanceId,
      timestamp: Date.now(),
    });
  };

  const applyRawState = (nextRawState: unknown | undefined) => {
    if (!disposed) {
      setRawState(nextRawState);
    }
  };

  const refreshState = async () => {
    if (!enabled || disposed || queryInFlight) {
      return;
    }

    queryInFlight = true;

    try {
      const result = await zebar.shellExec('komorebic.exe', ['state']);

      if (result.code !== 0) {
        throw new Error(result.stderr || `exit code ${result.code}`);
      }

      const nextRawState = JSON.parse(result.stdout.trim());

      if (!disposed) {
        applyRawState(nextRawState);
        postChannelMessage({
          type: 'state',
          instanceId,
          timestamp: Date.now(),
          rawState: nextRawState,
        });
      }
    } catch (error) {
      if (!disposed) {
        applyRawState(undefined);
        postChannelMessage({
          type: 'state',
          instanceId,
          timestamp: Date.now(),
          rawState: undefined,
        });
      }
    } finally {
      queryInFlight = false;
    }
  };

  const becomeFollower = (leaderId: string) => {
    isLeader = false;
    knownLeaderId = leaderId;
    lastLeaderMessageAt = Date.now();
    clearClaimTimer();
    clearLeaderTimers();
  };

  const becomeLeader = () => {
    if (disposed) {
      return;
    }

    isLeader = true;
    knownLeaderId = instanceId;
    lastLeaderMessageAt = Date.now();
    clearClaimTimer();
    clearLeaderTimers();
    sendHeartbeat();
    void refreshState();
    intervalId = window.setInterval(
      () => void refreshState(),
      KOMOREBI_STATE_POLL_INTERVAL,
    );
    heartbeatTimer = window.setInterval(
      sendHeartbeat,
      KOMOREBI_STATE_HEARTBEAT_INTERVAL,
    );
  };

  const startLeaderClaim = () => {
    if (disposed || claimTimer != null) {
      return;
    }

    postChannelMessage({
      type: 'claim',
      instanceId,
      timestamp: Date.now(),
    });
    claimTimer = window.setTimeout(() => {
      claimTimer = undefined;
      becomeLeader();
    }, KOMOREBI_STATE_CLAIM_WINDOW);
  };

  const finishElection = () => {
    discoveryTimer = undefined;

    if (disposed) {
      return;
    }

    const leaderId = [...candidates].sort()[0] ?? instanceId;

    if (leaderId === instanceId) {
      startLeaderClaim();
    } else {
      becomeFollower(leaderId);
    }
  };

  const startElection = () => {
    if (disposed || discoveryTimer != null) {
      return;
    }

    isLeader = false;
    knownLeaderId = null;
    lastLeaderMessageAt = 0;
    clearClaimTimer();
    clearLeaderTimers();
    candidates = new Set([instanceId]);
    postChannelMessage({
      type: 'hello',
      instanceId,
      timestamp: Date.now(),
    });
    discoveryTimer = window.setTimeout(
      finishElection,
      KOMOREBI_STATE_DISCOVERY_WINDOW,
    );
  };

  const handleLeaderMessage = (leaderId: string) => {
    if (leaderId === instanceId) {
      return true;
    }

    candidates.add(leaderId);

    if (isLeader) {
      if (leaderId < instanceId) {
        becomeFollower(leaderId);
        return true;
      }

      sendHeartbeat();
      return false;
    }

    if (claimTimer != null) {
      if (leaderId < instanceId) {
        becomeFollower(leaderId);
        return true;
      }

      return false;
    }

    if (discoveryTimer != null) {
      return true;
    }

    const now = Date.now();
    const currentLeaderIsAlive =
      knownLeaderId != null &&
      now - lastLeaderMessageAt <= KOMOREBI_STATE_LEADER_TIMEOUT;

    if (currentLeaderIsAlive && knownLeaderId < leaderId) {
      return false;
    }

    knownLeaderId = leaderId;
    lastLeaderMessageAt = now;
    return true;
  };

  const handleClaimMessage = (claimantId: string) => {
    if (claimantId === instanceId) {
      return;
    }

    candidates.add(claimantId);

    if (discoveryTimer != null) {
      return;
    }

    if (isLeader) {
      if (claimantId < instanceId) {
        becomeFollower(claimantId);
        return;
      }

      sendHeartbeat();
      return;
    }

    if (claimTimer != null) {
      if (claimantId < instanceId) {
        becomeFollower(claimantId);
      }

      return;
    }

    const now = Date.now();
    const currentLeaderIsAlive =
      knownLeaderId != null &&
      now - lastLeaderMessageAt <= KOMOREBI_STATE_LEADER_TIMEOUT;

    if (currentLeaderIsAlive && knownLeaderId < claimantId) {
      return;
    }

    knownLeaderId = claimantId;
    lastLeaderMessageAt = now;
  };

  const handleChannelMessage = (message: unknown) => {
    if (!isKomorebiStateChannelMessage(message) || disposed) {
      return;
    }

    if (message.type === 'hello') {
      if (message.instanceId !== instanceId) {
        candidates.add(message.instanceId);
      }

      if (isLeader) {
        sendHeartbeat();
      }

      return;
    }

    if (message.type === 'claim') {
      handleClaimMessage(message.instanceId);
      return;
    }

    if (message.type === 'refresh-request') {
      if (isLeader && message.instanceId !== instanceId) {
        void refreshState();
      }

      return;
    }

    const shouldAcceptLeader = handleLeaderMessage(message.instanceId);

    if (message.type === 'state' && shouldAcceptLeader) {
      lastLeaderMessageAt = Date.now();
      applyRawState(message.rawState);
    }
  };

  const checkLeaderTimeout = () => {
    if (
      disposed ||
      isLeader ||
      discoveryTimer != null ||
      claimTimer != null ||
      Date.now() - lastLeaderMessageAt <= KOMOREBI_STATE_LEADER_TIMEOUT
    ) {
      return;
    }

    startElection();
  };

  const startLegacyPolling = () => {
    isLeader = true;
    void refreshState();
    intervalId = window.setInterval(
      () => void refreshState(),
      KOMOREBI_STATE_POLL_INTERVAL,
    );
  };

  createEffect(() => {
    const currentRawState = rawState();
    const currentBaseKomorebi = baseKomorebi();

    if (!enabled || currentRawState == null) {
      setState(undefined);
      return;
    }

    const normalizedState = normalizeKomorebiState(
      currentRawState,
      currentBaseKomorebi,
    );
    setState(normalizedState ?? undefined);
  });

  createEffect(() => {
    refreshTrigger();

    if (!enabled || disposed) {
      return;
    }

    if (isLeader) {
      void refreshState();
      return;
    }

    postChannelMessage({
      type: 'refresh-request',
      instanceId,
      timestamp: Date.now(),
    });
  });

  onMount(() => {
    if (!enabled) {
      return;
    }

    if (typeof BroadcastChannel === 'undefined') {
      startLegacyPolling();
    } else {
      channel = new BroadcastChannel(KOMOREBI_STATE_CHANNEL);
      channel.addEventListener('message', event =>
        handleChannelMessage(event.data),
      );
      leaderTimeoutTimer = window.setInterval(checkLeaderTimeout, 500);
      startElection();
    }

    onCleanup(() => {
      disposed = true;
      window.clearTimeout(discoveryTimer);
      clearClaimTimer();
      window.clearInterval(leaderTimeoutTimer);
      clearLeaderTimers();
      channel?.close();
      channel = null;
    });
  });

  return state;
}

function createKomorebiStateInstanceId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

function isKomorebiStateChannelMessage(
  message: unknown,
): message is KomorebiStateChannelMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<KomorebiStateChannelMessage>;

  return (
    typeof candidate.type === 'string' &&
    typeof candidate.instanceId === 'string' &&
    typeof candidate.timestamp === 'number' &&
    ['hello', 'claim', 'heartbeat', 'refresh-request', 'state'].includes(
      candidate.type,
    )
  );
}

function usePolledGlazeFocusedContainer(enabled: boolean) {
  const [focusedContainer, setFocusedContainer] = createSignal<
    any | null | undefined
  >(undefined);
  let socket: WebSocket | null = null;
  let pollInterval: number | undefined;
  let queryInFlight = false;
  let disposed = false;

  const applyFocusedContainer = (focused: any) => {
    if (disposed) {
      return;
    }

    setFocusedContainer(focused ?? null);
  };

  const queryFocusedContainer = () => {
    if (queryInFlight || socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    queryInFlight = true;
    socket.send('query focused');
  };

  onMount(() => {
    if (!enabled) {
      return;
    }

    socket = new WebSocket('ws://localhost:6123');

    socket.addEventListener('open', () => {
      queryFocusedContainer();
      pollInterval = window.setInterval(
        queryFocusedContainer,
        FOCUS_STATE_POLL_INTERVAL,
      );
    });

    socket.addEventListener('message', event => {
      const message = parseGlazeIpcMessage(event.data);

      if (!message) {
        return;
      }

      if (
        message.messageType === 'client_response' &&
        message.clientMessage === 'query focused'
      ) {
        queryInFlight = false;
        applyFocusedContainer(message.data?.focused);
      }
    });

    socket.addEventListener('error', () => {
      queryInFlight = false;
    });

    socket.addEventListener('close', () => {
      queryInFlight = false;
    });

    onCleanup(() => {
      disposed = true;
      window.clearInterval(pollInterval);

      socket?.close();
      socket = null;
    });
  });

  return focusedContainer;
}

function FocusWindowStateChip(props: { focusedContainer: any }) {
  const windowState = createMemo(() =>
    normalizeFocusWindowState(props.focusedContainer?.state?.type),
  );
  const metadata = createMemo(() => focusWindowStateMetadata(windowState()));

  return (
    <StatusIconChip
      class="chip-focus-state"
      tone={metadata().tone}
      title={metadata().title}
      ariaLabel={metadata().title}
      iconNode={icon(metadata().icon)}
    />
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

function bindingModeIcon(mode: any) {
  const value = String(mode?.displayName ?? mode?.name ?? '').toLowerCase();

  if (value.includes('resize')) {
    return icon('custom-resize-mode');
  }

  return icon('nf-md-key_variant');
}

function normalizeFocusWindowState(value: unknown): FocusWindowState {
  switch (value) {
    case 'tiling':
    case 'floating':
    case 'fullscreen':
    case 'minimized':
      return value;
    default:
      return 'none';
  }
}

function focusWindowStateMetadata(state: FocusWindowState): {
  icon: string;
  title: string;
  tone: Tone;
} {
  switch (state) {
    case 'tiling':
      return {
        icon: 'custom-focus-tiling',
        title: 'Focused Window Tiling',
        tone: 'muted',
      };
    case 'floating':
      return {
        icon: 'custom-focus-floating',
        title: 'Focused Window Floating',
        tone: 'pine',
      };
    case 'fullscreen':
      return {
        icon: 'custom-focus-fullscreen',
        title: 'Focused Window Fullscreen',
        tone: 'foam',
      };
    case 'minimized':
      return {
        icon: 'custom-focus-minimized',
        title: 'Focused Window Minimized',
        tone: 'rose',
      };
    case 'none':
      return {
        icon: 'custom-focus-none',
        title: 'Workspace Focus Active',
        tone: 'muted',
      };
  }
}

function komorebiFocusedSummaryIcon(komorebi: any) {
  return komorebiFocusedWindow(komorebiBarWorkspace(komorebi))
    ? icon('nf-md-application_outline')
    : icon('nf-md-view_dashboard');
}

function komorebiFocusedSummaryLabel(komorebi: any) {
  const focusedWorkspace = komorebiBarWorkspace(komorebi);
  const focusedWindow = komorebiFocusedWindow(focusedWorkspace);

  if (focusedWindow) {
    return komorebiWindowLabel(focusedWindow);
  }

  return `Workspace ${komorebiBarWorkspaceLabel(komorebi)}`;
}

function komorebiFocusedSummaryDetail(komorebi: any) {
  const focusedWorkspace = komorebiBarWorkspace(komorebi);

  if (!focusedWorkspace) {
    return '';
  }

  const state = komorebiFocusState(focusedWorkspace);
  const focusedWindow = komorebiFocusedWindow(focusedWorkspace);
  const detailParts = [
    komorebiWindowDetail(focusedWindow, ''),
    komorebiFocusStateDetail(focusedWorkspace, state),
  ].filter(Boolean);

  if (detailParts.length) {
    return detailParts.join(' · ');
  }

  return komorebiWorkspaceDetail(komorebi) || 'Empty';
}

function komorebiFocusedTilingContainer(workspace: any) {
  const containers = workspace?.tilingContainers ?? [];

  if (!containers.length) {
    return null;
  }

  const focusedContainerIndex = clamp(
    workspace?.focusedContainerIndex ?? 0,
    0,
    containers.length - 1,
  );

  return containers[focusedContainerIndex] ?? null;
}

function komorebiFocusedWindow(workspace: any) {
  if (!workspace) {
    return null;
  }

  if (workspace.maximizedWindow) {
    return workspace.maximizedWindow;
  }

  const monocleWindows = workspace.monocleContainer?.windows ?? [];
  if (monocleWindows.length) {
    return monocleWindows[
      clamp(
        workspace.monocleContainer?.focusedWindowIndex ?? 0,
        0,
        monocleWindows.length - 1,
      )
    ];
  }

  const focusedContainer = komorebiFocusedTilingContainer(workspace);
  if (focusedContainer?.windows?.length) {
    return focusedContainer.windows[
      clamp(
        focusedContainer.focusedWindowIndex ?? 0,
        0,
        focusedContainer.windows.length - 1,
      )
    ];
  }

  return workspace.floatingWindows?.[0] ?? null;
}

function komorebiFocusState(workspace: any): KomorebiFocusState {
  if (!workspace) {
    return 'empty';
  }

  if (workspace.maximizedWindow) {
    return 'maximized';
  }

  if (workspace.monocleContainer?.windows?.length) {
    return 'monocle';
  }

  const focusedContainer = komorebiFocusedTilingContainer(workspace);
  const focusedContainerWindowCount = focusedContainer?.windows?.length ?? 0;

  if (focusedContainerWindowCount > 1) {
    return 'stack';
  }

  if (focusedContainerWindowCount === 1) {
    return 'tiling';
  }

  if (workspace.tile === false) {
    return 'tiling-disabled';
  }

  if (workspace.floatingWindows?.length) {
    return 'floating';
  }

  return 'empty';
}

function komorebiFocusStateMetadata(state: KomorebiFocusState): {
  icon: string;
  title: string;
  tone: Tone;
} {
  switch (state) {
    case 'tiling-disabled':
      return {
        icon: 'custom-focus-floating',
        title: 'Workspace Tiling Disabled',
        tone: 'gold',
      };
    case 'tiling':
      return {
        icon: 'custom-focus-tiling',
        title: 'Focused Container Tiling',
        tone: 'muted',
      };
    case 'stack':
      return {
        icon: 'custom-tray',
        title: 'Focused Container Stack',
        tone: 'iris',
      };
    case 'floating':
      return {
        icon: 'custom-focus-floating',
        title: 'Floating Window Focus',
        tone: 'pine',
      };
    case 'maximized':
      return {
        icon: 'custom-focus-fullscreen',
        title: 'Focused Window Maximized',
        tone: 'foam',
      };
    case 'monocle':
      return {
        icon: 'custom-focus-fullscreen',
        title: 'Focused Container Monocle',
        tone: 'foam',
      };
    case 'empty':
      return {
        icon: 'custom-focus-none',
        title: 'Workspace Focus Active',
        tone: 'muted',
      };
  }
}

function komorebiFocusStateDetail(
  workspace: any,
  state: KomorebiFocusState,
) {
  switch (state) {
    case 'tiling-disabled':
      return 'Tiling Off';
    case 'stack': {
      const count = komorebiFocusedTilingContainer(workspace)?.windows?.length ?? 0;
      return `Stack ${count}`;
    }
    case 'tiling':
      return komorebiLayoutLabel(workspace?.layout);
    case 'floating':
      return 'Floating';
    case 'maximized':
      return 'Maximized';
    case 'monocle':
      return 'Monocle';
    case 'empty':
      return 'Empty';
  }
}

function komorebiLayoutIcon(layout: string | null | undefined) {
  switch (layout) {
    case 'rows':
    case 'horizontal_stack':
    case 'horizontal-stack':
      return icon('custom-split-vertical');
    case 'vertical_stack':
    case 'vertical-stack':
    case 'ultrawide_vertical_stack':
    case 'ultrawide-vertical-stack':
    case 'right_main_vertical_stack':
    case 'right-main-vertical-stack':
    case 'columns':
      return icon('custom-split-horizontal');
    case 'grid':
      return icon('custom-focus-tiling');
    case 'bsp':
    case 'custom':
    default:
      return icon('nf-md-view_dashboard');
  }
}

function parseGlazeIpcMessage(value: unknown): GlazeIpcMessage | null {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value) as GlazeIpcMessage;
  } catch {
    return null;
  }
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
