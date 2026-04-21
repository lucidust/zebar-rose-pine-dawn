import { For, Show, createMemo, createSignal, onCleanup } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { resolveBrandCopy } from './brand-copy';
import { batteryIcon, icon, networkIcon, weatherIcon } from './icons';
import type { Variant } from './providers';
import {
  batteryDetail,
  batteryStatusText,
  clamp,
  compactTitle,
  glazeFocusedDetail,
  glazeFocusedLabel,
  komorebiWorkspaceDetail,
  networkLabel,
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

    return (
      <>
        <BrandChip variant="vanilla" accent="rose" />
        <WeatherChip weather={weather()} />
      </>
    );
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
        </>
      );
    }

    return (
      <>
        <DateTimeChip value={date()} />
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
          <KeyboardChip keyboard={output.keyboard} />
          <NetworkChip network={output.network} />
          <WeatherChip weather={weather()} />
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
  let refreshTimer: number | undefined;

  const scheduleRefresh = () => {
    const current = new Date();
    const next = new Date(current);
    next.setHours(24, 0, 2, 0);

    refreshTimer = window.setTimeout(() => {
      setNow(new Date());
      scheduleRefresh();
    }, Math.max(1_000, next.getTime() - current.getTime()));
  };

  scheduleRefresh();
  onCleanup(() => {
    if (refreshTimer != null) {
      window.clearTimeout(refreshTimer);
    }
  });

  const copy = createMemo(() => resolveBrandCopy(props.variant, now()));

  return (
    <div class={`chip chip-brand chip-accent-${props.accent}`}>
      <div class="brand-mark">
        <IconBadge node={icon('custom-tulip')} tone="rose" />
      </div>
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
        <button
          class="chip chip-button chip-warning responsive-hide-md"
          onClick={() => props.glazewm.runCommand('wm-toggle-pause')}
        >
          {icon('nf-md-pause_circle')}
          <span>Paused</span>
        </button>
      </Show>
      <For each={props.glazewm?.bindingModes ?? []}>
        {(mode: any) => (
          <button
            class="chip chip-button chip-accent-foam responsive-hide-lg"
            onClick={() =>
              props.glazewm.runCommand(
                `wm-disable-binding-mode --name ${mode.name}`,
              )
            }
          >
            {icon('nf-md-key_variant')}
            <span>{mode.displayName ?? mode.name}</span>
          </button>
        )}
      </For>
      <button
        class="chip chip-button chip-icon"
        onClick={() => props.glazewm.runCommand('toggle-tiling-direction')}
        title="Tiling direction"
      >
        {props.glazewm?.tilingDirection === 'horizontal'
          ? icon('nf-md-swap_horizontal')
          : icon('nf-md-swap_vertical')}
      </button>
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

  return (
    <Show when={props.audio}>
      <div class="chip chip-audio responsive-hide-lg">
        <IconBadge
          node={icon(volume() <= 0 ? 'nf-md-volume_off' : 'nf-md-volume_high')}
          tone={volume() <= 0 ? 'muted' : 'foam'}
        />
        <input
          class="volume-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume()}
          onInput={event =>
            props.audioProvider?.setVolume(event.currentTarget.valueAsNumber)
          }
        />
      </div>
    </Show>
  );
}

function NetworkChip(props: { network: any }) {
  return (
    <Show when={props.network}>
      <div class="chip responsive-hide-md">
        <IconBadge node={networkIcon(props.network)} tone="pine" />
        <div class="stacked">
          <span class="chip-label">Network</span>
          <span class="chip-detail">{compactTitle(networkLabel(props.network), 'Offline')}</span>
        </div>
      </div>
    </Show>
  );
}

function KeyboardChip(props: { keyboard: any }) {
  return (
    <Show when={props.keyboard != null}>
      <div class="chip chip-mini responsive-hide-lg">
        <IconBadge node={icon('nf-md-keyboard')} tone="iris" />
        <span>{props.keyboard?.layout ?? 'Input'}</span>
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
  return (
    <Show when={props.systray?.icons?.length}>
      <div class="chip chip-systray">
        <For each={props.systray.icons}>
          {(trayIcon: any) => (
            <button
              class="tray-button"
              title={trayIcon.tooltip}
              onClick={event => {
                event.preventDefault();
                props.systray.onLeftClick(trayIcon.id);
              }}
              onContextMenu={event => {
                event.preventDefault();
                props.systray.onRightClick(trayIcon.id);
              }}
            >
              <img class="tray-icon" src={trayIcon.iconUrl} alt={trayIcon.tooltip} />
            </button>
          )}
        </For>
      </div>
    </Show>
  );
}

function IconBadge(props: { node: any; tone: Tone }) {
  return <span class={`icon-badge tone-${props.tone}`}>{props.node}</span>;
}
