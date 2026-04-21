# Brand Copy

Candidate copy for the left brand chip.

## Usage

- Top line: sentence
- Bottom line: category
- Intended default placement: the `Zebar Rose Pine Dawn` text area in the left brand chip
- Language policy: keep shipped runtime text in English by default; use the Korean companion document for reference only

## Runtime Rules

- Runtime entries are stored in `src/brand-copy.entries.json`.
- Rotation and display rules are configured in `src/brand-copy.ts`.
- Default behavior: deterministic daily random rotation with one random category per local day and one random sentence selected within that category.
- Recommended adjustment surface:
  `language`: `en` or `ko`
  `mode`: `daily-random` or `fixed`
  `rotationDays`: keep at `1` for daily changes, increase only if slower rotation is preferred
  `seedOffset`: shifts the daily sequence without editing the entry list
  `allowedCategories`: optional category-id filter for narrower thematic pools
  `bottomLineMode`: `category`, `variant`, or `category-and-variant`

## Time & Patience

- `Ten years, a life's change.`
- `Just a moment, but forever.`
- `Waste years, find flowers.`
- `Slow magic, deep roots.`
- `Endless time, finite love.`

## Himmel's Legacy

- `Trifles made us us.`
- `Statues fade, hearts remain.`
- `Fairy tales are real now.`
- `Live so she won't be alone.`
- `A smile worth a century.`

## Journey & Destination

- `The detour is the journey.`
- `To know him, I walk.`
- `Backtrack to move forward.`
- `Search for the useless spells.`
- `Sunrise is better together.`

## Frieren's Perspective

- `Human lives, blink of an eye.`
- `Tearful goodbye, hopeful hello.`
- `Small steps, grand memories.`
- `Magic is imagination.`
- `Wait for the melt.`

## The Warmth Left Behind

- `Cold metal, warm memories.`
- `Himmel's path, Frieren's pace.`
- `Old scars, new blossoms.`
- `Love learned too late.`
- `Brief lives, eternal marks.`

## The Power of Trifles

- `Sweet grapes, sour days.`
- `Ice melt, heart felt.`
- `A spell for a smile.`
- `Ordinary days, extraordinary us.`
- `Meaning in the meaningless.`

## Waiting & Meeting

- `Fifty years, a mere wink.`
- `Wait for the starlight.`
- `Echoes of a hero.`
- `Walk slow, talk long.`
- `Parting is a new start.`

## Magic & Heart

- `Beyond magic, towards you.`
- `Imagine the impossible joy.`
- `A journey to say hello.`
- `Time flows, love stays.`
- `End of quest, start of life.`
