# zebar-rose-pine-dawn

[Zebar](https://github.com/glzr-io/zebar)용 Rosé Pine Dawn 상단 바 팩입니다.

[English](./README.md)

![zebar-rose-pine-dawn preview](./resources/preview-image-1.png)

## 특징

- 공식 [Rosé Pine Dawn 팔레트](https://rosepinetheme.com/palette/) 기반 테마
- 화면 상단을 가로지르는 rail과 모듈식 workspace/system 칩 구성
- 시스템 트레이, 볼륨, 네트워크 트래픽, 날씨, 날짜/시간, CPU/메모리 상태 표시
- [`wnlctl`](https://github.com/lucidust/wnlctl)을 설치하면 Windows Night Light 제어 가능
- 런타임에서 원격 아이콘 폰트에 의존하지 않는 번들 SVG 아이콘

## 칩 구성

공통 칩:

- CPU/메모리와 네트워크 트래픽
- 시스템 트레이 오버플로
- 볼륨
- `wnlctl.exe`가 설치된 경우 Windows Night Light
- 날씨
- 날짜와 시간

GlazeWM 연동:

- workspace 버튼
- 현재 workspace와 focused window 정보
- binding mode, pause 상태, tiling direction 제어

보조 모니터에서는 바를 가볍게 유지하기 위해 live system stats를 숨깁니다. 현재는 CPU/메모리와 네트워크 트래픽이 여기에 해당합니다.

## 변형

이 팩은 세 가지 위젯 변형을 제공합니다.

- `vanilla`: WM 연동 없이 공통 시스템 상태만 표시
- `with-glazewm`: GlazeWM workspace와 WM 상태 제어 포함
- `with-komorebi`: 빌드는 통과하지만, 정식 지원 전 사용자 피드백이 필요함

현재 정식 지원 대상은 `vanilla`와 `with-glazewm`입니다.

## 설치

### 마켓플레이스

Zebar 마켓플레이스에서 팩을 설치한 뒤 원하는 variant를 선택합니다.

### 커스텀 위젯

개발하거나 직접 수정해서 쓰려면 Zebar config 디렉터리 아래에 저장소를 두고 커스텀 위젯으로 연결합니다.

```powershell
git clone https://github.com/lucidust/zebar-rose-pine-dawn.git "$env:USERPROFILE\.glzr\zebar\zebar-rose-pine-dawn"
cd "$env:USERPROFILE\.glzr\zebar\zebar-rose-pine-dawn"
pnpm install
pnpm build
```

Zebar는 `zpack.json`을 기준으로 `dist/` 산출물을 로드합니다.

## Night Light helper

Night Light 칩은 `wnlctl.exe`가 필요합니다. `wnlctl`이 `PATH`에 없으면 Night Light 칩만 숨겨지고, 나머지 바는 계속 동작합니다.

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

`wnlctl`은 [lucidust/wnlctl](https://github.com/lucidust/wnlctl)에서 별도로 관리합니다. Windows registry 접근, 릴리스 바이너리, helper 자체 제약사항은 해당 저장소를 확인하세요.

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
- `src/styles.css`: layout, spacing, theme token

## 참고

- 실행 중 표시되는 UI 문자열과 기본 위젯 라벨은 영어입니다.
- 현재 튜닝 기준은 가로 4K 모니터입니다.

## 라이선스

MIT
