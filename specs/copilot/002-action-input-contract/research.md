# Research: Action Contract Inputs (002-action-input-contract)

**Date**: 2026-03-14  
**Branch**: `copilot/002-action-input-contract`  
**Spec**: `specs/002-action-input-contract/spec.md`

---

## Research Question 1: Boolean Input Parsing — Strict Semantics

**Decision**: Use `core.getInput(name).toLowerCase() === 'true'` for every boolean-like input, including `indicators`.

**Rationale**:  
The `@actions/core` toolkit provides `getBooleanInput()` as the canonical boolean-parsing helper; it accepts exactly `true|True|TRUE` → `true` and `false|False|FALSE` → `false` per the YAML 1.2 Core Schema, and throws on any other value. However, the existing action already uses `getInput().toLowerCase() === 'true'` for five of the six boolean inputs — and the spec (FR-006) defines the same semantics: only case-insensitive `"true"` is `true`, every other value is `false` (no exception thrown). The simpler explicit comparison is consistent with the existing codebase style and avoids a behavior change (throwing on `"1"`, `"yes"`, etc. would be a breaking change for current users who may pass non-standard strings).

**Key finding — the `indicators` bug**:  
`src/index.ts` line 21 reads:
```ts
const indicators = core.getInput('indicators').toLowerCase() !== 'false'
```
This inverts the logic: any value that is not `"false"` (e.g. `"1"`, `"yes"`, `"on"`, empty string) evaluates to `true`. The fix is:
```ts
const indicators = core.getInput('indicators').toLowerCase() === 'true'
```
This aligns `indicators` with every other boolean-like input and satisfies FR-006.

**Alternatives considered**:  
- `core.getBooleanInput()` — rejected because it throws `TypeError` on unrecognized values (e.g. `"1"`, `"yes"`), which would be a breaking change for existing workflows that happen to pass non-standard strings.  
- `!== 'false'` pattern — rejected explicitly by FR-006; this is the existing bug.

**References**:  
- `@actions/core` README & source: https://github.com/actions/toolkit/tree/main/packages/core  
- `getBooleanInput` YAML 1.2 spec: https://yaml.org/spec/1.2/spec.html#id2804923  
- GitHub Actions toolkit issue #361 (original boolean pitfall discussion): https://github.com/actions/toolkit/issues/361

---

## Research Question 2: Filename CSV / Glob Parsing

**Decision**: The current `filename` parsing logic in `src/index.ts` is correct and fully compliant with FR-003 through FR-005. No changes required.

**Rationale**:  
The existing implementation correctly:
1. Splits on `,` (FR-003 — comma-separated list)
2. `.trim()`s each token, removes empty tokens with `.filter()` (handles leading/trailing spaces and consecutive commas)
3. `.join('\n')` before passing to `glob.create()` — the `@actions/glob` API requires newline-delimited patterns, not comma-delimited
4. Fails with a clear error message when no files match

```ts
const patterns = filename
  .split(',')
  .map(p => p.trim())
  .filter(p => p.length > 0)
const globber = await glob.create(patterns.join('\n'))
const files = await globber.glob()
```

Spaces within paths are preserved because `.trim()` only strips leading/trailing whitespace around commas, not interior spaces in individual paths (FR-005).

**Alternatives considered**:  
- Delimiter-only (no CSV) — rejected; spec and action.yml both document CSV support.  
- Splitting on whitespace — rejected; paths may contain spaces.

**References**:  
- `@actions/glob` package: https://github.com/actions/toolkit/tree/main/packages/glob  
- `action.yml` input description: "A comma separated list of code coverage files to analyse. Also supports using glob patterns."

---

## Research Question 3: Unit-Testing Action Inputs Without a Runner

**Decision**: Use `jest.mock('@actions/core')` to mock `getInput` and `setFailed`, allowing isolated unit tests of the input-parsing layer in `src/index.ts` without a live GitHub Actions runner.

**Rationale**:  
The existing test suite already tests `coverage-parser.ts` and `output-generator.ts` in isolation. No test currently covers `src/index.ts` (the input-parsing and orchestration layer). To test FR-001 through FR-006 without a real runner:

- GitHub Actions passes inputs as environment variables `INPUT_<NAME>` (uppercased, underscores for spaces).
- Two mocking strategies exist:
  1. **`jest.mock('@actions/core')`** — mock `getInput` as a `jest.fn()` returning controlled strings. Preferred because it allows spying on `setFailed`, `info`, etc.
  2. **Set `process.env.INPUT_<NAME>`** — lower-level; works when you want to test the real `@actions/core` call path.

The existing factory-function pattern (`makeSummary()`, `makeOptions()`) in `output-generator.test.ts` is well-suited as a model for constructing input scenarios.

**Test structure recommended for FR-006**:
```ts
describe('boolean input parsing', () => {
  test.each([
    ['true',  true],
    ['True',  true],
    ['TRUE',  true],
    ['false', false],
    ['1',     false],
    ['yes',   false],
    ['on',    false],
    ['',      false],
    ['arbitrary', false],
  ])('indicators="%s" → %s', (value, expected) => {
    // assert parsed boolean equals expected
  })
})
```

**Alternatives considered**:  
- Integration tests using a real runner — rejected for this feature; unit tests are sufficient for input parsing and satisfy Constitution Principle V.
- Testing via `process.env` only — acceptable but `jest.mock('@actions/core')` is cleaner because it avoids relying on `@actions/core`'s internal env-var lookup being stable.

**References**:  
- GitHub Actions core test suite (input mocking patterns): https://github.com/actions/toolkit/blob/main/packages/core/__tests__/core.test.ts  
- Jest mocking documentation: https://jestjs.io/docs/mock-functions

---

## Research Question 4: Scope of Change — Files Affected

**Decision**: This feature touches exactly three areas:

| Area | File | Nature of Change |
|------|------|-----------------|
| Bug fix (FR-006) | `src/index.ts` | One-line fix: `!== 'false'` → `=== 'true'` for `indicators` |
| New tests (FR-001–FR-006) | `__tests__/index.test.ts` (new file) | Input-parsing unit tests using `jest.mock('@actions/core')` |
| Documentation | `README.md` (if needed) | Confirm boolean semantics are documented; no behavior change for existing well-formed inputs |

**Rationale**:  
- `coverage-parser.ts` and `output-generator.ts` are unaffected — they receive already-parsed values.
- `action.yml` is unaffected — no input names or defaults change (FR-004 / SC-004).
- Existing tests pass unchanged — the fix aligns `indicators` with the already-established parsing pattern used by all other boolean inputs.

**Alternatives considered**:  
- Changing `action.yml` defaults — rejected; SC-004 forbids removing or renaming inputs.
- Modifying output-generator behavior — not applicable to this feature.

---

## Summary of All Decisions

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| 1 | Fix `indicators` parsing: `!== 'false'` → `=== 'true'` | FR-006 violation; breaks strict boolean contract | ✅ Resolved |
| 2 | All boolean inputs use `.toLowerCase() === 'true'` | Consistent, explicit, non-throwing; aligns with `getBooleanInput()` semantics for valid values | ✅ Resolved |
| 3 | `filename` CSV/glob parsing is already correct | Existing split/trim/filter/join logic satisfies FR-003–FR-005 | ✅ Resolved (no change needed) |
| 4 | New `__tests__/index.test.ts` using `jest.mock('@actions/core')` | Covers FR-001–FR-006 with input-matrix test cases | ✅ Resolved |
| 5 | `action.yml`, `coverage-parser.ts`, `output-generator.ts` unchanged | Scope is limited to input-parsing layer; no interface changes | ✅ Resolved |
