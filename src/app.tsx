import { For, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
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
          <BrandChip label="RPD" detail="GlazeWM" accent="iris" />
          <GlazeWorkspaceStrip glazewm={glaze()} />
        </>
      );
    }

    if (props.variant === 'with-komorebi') {
      return (
        <>
          <BrandChip label="RPD" detail="Komorebi" accent="foam" />
          <KomorebiWorkspaceStrip komorebi={komorebi()} />
        </>
      );
    }

    return (
      <>
        <BrandChip label="RPD" detail="Vanilla" accent="rose" />
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
          <MediaChip media={media()} mediaProvider={output.media} />
          <AudioChip audio={audio()} audioProvider={output.audio} />
          <NetworkChip network={output.network} />
          <WeatherChip weather={weather()} />
          <KeyboardChip keyboard={output.keyboard} />
          <SystemChip cpu={output.cpu} memory={output.memory} />
          <BatteryChip battery={output.battery} />
          <SystrayStrip systray={output.systray} />
        </div>
      </div>
    </div>
  );
}

function BrandChip(props: {
  label: string;
  detail: string;
  accent: 'iris' | 'foam' | 'rose';
}) {
  return (
    <div class={`chip chip-brand chip-accent-${props.accent}`}>
      <div class="brand-mark">{props.label}</div>
      <div class="stacked">
        <span class="chip-label">Zebar Rose Pine Dawn</span>
        <span class="chip-detail">{props.detail}</span>
      </div>
    </div>
  );
}

function SummaryChip(props: {
  iconNode: any;
  label: string;
  detail: string;
}) {
  return (
    <div class="chip chip-summary responsive-hide-sm">
      {props.iconNode}
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
      {icon('nf-md-calendar_clock')}
      <span class="time-text">{props.value}</span>
    </div>
  );
}

function WeatherChip(props: { weather: any }) {
  return (
    <Show when={props.weather}>
      <div class="chip responsive-hide-md">
        {weatherIcon(props.weather)}
        <div class="stacked">
          <span class="chip-label">Weather</span>
          <span class="chip-detail">{weatherLabel(props.weather)}</span>
        </div>
      </div>
    </Show>
  );
}

function GlazeWorkspaceStrip(props: { glazewm: any }) {
  return (
    <Show when={props.glazewm?.currentWorkspaces?.length}>
      <div class="workspace-strip">
        <For each={props.glazewm.currentWorkspaces}>
          {(workspace: any) => (
            <button
              class={`workspace-pill ${workspace.hasFocus ? 'focused' : ''} ${workspace.isDisplayed ? 'displayed' : ''}`}
              onClick={() =>
                props.glazewm.runCommand(`focus --workspace ${workspace.name}`)
              }
              title={`${workspaceLabel(workspace)} workspace`}
            >
              {workspaceLabel(workspace)}
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
          {(workspace: any) => (
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
              title={`${workspace.name} workspace`}
            >
              {workspace.name}
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
        {icon('nf-md-music_note')}
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
  return (
    <Show when={props.audio}>
      <div class="chip chip-audio responsive-hide-lg">
        {icon('nf-md-volume_high')}
        <div class="stacked">
          <span class="chip-label">
            {compactTitle(props.audio?.name, 'Audio')}
          </span>
          <span class="chip-detail">{percent(props.audio?.volume)}</span>
        </div>
        <input
          class="volume-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={clamp(props.audio?.volume ?? 0, 0, 100)}
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
        {networkIcon(props.network)}
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
    <Show when={props.keyboard}>
      <div class="chip chip-mini">
        {icon('nf-md-keyboard')}
        <span>{props.keyboard?.layout ?? 'Input'}</span>
      </div>
    </Show>
  );
}

function SystemChip(props: { cpu: any; memory: any }) {
  return (
    <Show when={props.cpu || props.memory}>
      <div class="chip chip-system responsive-hide-xl">
        {icon('nf-oct-cpu')}
        <div class="inline-metrics">
          <span>CPU {percent(props.cpu?.usage)}</span>
          <span>MEM {percent(props.memory?.usage)}</span>
        </div>
      </div>
    </Show>
  );
}

function BatteryChip(props: { battery: any }) {
  return (
    <Show when={props.battery}>
      <div class="chip chip-mini">
        {batteryIcon(props.battery)}
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
