# Release Procedure

This document is the maintainer and agent checklist for releasing this Zebar pack.

## Versioning

- Use SemVer in `zpack.json`.
- First marketplace release: `0.1.0`.
- Patch fixes, documentation corrections, and small visual refinements: increment `0.1.x`.
- New features, provider behavior changes, or meaningful variant improvements before `1.0`: increment `0.x.0`.
- Keep the Git tag aligned with `zpack.json`, for example `v0.1.0`.
- Do not use `zebar publish --version-override` unless the user explicitly asks for a one-off emergency publish; the default policy is to update `zpack.json`.

## Pre-Release Checklist

- Confirm `zpack.json` is the canonical pack contract and includes the intended `name`, `version`, `repositoryUrl`, widgets, privileges, presets, and preview images.
- Keep `vanilla` and `with-glazewm` documented as supported variants.
- Keep `with-komorebi` documented as builds successfully but needing tester feedback until it is runtime-tested.
- Keep `resources/preview-image-1.png` as the marketplace preview unless the user supplies a replacement.
- Confirm `.env` and other secret-bearing env files are ignored; commit only `.env.example`.
- Never commit `ZEBAR_PUBLISH_TOKEN`.
- Use Conventional Commits with `type(scope): subject`.

## Local Validation

Run these before release:

```powershell
pnpm install
pnpm validate:pack
pnpm typecheck
pnpm build
git status --short --untracked-files=all
```

Runtime validation policy:

- Daily development can use the local custom widget from this repository.
- Release validation should also install or load the release candidate separately from the marketplace/custom-pack path when practical.
- Verify `vanilla` and `with-glazewm` before publishing.
- Do not claim `with-komorebi` as fully verified until it has been tested with Komorebi.

## Publish Steps

Do not publish unless the user explicitly approves.

1. Update `zpack.json` version.
2. Update README/release notes if support status, screenshots, or helper requirements changed.
3. Commit the release prep.
4. Create and push a Git tag such as `v0.1.0`.
5. Create a GitHub Release for the tag.
6. Set the token in the current shell or a local secret manager:

```powershell
$env:ZEBAR_PUBLISH_TOKEN = "<token>"
```

7. Publish with Zebar CLI:

```powershell
zebar publish `
  --pack-config .\zpack.json `
  --commit-sha <release-commit-sha> `
  --release-notes "<short release notes>" `
  --release-url "https://github.com/lucidust/zebar-rose-pine-dawn/releases/tag/v<version>"
```

8. Confirm the marketplace entry, preview image, metadata, and install behavior.

## Secret Handling

- `.env` may exist locally for convenience and may contain `ZEBAR_PUBLISH_TOKEN`.
- `.env.example` documents the variable name only and must not contain a real token.
- If a real token is ever committed, stop and rotate the token before continuing release work.
