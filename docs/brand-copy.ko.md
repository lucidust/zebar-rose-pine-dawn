# 브랜드 문구 모음

왼쪽 브랜드 칩에 사용할 후보 문구 모음입니다.

## 사용 방식

- 위 줄: 문장
- 아래 줄: 카테고리
- 기본 적용 대상: 왼쪽 브랜드 칩의 `Zebar Rose Pine Dawn` 텍스트 영역
- 언어 정책: shipped runtime 텍스트는 영어를 기본으로 유지하고, 이 문서는 한국어 참고용 보조 문서로 사용합니다

## 런타임 규칙

- 실제 런타임 문구 목록은 `src/brand-copy.entries.json`에 있습니다.
- 로테이션과 표시 방식 설정은 `src/brand-copy.ts`에서 조정합니다.
- 기본 동작은 로컬 날짜 기준 `1일 1회`, 카테고리를 랜덤으로 고르고 그 안에서 문구를 다시 랜덤으로 고르는 결정적 로테이션입니다.
- 사용자 조절 포인트:
  `language`: `en` 또는 `ko`
  `mode`: `daily-random` 또는 `fixed`
  `rotationDays`: 기본 `1`, 더 느리게 바꾸고 싶을 때만 증가
  `seedOffset`: 문구 목록을 바꾸지 않고 일일 순서를 밀어주는 값
  `allowedCategories`: 특정 category id만 순환하고 싶을 때 사용
  `bottomLineMode`: `category`, `variant`, `category-and-variant`

## Time & Patience (시간을 대하는 태도)

- `Ten years, a life's change.`  
  고작 10년이 삶을 바꿨다.
- `Just a moment, but forever.`  
  찰나였으나, 영원이 되었다.
- `Waste years, find flowers.`  
  꽃을 찾기 위해 세월을 낭비하라.
- `Slow magic, deep roots.`  
  느린 마법이 깊은 뿌리를 내린다.
- `Endless time, finite love.`  
  무한한 시간 속, 유한한 사랑.

## Himmel's Legacy (힘멜의 유산)

- `Trifles made us us.`  
  시시한 일들이 우리를 우리로 만들었다.
- `Statues fade, hearts remain.`  
  동상은 바래도, 마음은 남는다.
- `Fairy tales are real now.`  
  동화는 이제 현실이 된다.
- `Live so she won't be alone.`  
  그녀가 혼자 남지 않도록 살아라.
- `A smile worth a century.`  
  백 년의 가치가 있는 미소.

## Journey & Destination (여정과 목적지)

- `The detour is the journey.`  
  되돌아가는 길이 곧 여정이다.
- `To know him, I walk.`  
  그를 알기 위해, 나는 걷는다.
- `Backtrack to move forward.`  
  앞으로 가기 위해 뒤를 돌아본다.
- `Search for the useless spells.`  
  쓸모없는 마법들을 찾아 헤매라.
- `Sunrise is better together.`  
  일출은 함께 볼 때 더 아름답다.

## Frieren's Perspective (프리렌의 감각)

- `Human lives, blink of an eye.`  
  인간의 삶은 눈 깜빡임일 뿐.
- `Tearful goodbye, hopeful hello.`  
  눈물 어린 작별, 희망찬 인사.
- `Small steps, grand memories.`  
  작은 발걸음, 거대한 기억.
- `Magic is imagination.`  
  마법은 곧 상상력이다.
- `Wait for the melt.`  
  눈이 녹기를 기다려라.

## The Warmth Left Behind (남겨진 온기)

- `Cold metal, warm memories.`  
  차가운 금속, 따뜻한 기억.
- `Himmel's path, Frieren's pace.`  
  힘멜의 길을 프리렌의 걸음으로.
- `Old scars, new blossoms.`  
  오래된 흉터 위에 피어난 새 꽃.
- `Love learned too late.`  
  너무 늦게 배워버린 사랑.
- `Brief lives, eternal marks.`  
  짧은 생애, 영원한 흔적.

## The Power of Trifles (사소함의 위대함)

- `Sweet grapes, sour days.`  
  시큼한 날들 속의 달콤한 포도.
- `Ice melt, heart felt.`  
  얼음이 녹고, 마음이 닿다.
- `A spell for a smile.`  
  미소를 위한 마법 한 줄.
- `Ordinary days, extraordinary us.`  
  평범한 날들, 특별했던 우리.
- `Meaning in the meaningless.`  
  의미 없는 것들 속의 의미.

## Waiting & Meeting (긴 기다림과 짧은 만남)

- `Fifty years, a mere wink.`  
  50년, 그저 한 번의 깜빡임.
- `Wait for the starlight.`  
  별빛이 닿기를 기다려라.
- `Echoes of a hero.`  
  용사가 남긴 메아리.
- `Walk slow, talk long.`  
  천천히 걷고, 길게 대화하라.
- `Parting is a new start.`  
  작별은 새로운 시작일 뿐.

## Magic & Heart (마법과 마음)

- `Beyond magic, towards you.`  
  마법을 넘어, 당신에게로.
- `Imagine the impossible joy.`  
  불가능한 기쁨을 상상하라.
- `A journey to say hello.`  
  안녕이라 말하기 위한 여정.
- `Time flows, love stays.`  
  시간은 흐르고, 사랑은 머문다.
- `End of quest, start of life.`  
  퀘스트의 끝, 삶의 시작.
