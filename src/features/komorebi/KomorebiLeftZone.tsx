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
import type { ProviderRestartState } from '../../app/use-provider-output';
import {
  StatusIconChip,
  SummaryChip,
  WorkspaceStripChip,
  type Tone,
} from '../../components/chips';
import { icon } from '../../icons';
import {
  clamp,
  compactTitle,
  komorebiLayoutLabel,
  komorebiWindowDetail,
  komorebiWindowLabel,
  workspaceLabel,
} from '../../utils/formatters';

type KomorebiFocusState =
  | 'empty'
  | 'tiling-disabled'
  | 'tiling'
  | 'stack'
  | 'floating'
  | 'maximized'
  | 'monocle';

const KOMOREBI_STATE_POLL_INTERVAL = 750;
const KOMOREBI_STATE_CHANNEL = 'zebar-rose-pine-dawn-komorebi-state';
const KOMOREBI_STATE_DISCOVERY_WINDOW = 220;
const KOMOREBI_STATE_CLAIM_WINDOW = 80;
const KOMOREBI_STATE_LEADER_TIMEOUT = 2_500;
const KOMOREBI_STATE_HEARTBEAT_INTERVAL = 1_000;
const KOMOREBI_STATE_QUERY_TIMEOUT = 1_500;
const KOMOREBI_PROVIDER_STALL_TIMEOUT = 4_000;
const KOMOREBI_PROVIDER_RESTART_COOLDOWN = 10_000;
const KOMOREBI_DEBUG_ENABLED = import.meta.env.VITE_KOMOREBI_DEBUG === '1';

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

type KomorebiPollDebugState = {
  instanceId: string;
  isLeader: boolean;
  knownLeaderId: string | null;
  queryInFlight: boolean;
  refreshAttempts: number;
  refreshFailures: number;
  refreshSuccesses: number;
  lastError: string | null;
  lastRefreshCompletedAt: number | null;
  lastRefreshStartedAt: number | null;
  lastStateReceivedAt: number | null;
};

function workspaceAccentVar(index: number) {
  return `var(--ws-${(index % 6) + 1})`;
}

function isKomorebiWorkspaceOccupied(workspace: any) {
  return Boolean(
    workspace?.tilingContainers?.length ||
      workspace?.floatingWindows?.length ||
      workspace?.maximizedWindow ||
      workspace?.monocleContainer,
  );
}

function useKomorebiRevision(key: () => string) {
  const [revision, setRevision] = createSignal(0);
  let previousKey: string | undefined;

  createEffect(() => {
    const nextKey = key();

    if (previousKey !== undefined && nextKey !== previousKey) {
      setRevision(value => value + 1);
    }

    previousKey = nextKey;
  });

  return revision;
}

function useKomorebiProviderWatchdog(options: {
  polledKomorebi: () => any;
  pollDebug: () => KomorebiPollDebugState | undefined;
  providerEmissionCount: () => number;
  providerState: () => any;
  restartProvider: () => Promise<boolean>;
}) {
  let lastProviderEmissionCount = options.providerEmissionCount();
  let lastProviderEmissionAt = Date.now();
  let lastRestartRequestedAt = 0;
  let restartInFlight = false;

  createEffect(() => {
    const emissionCount = options.providerEmissionCount();

    if (emissionCount !== lastProviderEmissionCount) {
      lastProviderEmissionCount = emissionCount;
      lastProviderEmissionAt = Date.now();
    }
  });

  createEffect(() => {
    const pollDebug = options.pollDebug();
    const providerState = options.providerState();
    const polledState = options.polledKomorebi();
    const now = Date.now();
    const latestPolledStateAt =
      pollDebug?.lastStateReceivedAt ?? pollDebug?.lastRefreshCompletedAt;

    if (
      restartInFlight ||
      !providerState ||
      !polledState ||
      !latestPolledStateAt ||
      now - latestPolledStateAt > KOMOREBI_STATE_QUERY_TIMEOUT * 2 ||
      now - lastProviderEmissionAt < KOMOREBI_PROVIDER_STALL_TIMEOUT ||
      now - lastRestartRequestedAt < KOMOREBI_PROVIDER_RESTART_COOLDOWN ||
      !hasKomorebiProviderDiverged(providerState, polledState)
    ) {
      return;
    }

    restartInFlight = true;
    lastRestartRequestedAt = now;

    void options.restartProvider().finally(() => {
      restartInFlight = false;
    });
  });
}

