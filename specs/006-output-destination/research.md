# Research: Output Destination (006)

## Decision 1: Use GitHub Actions Toolkit (`@actions/core`) for log output and failures

**Decision**: Use `@actions/core` logging (`core.info`, `core.debug`, `core.notice`, `core.warning`, `core.error`) for console-visible output, and use `core.setFailed(...)` to fail the step on invalid `output` values or write failures.

**Rationale**: GitHub documents workflow commands and the toolkit mapping (e.g., `core.debug`, `core.startGroup`, `core.setFailed`). Using `@actions/core` keeps the action aligned with official mechanisms and preserves cross-runner behavior. Debug output is expected to be gated by GitHub’s step debug logging flag (`ACTIONS_STEP_DEBUG=true`), which is consistent with using `core.debug`.

**Alternatives considered**:
- Emit raw workflow commands (e.g., `::error::...`, `::debug::...`) directly to stdout — rejected because the toolkit already provides these capabilities with consistent escaping and behavior.
- Use the job summary (`GITHUB_STEP_SUMMARY`) instead of log output — rejected because the feature contract requires action-log output and/or a workspace file, not a job summary.

## Decision 2: Write report files to the workspace using standard Node filesystem APIs

**Decision**: For `output=file` and `output=both`, write the generated report string to a deterministic filename in the workflow working directory (workspace root):
- `format=text` → `code-coverage-results.txt`
- `format=markdown` → `code-coverage-results.md`

**Rationale**: A JavaScript action runs directly on the runner with Node available and should avoid relying on external binaries for cross-platform compatibility. Writing to the working directory using Node filesystem APIs is deterministic and avoids network dependency.

**Alternatives considered**:
- Write to an arbitrary user-provided path — rejected because the legacy contract uses fixed filenames and writing to arbitrary locations increases risk and complexity.
- Upload artifacts directly from the action — rejected because it introduces workflow-level concerns and potentially new network behavior.

## References & usage comment

The following official sources were reviewed and will be used to justify implementation choices and test expectations:

- https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
  - Used to confirm how log commands and toolkit functions map to runner behavior (debug/notice/warning/error/grouping) and to support using `@actions/core` for log output.
- https://github.com/actions/toolkit/tree/main/packages/core
  - Used to confirm `@actions/core` APIs for logging and step failure (`setFailed`) and how debug output is gated.
- https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
  - Used to confirm how step debug logging is enabled (`ACTIONS_STEP_DEBUG=true`) and therefore when `core.debug` output should appear.
- https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action
  - Used to support the cross-platform, Node-only action packaging expectation (avoid external binaries) that underpins the file-writing approach.
