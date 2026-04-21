# CLAUDE.md

This repository uses the same pinned local interpretation metadata for Claude Code.

This file is a compatibility entry point, not an independent rule source.

## Canonical local sources

- Read [`repo-metadata.yaml`](./repo-metadata.yaml) first for the active repository interpretation metadata.
- Read [`.agent/standards-baseline.md`](./.agent/standards-baseline.md) for the pinned local meaning of behavior-changing metadata.
- Read [`README.md`](./README.md) for the repository role, variants, and developer-facing context.
- Read [`zpack.json`](./zpack.json) when the task touches the Zebar pack contract, shipped widgets, or packaging behavior.

## Working rules

- Treat `repo-metadata.yaml` and `.agent/standards-baseline.md` as the canonical local interpretation surface for this repository.
- Apply rule sources in this order: repo-local explicit exceptions, validated legacy conventions, project profile rules, global rules.
- This repository currently pins `repo_mode: greenfield`; do not imply a validated legacy convention layer unless one is documented later.
- This repository currently pins `profile: service`; read changes first for Zebar runtime stability, variant-level behavior consistency, and pack contract safety.
- This repository currently pins `commit_style_source: central_rules` and `central_rules_mode: required`; treat the default commit policy as Conventional Commits with `type(scope): subject` unless a higher-priority local source documents an allowed exception.
- Treat `zpack.json` as the canonical pack contract artifact for shipped widgets.
- Do not infer the meaning of behavior-changing metadata enum values from names alone; use the pinned baseline definitions.
- Write user-facing responses and plans in Korean by default.
- Keep code, identifiers, file paths, YAML keys, and canonical rule documents in their original language unless the task explicitly requires translation.
- Operate the repository in English by default. Use companion Korean documents such as `README.ko.md` to support Korean readers.
- Keep shipped runtime UI strings and default widget labels in English unless a task explicitly introduces localization.
- Treat this file as a navigation layer. Update `repo-metadata.yaml` and `.agent/standards-baseline.md` when local interpretation rules change.