export function KomorebiLeftZone(props: {
  komorebi: any;
  providerEmissionCount: number;
  providerRestartState?: ProviderRestartState;
  restartProvider: () => Promise<boolean>;
}) {
  const polledKomorebi = usePolledKomorebiState(
    true,
    () => props.komorebi,
    () => 0,
  );
  const focusWorkspace = createMemo(() =>
    createKomorebiFocusWorkspaceOverlay(props.komorebi, polledKomorebi()),
  );
  const focusWorkspaceLabel = () => komorebiBarWorkspaceLabel(props.komorebi);
  const isPaused = () => Boolean(polledKomorebi()?.isPaused);
  const providerRevision = useKomorebiRevision(() =>
    komorebiDebugProviderKey(props.komorebi),
  );
  const polledRevision = useKomorebiRevision(() =>
    komorebiDebugProviderKey(polledKomorebi()),
  );
  useKomorebiProviderWatchdog({
    polledKomorebi,
    pollDebug: () => (polledKomorebi as any).debug?.(),
    providerEmissionCount: () => props.providerEmissionCount,
    providerState: () => props.komorebi,
    restartProvider: props.restartProvider,
  });

  return (
    <Show when={props.komorebi}>
      <div class="chip chip-left-context segmented-cluster">
        <KomorebiWorkspaceStrip
          komorebi={props.komorebi}
        />
        <KomorebiLayoutStatusChip
          komorebi={props.komorebi}
          isPaused={isPaused()}
        />
        <KomorebiFocusStateChip workspace={focusWorkspace()} />
        <SummaryChip
          class="chip-context-summary"
          iconNode={komorebiFocusedSummaryIcon(focusWorkspace())}
          label={komorebiFocusedSummaryLabel(
            focusWorkspace(),
            focusWorkspaceLabel(),
          )}
          detail={komorebiFocusedSummaryDetail(focusWorkspace())}
          tone="iris"
        />
        {KOMOREBI_DEBUG_ENABLED ? (
          <KomorebiDebugChip
            focusWorkspace={focusWorkspace()}
            komorebi={props.komorebi}
            pollDebug={(polledKomorebi as any).debug?.()}
            polledKomorebi={polledKomorebi()}
            polledRevision={polledRevision()}
            providerEmissionCount={props.providerEmissionCount}
            providerRestartState={props.providerRestartState}
            providerRevision={providerRevision()}
          />
        ) : null}
      </div>
    </Show>
  );
}

function KomorebiWorkspaceStrip(props: {
  komorebi: any;
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
              aria-label={komorebiWorkspaceTitle(workspace, index())}
              onClick={() => void focusKomorebiWorkspace(props.komorebi, index())}
            >
              <span class="workspace-dot" />
            </button>
          )}
        </For>
      </WorkspaceStripChip>
    </Show>
  );
}

function KomorebiLayoutStatusChip(props: {
  komorebi: any;
  isPaused: boolean;
}) {
  const layout = () => komorebiBarWorkspace(props.komorebi)?.layout;
  const layoutLabel = () => komorebiLayoutLabel(layout());
  const title = () =>
    props.isPaused
      ? `Komorebi Paused, ${layoutLabel()} Layout Active`
      : `${layoutLabel()} Layout Active`;

  return (
    <StatusIconChip
      class="chip-layout-state"
      tone={props.isPaused ? 'gold' : 'iris'}
      title={title()}
      ariaLabel={title()}
      iconNode={
        props.isPaused
          ? icon('nf-md-pause_circle')
          : komorebiLayoutIcon(layout())
      }
    />
  );
}

