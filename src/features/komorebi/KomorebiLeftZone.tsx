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
import {
  ControlActionChip,
  StatusIconChip,
  SummaryChip,
  WorkspaceStripChip,
  type Tone,
} from '../../components/chips';
import { icon } from '../../icons';
import {
  clamp,
  komorebiLayoutLabel,
  komorebiWindowDetail,
  komorebiWindowLabel,
  komorebiWorkspaceDetail,
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

export function KomorebiLeftZone(props: { komorebi: any }) {
  const [komorebiRefreshNonce, setKomorebiRefreshNonce] = createSignal(0);
  const polledKomorebi = usePolledKomorebiState(
    true,
    () => props.komorebi,
    komorebiRefreshNonce,
  );
  const komorebi = () => polledKomorebi() ?? props.komorebi;
  const refreshKomorebiState = () => setKomorebiRefreshNonce(value => value + 1);

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


