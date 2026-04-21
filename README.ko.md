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

## 특징

- Rose Pine Dawn 공식 팔레트 기반 테마
- 시스템 트레이, 미디어 제어, 오디오, 네트워크, 키보드 레이아웃, 배터리, CPU/메모리 표시
- `with-glazewm`에서 workspace 클릭, pause 상태, binding mode, tiling direction 제어
- 좁은 폭에서 낮은 우선순위 텍스트가 자연스럽게 축약되는 반응형 상단 바
