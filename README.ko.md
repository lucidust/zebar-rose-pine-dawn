# zebar-rose-pine-dawn

[Zebar](https://github.com/glzr-io/zebar)용 Rosé Pine Dawn 상단 바 팩입니다.

[English](./README.md)

## 미리보기

GlazeWM:

![zebar-rose-pine-dawn GlazeWM preview](./resources/preview-image-1.png)

Komorebi:

![zebar-rose-pine-dawn Komorebi preview](./resources/preview-image-2.png)

## 특징

- 공식 [Rosé Pine Dawn 팔레트](https://rosepinetheme.com/palette/) 기반 테마
- 화면 상단을 가로지르는 rail과 모듈식 workspace/system status 칩 구성
- 시스템 트레이 표시 모드, 볼륨, 네트워크 트래픽, 날씨, 날짜/시간, CPU/메모리 상태 표시
- [`wnlctl`](https://github.com/lucidust/wnlctl)을 설치하면 Windows Night Light 제어 가능
- 런타임에서 원격 아이콘 폰트에 의존하지 않는 번들 SVG 아이콘

## 칩 구성

공통 칩:

- CPU/메모리와 네트워크 트래픽
- folded, pinned, all-icons 표시 모드를 지원하는 시스템 트레이 칩
- 볼륨
- `wnlctl.exe`가 설치된 경우 Windows Night Light
- 날씨
- 날짜와 시간

GlazeWM:

- workspace 버튼
- 현재 workspace와 focused window 정보
- binding mode, pause 상태, tiling direction 제어

Komorebi:

- workspace 버튼
- 현재 workspace, container, stack, focused window 정보
- layout, pause, tiling, stack, floating, maximized, monocle focus 상태 표시

보조 모니터에서는 바를 간결하게 유지하기 위해 우측 system status 그룹 전체를 숨깁니다.

### 시스템 트레이

시스템 트레이 칩은 바 안에서 tray icon을 inline으로 표시합니다. 트레이 칩을 클릭하면 현재 사용할 수 있는 표시 모드가 순서대로 전환됩니다.

- `Folded`: tray icon을 숨기고 숨겨진 icon 수를 표시합니다.
- `Pinned`: pin한 tray icon만 표시하고 나머지 숨겨진 icon 수를 표시합니다. 현재 보이는 pinned icon이 없으면 이 모드는 건너뜁니다.
- `All`: 모든 tray icon을 가로 스크롤 가능한 strip으로 표시합니다.

트레이 칩을 Ctrl+클릭하면 manage mode로 진입합니다. Manage mode에서는 tray icon을 클릭해 pin/unpin할 수 있습니다. 현재 Zebar systray provider에서 보이지 않는 pinned icon은 missing 수로 표시되며, missing indicator를 클릭하면 현재 보이지 않는 pinned entry를 제거합니다. Pinned icon 정보는 로컬에 저장됩니다.

## 변형

이 팩은 세 가지 위젯 변형을 제공합니다.

- `vanilla`: WM 연동 없이 공통 시스템 상태만 표시
- `with-glazewm`: GlazeWM workspace와 WM 상태 제어 포함
- `with-komorebi`: Komorebi workspace, layout 상태, focused container/window 정보 포함

## 설치

### 마켓플레이스

Zebar 마켓플레이스에서 팩을 설치한 뒤 사용할 variant를 선택합니다.

### 커스텀 위젯

개발하거나 직접 수정해서 사용하려면 Zebar config 디렉터리 아래에 저장소를 두고 커스텀 위젯으로 연결합니다.

```powershell
git clone https://github.com/lucidust/zebar-rose-pine-dawn.git "$env:USERPROFILE\.glzr\zebar\zebar-rose-pine-dawn"
cd "$env:USERPROFILE\.glzr\zebar\zebar-rose-pine-dawn"
pnpm install
pnpm build
```

Zebar는 `zpack.json`을 기준으로 `dist/` 산출물을 로드합니다.

## Night Light helper

Night Light 칩은 `wnlctl.exe`가 필요합니다. `wnlctl`이 `PATH`에 없으면 Night Light 칩만 숨겨집니다.

Scoop 설치:

```powershell
scoop bucket add lucidust https://github.com/lucidust/scoop-bucket
scoop install wnlctl
```

이 팩은 아래 명령만 사용합니다.

```powershell
wnlctl status --json
wnlctl toggle --json
```

helper 세부 정보와 릴리스는 [lucidust/wnlctl](https://github.com/lucidust/wnlctl)을 확인하세요.

## 권장 GlazeWM 설정

이 팩은 50px 높이의 상단 바에 맞춰져 있습니다. 함께 쓰기 좋은 GlazeWM gap 설정은 아래와 같습니다.

```yaml
gaps:
  scale_with_dpi: true
  inner_gap: '8px'
  outer_gap:
    top: '50px'
    right: '8px'
    bottom: '8px'
    left: '8px'
```

## 권장 Komorebi 설정

Komorebi가 실행 중이고 Zebar에서 `komorebic.exe`를 사용할 수 있을 때 `with-komorebi` variant를 사용하세요. Workspace UI 상태는 Zebar의 Komorebi provider에서 가져옵니다. 바는 `komorebic.exe state`를 함께 사용해 tiling, stack, floating, maximized, monocle workspace의 focus 세부 정보를 표시합니다.

provider 업데이트가 멈춘 것으로 보이는 경우에는 Komorebi provider subscription을 다시 시작해 표시 상태를 복구합니다.

이 팩은 아래 Komorebi helper 명령만 허용합니다.

```powershell
komorebic state
komorebic focus-monitor-workspace <monitor-index> <workspace-index>
```

바는 GlazeWM variant와 같은 50px 상단 영역을 기준으로 튜닝되어 있습니다. 창이 바를 피해야 한다면 Komorebi work area나 application gap을 별도로 설정하세요.

### Komorebi 디버그 칩

`with-komorebi` variant에는 로컬 문제 확인을 위한 빌드 타임 디버그 칩이 있습니다. 사용하려면 `pnpm build` 실행 전 `VITE_KOMOREBI_DEBUG=1`을 설정하세요. 일반 빌드에서는 디버그 칩이 숨겨집니다.

## 개발

```powershell
pnpm install
pnpm validate:pack
pnpm typecheck
pnpm build
```

주요 파일:

- `zpack.json`: Zebar pack contract
- `src/providers.ts`: variant별 provider wiring
- `src/entries/*`: shipped variant entrypoint
- `src/styles.css`: layout, spacing, theme tokens

## 참고

- 실행 중 표시되는 UI 문자열과 기본 위젯 라벨은 영어입니다.
- 이 팩은 주로 가로 4K 모니터에 맞춰 튜닝되어 있습니다.

## 라이선스

MIT
