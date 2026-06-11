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
  glazeFocusedContainerDetail,
  glazeFocusedContainerLabel,
  workspaceLabel,
} from '../../utils/formatters';

type FocusWindowState = 'none' | 'tiling' | 'floating' | 'fullscreen' | 'minimized';

type GlazeIpcMessage = {
  messageType?: string;
  clientMessage?: string;
  data?: any;
};

const FOCUS_STATE_POLL_INTERVAL = 500;

export function GlazeLeftZone(props: { glazewm: any }) {
  const polledFocusedContainer = usePolledGlazeFocusedContainer();
  const focusedContainer = () => {
    const polledFocused = polledFocusedContainer();
    return polledFocused === undefined
      ? props.glazewm?.focusedContainer
      : polledFocused;
  };

  return (
    <Show when={props.glazewm}>
      <div class="chip chip-left-context segmented-cluster">
        <GlazeWorkspaceStrip glazewm={props.glazewm} />
        <WmControlStrip glazewm={props.glazewm} />
        <FocusWindowStateChip focusedContainer={focusedContainer()} />
        <SummaryChip
          class="responsive-hide-sm chip-context-summary"
          iconNode={icon('nf-md-application_outline')}
          label={glazeFocusedContainerLabel(focusedContainer())}
          detail={glazeFocusedContainerDetail(
            focusedContainer(),
            props.glazewm,
          )}
          tone="iris"
        />
      </div>
    </Show>
  );
}

function workspaceAccentVar(index: number) {
  return `var(--ws-${(index % 6) + 1})`;
}

function isGlazeWorkspaceOccupied(workspace: {
  children?: Array<unknown> | null;
}) {
  return Boolean(workspace.children?.length);
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

function usePolledGlazeFocusedContainer() {
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
