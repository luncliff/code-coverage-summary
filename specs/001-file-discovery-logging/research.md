# Research: File discovery and diagnostic logging

**Spec**: `/specs/001-file-discovery-logging/spec.md`

## Sources

- GitHub Actions toolkit glob README: https://github.com/actions/toolkit/blob/main/packages/glob/README.md
- @actions/glob npm package page (deterministic ordering, dedupe, pattern behaviors): https://www.npmjs.com/package/@actions/glob

## Decisions

### Deterministic ordering + deduplication from @actions/glob

- **Decision**: Rely on `@actions/glob` to return deterministically ordered, de-duplicated file lists and log files in the order returned.
- **Rationale**: The npm package documentation states results are deterministically ordered and de-duplicated, which directly satisfies the spec requirements for stable ordering and unique matches.
- **Alternatives considered**: Manual sorting and set-based deduplication in the action implementation. Rejected to avoid extra passes and to keep behavior aligned with the toolkit’s documented guarantees.

### Pattern semantics and parsing

- **Decision**: Pass comma-separated patterns as newline-separated inputs to `glob.create(...)` without reinterpreting the glob syntax. Preserve behavior for globstar (`**`), single-character (`?`), bracket ranges (`[...]`), comments (`#`), excludes (`!`), tilde expansion (`~`), dotfiles, and Windows path/case handling.
- **Rationale**: The toolkit README and npm page define supported glob syntax, comment/exclude semantics, and platform nuances, so preserving these behaviors keeps input parsing consistent with user expectations and documentation.
- **Alternatives considered**: Implementing a custom glob parser or restricting the supported pattern syntax. Rejected because it would diverge from the toolkit behavior and break interface parity.

### Symbolic link handling

- **Decision**: Keep the default `@actions/glob` behavior of following symbolic links and do not add a new input for this feature.
- **Rationale**: The toolkit README notes following symlinks is the default and commonly appropriate. The feature spec does not introduce a new input, so maintaining default behavior preserves action interface parity.
- **Alternatives considered**: Add a `follow-symbolic-links` input. Rejected to avoid interface changes beyond the scope of this feature.

### Logging integration with @actions/core

- **Decision**: Emit `Coverage File: ...` lines using `@actions/core` logging APIs as files are iterated, keeping the output in discovery order.
- **Rationale**: Using the toolkit’s logging APIs preserves action log formatting and ensures stable ordering aligned with the glob output.
- **Alternatives considered**: Buffer and log after processing. Rejected because it complicates ordering guarantees and reduces log immediacy.

### fast-xml-parser remains unchanged

- **Decision**: Leave existing `fast-xml-parser` configuration untouched for this feature.
- **Rationale**: File discovery and diagnostic logging are upstream of parsing; changing parser behavior is out of scope and would risk interface parity.
- **Alternatives considered**: Adjust parser configuration alongside discovery changes. Rejected to keep the feature focused on discovery behavior.
