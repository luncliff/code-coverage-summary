<!--
Sync Impact Report
- Version change: N/A → 0.1.0
- Modified principles: N/A (initial adoption)
- Added sections: Core Principles (filled), Repository Constraints, Development Workflow & Quality Gates, Governance (filled)
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - N/A .specify/templates/commands/*.md (folder not present)
- Follow-up TODOs: None
-->

# code-coverage-summary Constitution

## Core Principles

### I. Action Interface Parity (NON-NEGOTIABLE)
This repository MUST preserve the user-facing GitHub Action interface and behavior from the upstream
project: input names, defaults, parsing semantics, output format, and failure behavior.

Any intentional behavior change MUST be treated as a breaking change: it requires a MAJOR bump,
migration notes, and a test that demonstrates the old vs new behavior.

### II. Cross-Platform, Node-Only Runtime
The action MUST be runnable as a JavaScript action (`runs.using: node20`) on GitHub-hosted runners
across Linux, Windows, and macOS.

Implementation MUST avoid platform-specific assumptions (path separators, case sensitivity,
line endings) and MUST not depend on Docker or a preinstalled .NET runtime.

### III. Preserve Upstream Artifacts
Legacy upstream artifacts (e.g., the original .NET/Docker implementation and related files) MUST be
kept in the repository unless there is a strong, documented reason to remove them.

When deprecating legacy assets, prefer disabling workflows or excluding paths rather than deleting
files, and clearly label what is “legacy” vs “active” in documentation.

### IV. Security-First Maintenance
Security hygiene is part of the definition of “done”. The project MUST:
- Keep dependency update automation enabled (e.g., Dependabot) and address alerts promptly.
- Prefer least-privilege workflow permissions and pin third-party GitHub Actions by SHA in CI.
- Avoid introducing network calls or telemetry as part of normal action execution.

### V. Quality Gates: Tests + Static Analysis
Changes MUST be covered by automated tests when they affect parsing, formatting, thresholds, or
file discovery. Regression tests MUST use representative coverage fixtures.

Static analysis MUST remain configured and healthy (e.g., SonarCloud). New code MUST not reduce
maintainability unnecessarily, and complexity increases MUST be justified.

## Repository Constraints

- The MIT license MUST be preserved.
- The port to JavaScript MUST not remove user-facing features or inputs.
- The repository MAY contain legacy source trees (e.g., `src/CodeCoverageSummary/`) strictly for
  historical reference; they MUST be excluded from TypeScript build/test and static analysis.

## Development Workflow & Quality Gates

- Every PR MUST pass: TypeScript build, unit tests, and lint/format checks (if present).
- PRs that affect action behavior MUST update documentation and add/adjust tests.
- Releases MUST follow semantic versioning.

## Governance

- This constitution supersedes informal practices for this repository.
- Amendments MUST be made via pull request and MUST include:
  - The rationale for the change
  - The affected principles/sections
  - Any required migration notes
  - Any new/updated tests or explicit justification for why tests are not applicable
- Versioning policy for the constitution:
  - MAJOR: removes or redefines principles in a backward-incompatible way
  - MINOR: adds a new principle/section or materially expands constraints
  - PATCH: clarifies wording without changing intent
- Compliance review expectation: feature specs and implementation plans MUST include an explicit
  “Constitution Check” section and record any violations with justification.

**Version**: 0.1.0 | **Ratified**: 2026-03-14 | **Last Amended**: 2026-03-14