function KomorebiFocusStateChip(props: { workspace: any }) {
  const focusState = createMemo(() =>
    komorebiFocusState(props.workspace),
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

function KomorebiDebugChip(props: {
  focusWorkspace: any;
  komorebi: any;
  pollDebug?: KomorebiPollDebugState;
  polledKomorebi: any;
  polledRevision: number;
  providerEmissionCount: number;
  providerRestartState?: ProviderRestartState;
  providerRevision: number;
}) {
  const providerSnapshot = createMemo(() =>
    komorebiDebugSnapshot(props.komorebi),
  );
  const polledSnapshot = createMemo(() =>
    komorebiDebugSnapshot(props.polledKomorebi),
  );
  const matchedPolledMonitor = createMemo(() =>
    findMatchingKomorebiMonitor(
      props.polledKomorebi?.allMonitors,
      props.komorebi?.currentMonitor,
    ),
  );
  const focusState = createMemo(() =>
    komorebiFocusState(props.focusWorkspace),
  );
  const label = () =>
    `PE${props.providerEmissionCount}/P${props.providerRevision}/` +
    `S${props.polledRevision} ` +
    `prov=${providerSnapshot().currentMonitor}:${
      providerSnapshot().currentWorkspace
    } poll=${polledSnapshot().currentMonitor}:${
      polledSnapshot().currentWorkspace
    }`;
  const detail = () =>
    `role=${props.pollDebug?.isLeader ? 'L' : 'F'} ` +
    `focus=${providerSnapshot().focusedMonitor}:${
      providerSnapshot().focusedWorkspace
    } match=${matchedPolledMonitor() ? 'yes' : 'no'} ${focusState()} ` +
    `subR${props.providerRestartState?.count ?? 0} ` +
    `A${props.pollDebug?.refreshAttempts ?? 0}/` +
    `S${props.pollDebug?.refreshSuccesses ?? 0}/` +
    `E${props.pollDebug?.refreshFailures ?? 0}`;
  const title = () =>
    [
      'Komorebi debug',
      `providerEmits=${props.providerEmissionCount}`,
      `providerChanges=${props.providerRevision}`,
      `providerRestarts=${props.providerRestartState?.count ?? 0}`,
      `providerRestarting=${
        props.providerRestartState?.isRestarting ? 'yes' : 'no'
      }`,
      `providerRestartLast=${komorebiDebugTimestamp(
        props.providerRestartState?.lastRestartedAt,
      )}`,
      `providerRestartError=${
        props.providerRestartState?.lastError ?? 'none'
      }`,
      `polledChanges=${props.polledRevision}`,
      `provider=${providerSnapshot().summary}`,
      `polled=${polledSnapshot().summary}`,
      `pollRole=${props.pollDebug?.isLeader ? 'leader' : 'follower'}`,
      `pollLeader=${props.pollDebug?.knownLeaderId ?? 'none'}`,
      `pollInFlight=${props.pollDebug?.queryInFlight ? 'yes' : 'no'}`,
      `pollAttempts=${props.pollDebug?.refreshAttempts ?? 0}`,
      `pollSuccesses=${props.pollDebug?.refreshSuccesses ?? 0}`,
      `pollFailures=${props.pollDebug?.refreshFailures ?? 0}`,
      `pollLastError=${props.pollDebug?.lastError ?? 'none'}`,
      `pollLastCompleted=${komorebiDebugTimestamp(
        props.pollDebug?.lastRefreshCompletedAt,
      )}`,
      `pollLastState=${komorebiDebugTimestamp(
        props.pollDebug?.lastStateReceivedAt,
      )}`,
      `matchedPolledMonitor=${matchedPolledMonitor() ? 'yes' : 'no'}`,
      `focusWorkspace=${workspaceLabel(props.focusWorkspace ?? {})}`,
      `focusState=${focusState()}`,
      `devicePixelRatio=${komorebiDebugDevicePixelRatio()}`,
    ].join('\n');

  return (
    <div
      class="chip chip-summary chip-komorebi-debug"
      title={title()}
      aria-label={title()}
      role="status"
    >
      <div class="chip-body chip-body-fill">
        <div class="stacked">
          <span class="chip-label">{label()}</span>
          <span class="chip-detail">{detail()}</span>
        </div>
      </div>
    </div>
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

function focusKomorebiWorkspace(komorebi: any, workspaceIndex: number) {
  const monitorIndex = komorebiCurrentMonitorIndex(komorebi);

  return runKomorebic([
    'focus-monitor-workspace',
    String(monitorIndex),
    String(workspaceIndex),
  ]);
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

function komorebiDebugProviderKey(komorebi: any) {
  if (!komorebi) {
    return 'none';
  }

  const workspace = komorebiBarWorkspace(komorebi);
  const focusedWindow = komorebiFocusedWindow(workspace);

  return [
    komorebiDebugMonitorName(komorebi.currentMonitor),
    komorebiBarWorkspaceIndex(komorebi),
    komorebiDebugMonitorName(komorebi.focusedMonitor),
    komorebi?.focusedMonitor?.focusedWorkspaceIndex ?? '?',
    workspaceLabel(workspace ?? {}),
    workspace?.tilingContainers?.length ?? 0,
    workspace?.floatingWindows?.length ?? 0,
    workspace?.focusedContainerIndex ?? '?',
    focusedWindow?.hwnd ?? focusedWindow?.id ?? focusedWindow?.title ?? 'none',
    komorebiFocusState(workspace),
    komorebi?.isPaused ? 'paused' : 'active',
  ].join('|');
}

function komorebiDebugSnapshot(komorebi: any) {
  const currentMonitor = komorebiDebugMonitorName(komorebi?.currentMonitor);
  const currentWorkspace = komorebi ? komorebiBarWorkspaceLabel(komorebi) : '?';
  const focusedMonitor = komorebiDebugMonitorName(komorebi?.focusedMonitor);
  const focusedWorkspace =
    komorebi?.focusedMonitor?.focusedWorkspaceIndex != null
      ? String(komorebi.focusedMonitor.focusedWorkspaceIndex + 1)
      : '?';
  const summary =
    `cur=${currentMonitor}:${currentWorkspace} ` +
    `focus=${focusedMonitor}:${focusedWorkspace} ` +
    `paused=${komorebi?.isPaused ? 'yes' : 'no'}`;

  return {
    currentMonitor,
    currentWorkspace,
    focusedMonitor,
    focusedWorkspace,
    summary,
  };
}

function komorebiDebugMonitorName(monitor: any) {
  const monitorName = (
    monitor?.name ??
    monitor?.device ??
    monitor?.deviceId ??
    (monitor?.id != null ? String(monitor.id) : '?')
  );

  return String(monitorName).replace(/^DISPLAY/i, 'D');
}

function komorebiDebugDevicePixelRatio() {
  return Number(window.devicePixelRatio || 1).toFixed(2);
}

function komorebiDebugTimestamp(timestamp: number | null | undefined) {
  if (!timestamp) {
    return 'never';
  }

  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function hasKomorebiProviderDiverged(providerState: any, polledState: any) {
  if (!providerState || !polledState) {
    return false;
  }

  const polledMonitor = findMatchingKomorebiMonitor(
    polledState.allMonitors,
    providerState.currentMonitor,
  );

  if (!polledMonitor) {
    return false;
  }

  const providerWorkspaceIndex =
    providerState.currentMonitor?.focusedWorkspaceIndex;
  const providerFocusedWorkspaceIndex =
    providerState.focusedMonitor?.focusedWorkspaceIndex;
  const polledFocusedMonitor = findMatchingKomorebiMonitor(
    polledState.allMonitors,
    providerState.focusedMonitor,
  );

  return (
    providerWorkspaceIndex !== polledMonitor.focusedWorkspaceIndex ||
    providerFocusedWorkspaceIndex !== polledFocusedMonitor?.focusedWorkspaceIndex
  );
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
    isPaused: Boolean(rawState?.is_paused ?? rawState?.isPaused),
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
  const rawFloatingWindows =
    rawWorkspace?.floating_windows ?? rawWorkspace?.floatingWindows;
  const floatingWindows = normalizeKomorebiWindowList(rawFloatingWindows);
  const tilingContainers = (
    rawWorkspace?.containers?.elements ??
    rawWorkspace?.tilingContainers ??
    []
  ).map(normalizeKomorebiContainer);

  return {
    containerPadding:
      rawWorkspace?.container_padding ?? rawWorkspace?.containerPadding ?? null,
    floatingWindows,
    focusedFloatingWindowIndex: clamp(
      rawFloatingWindows?.focused ?? rawWorkspace?.focusedFloatingWindowIndex ?? 0,
      0,
      Math.max(floatingWindows.length - 1, 0),
    ),
    focusedContainerIndex: clamp(
      rawWorkspace?.containers?.focused ??
        rawWorkspace?.focusedContainerIndex ??
        0,
      0,
      Math.max(tilingContainers.length - 1, 0),
    ),
    latestLayout: rawWorkspace?.latest_layout ?? rawWorkspace?.latestLayout ?? [],
    layer: normalizeKomorebiLayerValue(rawWorkspace?.layer),
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
      : rawLayout?.Default ??
        rawLayout?.default ??
        rawLayout?.Custom ??
        rawLayout?.custom;

  if (!value) {
    return null;
  }

  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll('-', '_')
    .toLowerCase();
}

function normalizeKomorebiLayerValue(rawLayer: any) {
  if (!rawLayer) {
    return null;
  }

  return String(rawLayer)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll('-', '_')
    .toLowerCase();
}

function createKomorebiFocusWorkspaceOverlay(
  providerState: any,
  polledState: any,
) {
  const workspaceIndex = komorebiBarWorkspaceIndex(providerState);
  const providerWorkspace = komorebiBarWorkspace(providerState);

  if (!providerWorkspace || !polledState) {
    return providerWorkspace;
  }

  const polledMonitor =
    findMatchingKomorebiMonitor(polledState.allMonitors, providerState.currentMonitor) ??
    null;
  const polledWorkspace =
    polledMonitor?.workspaces?.[workspaceIndex] ??
    (!providerState.currentMonitor
      ? polledState.currentWorkspaces?.[workspaceIndex]
      : null);

  return enrichKomorebiWorkspace(providerWorkspace, polledWorkspace);
}

function enrichKomorebiWorkspace(providerWorkspace: any, polledWorkspace: any) {
  if (!providerWorkspace) {
    return providerWorkspace;
  }

  const floatingFocusedIndex = resolveFocusedWindowIndex(
    providerWorkspace.floatingWindows,
    polledWorkspace?.floatingWindows,
    polledWorkspace?.focusedFloatingWindowIndex,
  );

  return {
    ...providerWorkspace,
    focusedFloatingWindowIndex:
      floatingFocusedIndex ?? providerWorkspace.focusedFloatingWindowIndex,
    layer: providerWorkspace.layer ?? polledWorkspace?.layer,
    tile: providerWorkspace.tile ?? polledWorkspace?.tile,
    tilingContainers: enrichKomorebiContainerList(
      providerWorkspace.tilingContainers,
      polledWorkspace?.tilingContainers,
    ),
    monocleContainer: enrichKomorebiContainer(
      providerWorkspace.monocleContainer,
      polledWorkspace?.monocleContainer,
    ),
  };
}

function enrichKomorebiContainerList(
  providerContainers: any[] | undefined,
  polledContainers: any[] | undefined,
) {
  if (!Array.isArray(providerContainers)) {
    return providerContainers;
  }

  return providerContainers.map((container, index) =>
    enrichKomorebiContainer(
      container,
      findMatchingKomorebiContainer(polledContainers, container, index),
    ),
  );
}

function enrichKomorebiContainer(providerContainer: any, polledContainer: any) {
  if (!providerContainer) {
    return providerContainer;
  }

  const focusedWindowIndex = resolveFocusedWindowIndex(
    providerContainer.windows,
    polledContainer?.windows,
    polledContainer?.focusedWindowIndex,
  );

  return {
    ...providerContainer,
    focusedWindowIndex:
      focusedWindowIndex ?? providerContainer.focusedWindowIndex,
  };
}

function findMatchingKomorebiMonitor(monitors: any[] | undefined, monitor: any) {
  if (!Array.isArray(monitors) || !monitor) {
    return null;
  }

  return monitors.find(candidate => isSameKomorebiMonitor(candidate, monitor)) ?? null;
}

function findMatchingKomorebiContainer(
  containers: any[] | undefined,
  container: any,
  fallbackIndex: number,
) {
  if (!Array.isArray(containers)) {
    return null;
  }

  if (container?.id != null) {
    const matched = containers.find(candidate => candidate?.id === container.id);
    if (matched) {
      return matched;
    }
  }

  return containers[fallbackIndex] ?? null;
}

function resolveFocusedWindowIndex(
  providerWindows: any[] | undefined,
  polledWindows: any[] | undefined,
  polledFocusedIndex: number | null | undefined,
) {
  if (!Array.isArray(providerWindows) || polledFocusedIndex == null) {
    return undefined;
  }

  const polledWindow = polledWindows?.[polledFocusedIndex];
  if (polledWindow) {
    const matchedIndex = providerWindows.findIndex(window =>
      isSameKomorebiWindow(window, polledWindow),
    );

    if (matchedIndex !== -1) {
      return matchedIndex;
    }
  }

  if (
    polledFocusedIndex >= 0 &&
    polledFocusedIndex < providerWindows.length &&
    (!polledWindow ||
      isSameKomorebiWindow(providerWindows[polledFocusedIndex], polledWindow))
  ) {
    return polledFocusedIndex;
  }

  return undefined;
}

function isSameKomorebiWindow(a: any, b: any) {
  if (!a || !b) {
    return false;
  }

  if (a.hwnd != null && b.hwnd != null) {
    return a.hwnd === b.hwnd;
  }

  if (a.id != null && b.id != null) {
    return a.id === b.id;
  }

  return Boolean(
    a.title &&
      b.title &&
      a.title === b.title &&
      (a.exe === b.exe || a.class === b.class),
  );
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function usePolledKomorebiState(
  enabled: boolean,
  baseKomorebi: () => any,
  refreshTrigger: () => number,
) {
  const instanceId = createKomorebiStateInstanceId();
  const [rawState, setRawState] = createSignal<unknown | undefined>(undefined);
  const [state, setState] = createSignal<any | undefined>(undefined);
  const [debugState, setDebugState] = createSignal<KomorebiPollDebugState>({
    instanceId,
    isLeader: false,
    knownLeaderId: null,
    queryInFlight: false,
    refreshAttempts: 0,
    refreshFailures: 0,
    refreshSuccesses: 0,
    lastError: null,
    lastRefreshCompletedAt: null,
    lastRefreshStartedAt: null,
    lastStateReceivedAt: null,
  });
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
      setDebugState(value => ({
        ...value,
        lastStateReceivedAt: Date.now(),
      }));
    }
  };

  const refreshState = async () => {
    if (!enabled || disposed || queryInFlight) {
      return;
    }

    queryInFlight = true;
    setDebugState(value => ({
      ...value,
      isLeader,
      knownLeaderId,
      queryInFlight,
      refreshAttempts: value.refreshAttempts + 1,
      lastError: null,
      lastRefreshStartedAt: Date.now(),
    }));

    try {
      const result = await withTimeout(
        zebar.shellExec('komorebic.exe', ['state']),
        KOMOREBI_STATE_QUERY_TIMEOUT,
        'komorebic state timed out',
      );

      if (result.code !== 0) {
        throw new Error(result.stderr || `exit code ${result.code}`);
      }

      const nextRawState = JSON.parse(result.stdout.trim());

      if (!disposed) {
        applyRawState(nextRawState);
        setDebugState(value => ({
          ...value,
          lastError: null,
          refreshSuccesses: value.refreshSuccesses + 1,
        }));
        postChannelMessage({
          type: 'state',
          instanceId,
          timestamp: Date.now(),
          rawState: nextRawState,
        });
      }
    } catch (error) {
      if (!disposed) {
        setDebugState(value => ({
          ...value,
          lastError: error instanceof Error ? error.message : String(error),
          refreshFailures: value.refreshFailures + 1,
        }));
      }
    } finally {
      queryInFlight = false;
      setDebugState(value => ({
        ...value,
        isLeader,
        knownLeaderId,
        queryInFlight,
        lastRefreshCompletedAt: Date.now(),
      }));
    }
  };

  const becomeFollower = (leaderId: string) => {
    isLeader = false;
    knownLeaderId = leaderId;
    lastLeaderMessageAt = Date.now();
    setDebugState(value => ({
      ...value,
      isLeader,
      knownLeaderId,
    }));
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
    setDebugState(value => ({
      ...value,
      isLeader,
      knownLeaderId,
    }));
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
    setDebugState(value => ({
      ...value,
      isLeader,
      knownLeaderId,
    }));
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
    setDebugState(value => ({
      ...value,
      isLeader,
      knownLeaderId,
    }));
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

  const stateAccessor = state as typeof state & {
    debug: typeof debugState;
  };
  stateAccessor.debug = debugState;

  return stateAccessor;
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

function komorebiFocusedSummaryIcon(workspace: any) {
  return komorebiFocusedWindow(workspace)
    ? icon('nf-md-application_outline')
    : icon('nf-md-view_dashboard');
}

function komorebiFocusedSummaryLabel(workspace: any, workspaceName: string) {
  const focusedWindow = komorebiFocusedWindow(workspace);

  if (focusedWindow) {
    return komorebiWindowLabel(focusedWindow);
  }

  return `Workspace ${workspaceName}`;
}

function komorebiFocusedSummaryDetail(workspace: any) {
  if (!workspace) {
    return '';
  }

  const state = komorebiFocusState(workspace);
  if (state === 'stack') {
    return komorebiFocusStateDetail(workspace, state);
  }

  const focusedWindow = komorebiFocusedWindow(workspace);
  const detailParts = [
    komorebiWindowDetail(focusedWindow, ''),
    komorebiFocusStateDetail(workspace, state),
  ].filter(Boolean);

  if (detailParts.length) {
    return detailParts.join(' · ');
  }

  return komorebiWorkspaceSummaryDetail(workspace) || 'Empty';
}

function komorebiWorkspaceSummaryDetail(workspace: any) {
  const containers = workspace?.tilingContainers?.length ?? 0;
  const floating = workspace?.floatingWindows?.length ?? 0;
  const parts: string[] = [];

  if (workspace?.layout) {
    parts.push(String(workspace.layout).replaceAll('_', ' '));
  }

  if (containers) {
    parts.push(`Tiles ${containers}`);
  }

  if (floating) {
    parts.push(`Floating ${floating}`);
  }

  return parts.join(' · ');
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

  if (isKomorebiFloatingFocus(workspace)) {
    return komorebiFocusedFloatingWindow(workspace);
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

  return komorebiFocusedFloatingWindow(workspace);
}

function komorebiFocusState(workspace: any): KomorebiFocusState {
  if (!workspace) {
    return 'empty';
  }

  if (workspace.maximizedWindow) {
    return 'maximized';
  }

  if (isKomorebiFloatingFocus(workspace)) {
    return 'floating';
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

function isKomorebiFloatingFocus(workspace: any) {
  const floatingWindows = workspace?.floatingWindows ?? [];
  if (!floatingWindows.length) {
    return false;
  }

  if (normalizeKomorebiLayerValue(workspace?.layer) === 'floating') {
    return true;
  }

  const focusedContainerWindowCount =
    komorebiFocusedTilingContainer(workspace)?.windows?.length ?? 0;

  return (
    focusedContainerWindowCount === 0 &&
    !workspace?.monocleContainer?.windows?.length &&
    workspace?.tile !== false
  );
}

function komorebiFocusedFloatingWindow(workspace: any) {
  const floatingWindows = workspace?.floatingWindows ?? [];
  if (!floatingWindows.length) {
    return null;
  }

  const focusedFloatingWindowIndex = clamp(
    workspace?.focusedFloatingWindowIndex ?? 0,
    0,
    floatingWindows.length - 1,
  );

  return floatingWindows[focusedFloatingWindowIndex] ?? floatingWindows[0] ?? null;
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
        tone: 'iris',
      };
    case 'tiling':
      return {
        icon: 'custom-focus-tiling',
        title: 'Focused Container Tiling',
        tone: 'iris',
      };
    case 'stack':
      return {
        icon: 'custom-focus-stack',
        title: 'Focused Container Stack',
        tone: 'iris',
      };
    case 'floating':
      return {
        icon: 'custom-focus-floating',
        title: 'Floating Window Focus',
        tone: 'iris',
      };
    case 'maximized':
      return {
        icon: 'custom-focus-fullscreen',
        title: 'Focused Window Maximized',
        tone: 'iris',
      };
    case 'monocle':
      return {
        icon: 'custom-focus-fullscreen',
        title: 'Focused Container Monocle',
        tone: 'iris',
      };
    case 'empty':
      return {
        icon: 'custom-focus-none',
        title: 'Workspace Focus Active',
        tone: 'iris',
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
      return komorebiStackDetail(workspace);
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

function komorebiStackDetail(workspace: any) {
  const windows = komorebiFocusedTilingContainer(workspace)?.windows ?? [];
  const count = windows.length;

  if (!count) {
    return 'Stack 0';
  }

  const visibleLabels = windows.slice(0, 2).map(stackWindowLabel);
  const hiddenCount = Math.max(0, count - visibleLabels.length);
  const suffix = hiddenCount ? ` +${hiddenCount}` : '';

  return `Stack ${count}: ${visibleLabels.join(', ')}${suffix}`;
}

function stackWindowLabel(window: any) {
  const rawLabel =
    String(window?.exe ?? '').replace(/\.exe$/i, '') ||
    window?.class ||
    window?.title ||
    'Window';

  return compactTitle(rawLabel, 'Window');
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


