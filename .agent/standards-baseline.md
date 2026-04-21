# Standards Baseline

This document pins the local meaning of behavior-changing metadata for this repository.

## Baseline

- Standards source: `agent-workspace-standards` canonical documents (`README.md`, `docs/global-rules.md`, `docs/profiles.md`, `docs/validation.md`, `rules/summary.yaml`)
- Baseline version or commit: `workspace snapshot 2026-04-22`
- Canonical local metadata file: `repo-metadata.yaml`
- Canonical baseline path: `.agent/standards-baseline.md`
- This baseline is referenced directly from `repo-metadata.yaml`; do not duplicate it in `canonical_artifacts`.

## Repo Mode

- Active value: `greenfield`
- Meaning in this repository: This repository has no validated legacy convention layer. When no repo-local exception is pinned, interpret behavior through the selected profile and the workspace global rules.
- If `legacy`: `not applicable`
- Central source used: `README.md#rule-precedence` and `docs/global-rules.md` from `agent-workspace-standards`

## Profile

- Active value: `service`
- Meaning in this repository: Read changes first for pack/runtime stability in Zebar, variant-level behavior consistency, and packaging contract safety across the shipped top bar variants.
- Central source used: `docs/profiles.md#service` from `agent-workspace-standards`
- Highest-priority risk in this repository: a change to `zpack.json`, variant entrypoints, or provider wiring silently changes runtime behavior, widget packaging, or the set of supported provider integrations.
- First review questions: which variant is affected; does the Zebar pack contract change; does the multi-entry build or entry wiring break for a shipped widget?
- Missing context risk in this repository: a change is described without stating whether it affects `vanilla`, `with-glazewm`, `with-komorebi`, or shared runtime behavior.
- Boundaries to keep explicit locally: `zpack.json` as the canonical pack contract, `vite.config.ts` multi-entry build behavior, `src/providers.ts` provider wiring, and `src/entries/*` variant entrypoints.
- Natural local exception types: variant-specific runtime constraints, pack-publishing constraints, or host-environment limitations that should not become shared workspace defaults.

## Precedence

- Canonical precedence labels: `local_exceptions | validated_legacy_conventions | profile_rules | global_rules`
- Active precedence: `local_exceptions -> profile_rules -> global_rules`
- Conflict handling: apply repo-local explicit exceptions first. If no local exception is pinned, interpret through the `service` profile, then fall back to workspace global rules. Do not imply a validated legacy convention layer unless one is explicitly documented later.

## Commit Policy

- `commit_style_source`: `central_rules`
- `central_rules_mode`: `required`
- Meaning in this repository: commit behavior is determined by the workspace central rules unless a higher-priority local source later documents an allowed exception.
- If `commit_style_source` is `central_rules`, canonical commit policy: `Conventional Commits`
- Default commit header form in this repository: `type(scope): subject`
- Scope rule in this repository: `expected by default`
- Allowed type source in this repository: `central rules`
- If `commit_style_source` is `local_history`, authoritative local source: `not applicable`
- Exception handling note: `none`

## Local Exceptions

- Canonical location: `none`
- Notes: `none`
- Check before adding one: confirm that no validated legacy convention already explains the behavior before pinning a repo-local override.
- Interpretation note: use local exceptions for repository-specific runtime or packaging constraints that should override `service` profile or global defaults in this repository.
- Why profile/global rules are insufficient here: only use a local exception when the constraint is specific to this widget pack, its variants, or its host integration boundary.

## Agent Interpretation Rules

- Agents must not infer the meaning of metadata enum values from names alone.
- If this file does not define a behavior-changing value, treat the meaning as unverified.
- When unverified meaning blocks a decision, state the uncertainty explicitly before acting.
- Keep machine-readable summaries and profile bundles aligned with the behaviorally relevant interpretation concepts pinned here.
