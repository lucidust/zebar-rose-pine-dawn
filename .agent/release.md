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
- Keep `vanilla`, `with-glazewm`, and `with-komorebi` documented as shipped variants.
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
- Verify `vanilla`, `with-glazewm`, and `with-komorebi` before publishing when their host integrations are available.
- If a host integration is unavailable during release validation, document the skipped variant and reason in the release notes.

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

If `ZEBAR_PUBLISH_TOKEN` is not set in the current shell, check the ignored local `.env` file before concluding that the token is unavailable. Do not print the token value.

7. Publish with Zebar CLI:

```powershell
zebar publish `
  --pack-config .\zpack.json `
  --commit-sha <release-commit-sha> `
  --release-notes "<short release notes>" `
  --release-url "https://github.com/lucidust/zebar-rose-pine-dawn/releases/tag/v<version>"
```

8. Confirm the marketplace entry, preview image, metadata, and install behavior.

## Publish Troubleshooting Notes

Use the official `zebar publish` CLI flow above first. The notes below are
only for diagnosing publish attempts that appear to finish locally but do not
show up in the marketplace.

Marketplace state can be checked through the same backend endpoint used by the
Zebar settings UI. Replace the published ID if the pack owner/name changes:

```powershell
$encodedInput = '%7B%22json%22%3A%7B%22id%22%3A%22lucidust.zebar-rose-pine-dawn%22%7D%7D'
$url = "https://api.glzr.io/v1/trpc/widgetPack.getByPublishedId?input=$encodedInput"
$pack = ((Invoke-WebRequest -UseBasicParsing $url).Content | ConvertFrom-Json).result.data.json
$pack | Select-Object publishedId, latestVersion, updatedAt, tarballUrl
$pack.versions | Select-Object version, commitSha, releaseUrl, createdAt
```

If `latestVersion` is still the previous version and the new version is absent
from `versions`, treat the publish as not landed rather than waiting for a UI
cache refresh. The marketplace page displays this API's `latestVersion`.

Known Windows/Scoop observations from the `v0.3.0` publish:

- The Scoop shim and installed Zebar binary were both Windows GUI subsystem
  executables. Direct PowerShell invocation can return an exit code before
  stdout is fully attached/flushed.
- A failed direct invocation produced a Rust panic similar to
  `failed printing to stdout: The pipe is being closed` while printing the file
  list before upload.
- `Start-Process -ArgumentList @(..., '--release-notes', 'text with spaces')`
  can split the release notes into separate CLI arguments. If using
  `Start-Process` for diagnostics, pass a correctly quoted single argument
  string or use `.NET` `System.Diagnostics.ProcessStartInfo.ArgumentList`.
- A real publish must still be confirmed through the marketplace API after the
  command exits; do not infer success from local exit behavior alone.

If the CLI repeatedly fails before the marketplace is updated, inspect the
current Zebar upstream `packages/desktop/src/publish.rs` before using any
manual reproduction. Any direct API upload should mirror the official CLI
payload (`packConfig`, tarball, `commitSha`, `releaseNotes`, `releaseUrl`) and
should be treated as a maintainer-approved fallback, not the default release
path.

## Secret Handling

- `.env` may exist locally for convenience and may contain `ZEBAR_PUBLISH_TOKEN`.
- `.env.example` documents the variable name only and must not contain a real token.
- Check both the current shell environment and the ignored local `.env` file before concluding that `ZEBAR_PUBLISH_TOKEN` is unavailable.
- Never print the token value while checking, loading, publishing, or debugging.
- If a real token is ever committed, stop and rotate the token before continuing release work.
