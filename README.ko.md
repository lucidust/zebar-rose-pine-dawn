# zebar-rose-pine-dawn

Rose Pine Dawn 색상 프로파일에 맞춘 Zebar 상단 바 팩입니다.

## 규칙

- 이 저장소의 해석 기준 진입점은 `repo-metadata.yaml`과 `.agent/standards-baseline.md`입니다.
- workspace standards는 실행 자동화나 동기화 도구가 아니라, 이 저장소를 어떻게 읽고 해석할지 고정하는 기준입니다.
- runtime/pack contract의 canonical artifact는 `zpack.json`입니다.

## 언어 정책

- 저장소 운영 기본 언어는 영어입니다.
- 한국어 문서는 보조 문서로 유지하며, 시작점은 [README.md](./README.md)의 한국어 보조 문서인 이 파일입니다.
- shipped widget의 UI 문자열과 라벨은 별도 현지화 작업이 없는 한 영어를 기본으로 유지합니다.

## 구성

- `vanilla`: WM 연동 없이 공용 상태 영역만 표시
- `with-glazewm`: GlazeWM workspace/상태 제어 포함
- `with-komorebi`: Komorebi workspace 상태 표시 포함

## 개발

```bash
pnpm install
pnpm typecheck
pnpm validate:pack
pnpm build
```

빌드 후 Zebar는 이 디렉토리의 `zpack.json`을 기준으로 `dist/` 산출물을 로드합니다.

## 참고 문서

- Rosé Pine 공식 팔레트 개요: [rosepinetheme.com/palette](https://rosepinetheme.com/palette/)
- Rosé Pine Dawn을 포함한 canonical hex 값 표: [rosepinetheme.com/palette/ingredients](https://rosepinetheme.com/palette/ingredients/)
- Zebar 런타임 및 provider 문서: [github.com/glzr-io/zebar](https://github.com/glzr-io/zebar)
- 이번 스타일 갱신에서 시각 참고로 사용한 구 버전 테마: [github.com/adriankarlen/rose-pine.zebar](https://github.com/adriankarlen/rose-pine.zebar)

이 저장소의 색상 기준은 위 Rosé Pine 공식 문서의 Dawn 팔레트를 source of truth로 사용합니다.

## 커스터마이징

- 글꼴 스택은 [src/styles.css](./src/styles.css)의 `--font-sans`, `--font-mono` 루트 변수에서 바로 수정할 수 있습니다.
- shipped icon은 [src/icons.tsx](./src/icons.tsx)를 통해 번들된 로컬 SVG 컴포넌트로 렌더링되므로, 런타임에서 원격 아이콘 폰트에 의존하지 않습니다.
- 왼쪽 브랜드 트리거는 기본적으로 아이콘만 표시하며, 이후 동작을 추가할 수 있도록 클릭 타깃을 유지합니다.

## 권장 셋업

현재 이 팩은 가로 배치된 4K primary 모니터 기준으로 맞춰져 있습니다.

- 검증 기준: 가로 배치된 4K primary 모니터 1대
- 보조 모니터 상태: 현재 작업 환경에는 세로 배치된 4K secondary 모니터도 있지만, shipped spacing/배치 값은 아직 그 모니터에 맞춰 튜닝하지 않았습니다
- 현재 widget 범위: 기본 `zpack.json` preset은 모든 모니터를 대상으로 하지만, spacing은 우선 primary monitor 기준으로 맞춰져 있습니다

### GlazeWM gap 값

현재 이 팩과 함께 쓰는 권장 GlazeWM gap 값은 아래와 같습니다.

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

### Zebar spacing 값

위 GlazeWM 프로파일과 맞출 때 Zebar 쪽은 아래 값을 유지합니다.

- `zpack.json`: `offsetY: 0px`, `height: 50px`, all monitor presets
- `src/styles.css`: `--shell-padding-x: 8px`
- `src/styles.css`: `--shell-padding-y: 6px`
- `src/styles.css`: `--pill-height: 36px`
- `src/styles.css`: `--bar-radius: 11px`
- `src/styles.css`: `--right-cluster-item-height: 30px`
이 값들은 50px Zebar 영역 안에서 상단 6px 내부 갭을 만들고, 좌우 간격을 GlazeWM의 `8px` outer gap과 맞추도록 의도한 셋업입니다.

## 레이아웃 가이드

- shipped variant는 같은 zone 순서를 유지합니다: 왼쪽은 브랜드, workspace 인식 컨텍스트, WM 제어이고, 오른쪽은 공용 시스템 위젯과 마지막의 날씨/날짜·시간입니다.
- variant별 차이는 workspace 인식 요소와 WM 제어에 한정하고, 공용 시스템 위젯의 순서는 한 variant만 따로 바꾸지 않습니다.
- 앞으로도 `vanilla`, `with-glazewm`, `with-komorebi`를 하나의 레이아웃 계열로 보고 함께 유지보수합니다.
- full-width rail을 공용 bar chrome으로 보고, 그 위의 기능 칩들은 모듈식 콘텐츠 단위로 유지합니다.

## 우측 클러스터 원칙

- 우측 위젯은 유지보수를 위해 기능 단위 칩으로 구현하되, 시각적으로는 하나의 시스템 클러스터처럼 보이게 유지합니다.
- 우측 시스템 영역은 별도 큰 pill 대신 full-width bar rail을 공용 chrome으로 사용합니다.
- 트레이, 오디오, 클릭 가능한 metric처럼 상호작용이 있는 칩은 배경이 있는 sub-chip을 우선 사용합니다.
- 네트워크, 날씨, 날짜/시간처럼 문자 중심의 정보 칩은 separator나 간격으로 경계를 표현합니다.
- 배경과 separator는 역할이 다를 때만 함께 쓰고, 둘 다 강하게 쓰지 않습니다.
- 이 원칙은 절대 규칙이 아니라 가이드이며, 위젯 밀도와 조작 빈도에 따라 조정합니다.

## 특징

- Rose Pine Dawn 공식 팔레트 기반 테마
- full-width top bar rail과 모듈식 workspace/system 칩 구성
- 시스템 트레이 overflow popover, 오디오, 네트워크 traffic, 날씨, 통합 CPU/메모리 표시
- `with-glazewm`에서 workspace 클릭, pause 상태, binding mode, tiling direction 제어
- 좁은 폭에서 낮은 우선순위 텍스트가 자연스럽게 축약되는 반응형 상단 바
