# Research: Cobertura XML parsing (003)

**Date**: 2026-03-15  
**Branch**: `003-cobertura-xml-parsing`  
**Spec**: `specs/003-cobertura-xml-parsing/spec.md`

## Sources

- Cobertura XML Output — gcovr documentation: https://gcovr.com/en/stable/output/cobertura.html
- GitLab Cobertura coverage report docs: https://docs.gitlab.com/ci/testing/code_coverage/cobertura/
- GitHub Actions JavaScript action docs: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action

---

## Decision 1: Treat `line-rate`, `lines-covered`, and `lines-valid` as required root attributes

- **Decision**: Require `@_line-rate`, `@_lines-covered`, and `@_lines-valid` on the `<coverage>` root element; if any are missing or non-numeric, emit a parsing error that includes the filename and fail the step.
- **Rationale**: Cobertura’s documented root attributes define the overall coverage summary used by downstream consumers. Enforcing them ensures compatibility and prevents misleading summaries.
- **Alternatives considered**: Attempting to derive missing values from package data or allowing missing attributes. Rejected because the spec mandates strict validation and parity with Cobertura consumers that expect these attributes.

## Decision 2: Keep branch metrics optional and suppress branch output when absent

- **Decision**: Treat `branch-rate`, `branches-covered`, and `branches-valid` as optional; when absent, default branch values to zero and allow parsing to continue while suppressing branch output downstream.
- **Rationale**: The Cobertura format allows reports that omit branch metrics (common in line-only coverage tools). GitLab and Cobertura docs highlight that branch metrics may not be present, so the parser must accept those files.
- **Alternatives considered**: Enforcing branch metrics as required. Rejected because it would break compatibility with widely used coverage generators and contradict the feature spec.

## Decision 3: Align failure behavior with GitHub Actions JavaScript action guidance

- **Decision**: Use `@actions/core` error handling (`setFailed` with a descriptive message) when parsing errors occur, ensuring the filename is included in the message.
- **Rationale**: GitHub’s JavaScript action guidance recommends `@actions/core` for signaling failures, which preserves standard log formatting and action parity.
- **Alternatives considered**: Throwing uncaught errors without `setFailed`. Rejected because it leads to inconsistent action output and less clear failure messages.
