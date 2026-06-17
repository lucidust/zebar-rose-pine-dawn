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
import { icon } from '../../icons';

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

export function SystrayStrip(props: { systray: any }) {
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
  const hasVisiblePinnedIcons = createMemo(() => matchedPinnedIcons().length > 0);
  const controlTitle = createMemo(() =>
    trayControlTitle(
      mode(),
      isManaging(),
      allIcons().length,
      displayedIcons().length,
      hiddenIconCount(),
      hasVisiblePinnedIcons(),
    ),
  );

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
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);

    onCleanup(() => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    });
  });

  const cycleMode = () => {
    setMode(currentMode => {
      if (currentMode === 'folded') {
        return hasVisiblePinnedIcons() ? 'pinned' : 'all';
      }

      if (currentMode === 'pinned') {
        return 'all';
      }

      return 'folded';
    });
  };

  createEffect(() => {
    if (mode() === 'pinned' && !hasVisiblePinnedIcons()) {
      setMode('folded');
    }
  });

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
          title={controlTitle()}
          aria-label={controlTitle()}
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

function trayControlTitle(
  mode: TrayDisplayMode,
  isManaging: boolean,
  iconCount: number,
  visibleIconCount: number,
  hiddenIconCount: number,
  hasVisiblePinnedIcons: boolean,
) {
  if (isManaging) {
    return `Managing ${iconCount} tray icons. Click icons to pin or unpin. Click tray control to leave manage mode.`;
  }

  if (mode === 'folded') {
    if (!iconCount) {
      return 'No tray icons shown. Ctrl+click to manage pins.';
    }

    const nextMode = hasVisiblePinnedIcons ? 'pinned icons' : 'all icons';
    return `${iconCount} tray icons hidden. Click to show ${nextMode}. Ctrl+click to manage pins.`;
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
