# code-coverage-summary maintenance notes

## 1. Quick status

- Action runtime: `node20` in `/home/runner/work/code-coverage-summary/code-coverage-summary/action.yml`
- Build entrypoint: `dist/index.js`
- Local verification used for this review:

```bash
cd /home/runner/work/code-coverage-summary/code-coverage-summary
npm ci
npm test
npm run build
```

- Current local result:
  - `npm test` ✅ `38` suites, `407` tests passed
  - `npm run build` ✅ bundled `dist/index.js`

## 2. Common GitHub Action maintenance references

### Official GitHub docs

- Metadata syntax
  - https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax
- Create a JavaScript action
  - https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action
- Workflow syntax
  - https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Workflow commands and toolkit usage
  - https://docs.github.com/en/actions/reference/workflows-and-actions
- Secure use reference
  - https://docs.github.com/en/actions/reference/security/secure-use
- Immutable releases and tags for actions
  - https://docs.github.com/en/actions/how-tos/create-and-publish-actions/using-immutable-releases-and-tags-to-manage-your-actions-releases

### Official GitHub repositories

- JavaScript action template
  - https://github.com/actions/javascript-action
- TypeScript action template
  - https://github.com/actions/typescript-action
- GitHub Actions toolkit
  - https://github.com/actions/toolkit

### Common maintenance issues to keep watching

- Runtime deprecations and hosted runner changes
  - https://github.blog/changelog/2025-02-12-notice-of-upcoming-deprecations-and-breaking-changes-for-github-actions/
- Mutable action tags in workflows
  - Prefer immutable releases or commit SHAs for third-party actions
- Over-broad token permissions
  - Keep `permissions:` minimal per job
- Missing bundled output for JavaScript actions
  - Keep `dist/index.js` updated when `src/**/*.ts` changes

## 3. Project requirements vs existing tests

| Area | Status | Representative tests |
| --- | --- | --- |
| Runtime and packaging | ✅ met | `__tests__/nfr/nfr-001-node20-runtime.test.ts`, `nfr-002-cross-platform`, `nfr-003-no-docker`, `nfr-004-no-dotnet` |
| Action inputs and defaults | ✅ met | `__tests__/index.test.ts` |
| Input validation | ✅ met | `__tests__/input-validator.test.ts`, `__tests__/nfr/nfr-037-input-validation.test.ts` |
| File discovery and globbing | ✅ met | `__tests__/file-discovery.test.ts` |
| Cobertura XML parsing | ✅ met | `__tests__/coverage-parser.test.ts`, `__tests__/parsing-errors.test.ts` |
| Output generation | ✅ met | `__tests__/output-generator.test.ts` |
| Output destination | ✅ met | `__tests__/output-destination.test.ts` |
| Threshold enforcement | ✅ met | `__tests__/threshold-enforcement.test.ts`, `__tests__/error-priority.test.ts` |
| Security / NFR coverage | ✅ met | `__tests__/nfr/nfr-033-no-xxe.test.ts`, `nfr-034-safe-parser`, `nfr-035-no-secret-leak`, `nfr-038-path-traversal`, `nfr-039-resource-limits` |

## 4. Simple examples

### Run the repository checks

```bash
cd /home/runner/work/code-coverage-summary/code-coverage-summary
npm test
npm run build
```

### Use the action with one Cobertura file

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: src/coverage.cobertura.xml
    format: text
    output: console
```

### Use the action with multiple Cobertura files

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: src/coverage.aggregate-a.xml,src/coverage.aggregate-b.xml
    badge: 'true'
    format: markdown
    output: console
    thresholds: '50 75'
```

### Use the action with compatibility fixtures already in this repo

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: >-
      src/coverage.MATLAB.xml,
      src/coverage.gcovr.xml,
      src/coverage.simplecov.xml,
      src/coverage.cobertura.xml
    format: markdown
    output: console
```

## 5. TypeScript source test scenarios to keep adding

### `src/index.ts`

- invalid input combinations
- exact `core.setFailed()` message priority
- mixed CSV + glob filename input

### `src/file-discovery.ts`

- repeated matches across multiple patterns
- workspace-relative path normalization on Windows and POSIX
- deterministic ordering for overlapping glob patterns

### `src/coverage-parser.ts`

- package arrays vs single package object
- missing package attributes with valid root metrics
- mixed files where only some roots contain branch metrics
- very small decimal values and integer complexity values

### `src/output-generator.ts`

- threshold boundaries: below / equal / above
- markdown/text formatting with every hide/show combination
- aggregate output from mixed fixture families

### `src/output-destination.ts`

- file overwrite behavior
- output file extension from `format`
- combined console + file path on all supported runners

### `src/threshold-enforcer.ts`

- lower-only threshold input
- clamped thresholds above `100`
- fail message formatting for markdown vs text annotations

## 6. CI workflow suggestions for `.github/workflows/test-action.yml`

### Implemented now

- Use explicit valid Cobertura fixtures from `src/`
- Stop deleting XML fixtures during CI
- Keep aggregate, compatibility, and edge-case fixture runs separate

### Suggested next improvements

- Pin third-party actions to immutable SHAs
- Add a small docs-only job or markdown link checker if documentation becomes larger
- Add a fixture manifest file if the list of Cobertura samples keeps growing
- Consider a dedicated fixture directory layout:

```text
src/fixtures/cobertura/valid/
src/fixtures/cobertura/aggregate/
src/fixtures/cobertura/invalid/
```

## 7. Cobertura XML ecosystem references

### Generators / producers seen in this repository

- Coverlet-style Cobertura
  - local fixture: `src/coverage.cobertura.xml`
- gcovr
  - local fixture: `src/coverage.gcovr.xml`
  - upstream: https://github.com/gcovr/gcovr
- SimpleCov Cobertura formatter
  - local fixture: `src/coverage.simplecov.xml`
  - upstream: https://github.com/jessebs/simplecov-cobertura
- MATLAB coverage plugin
  - local fixture: `src/coverage.MATLAB.xml`

### Other GitHub ecosystem components worth watching

- Cobertura conversion from LCOV
  - https://github.com/eriwen/lcov-to-cobertura-xml
- Cobertura diff/report tooling
  - https://github.com/aconrad/pycobertura
- Jenkins Cobertura/coverage consumers
  - https://github.com/jenkinsci/cobertura-plugin
  - https://github.com/jenkinsci/coverage-plugin

### Better test XML file management

- Keep one minimal fixture per producer family
- Keep aggregate fixtures separate from single-file fixtures
- Keep invalid fixtures separate from CI happy-path fixtures
- Prefer explicit comma-separated fixture lists in workflows over wide globs
- When a new producer is added, add:
  1. one minimal valid XML file
  2. one parser test
  3. one workflow usage example
