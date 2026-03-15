# code-coverage-summary

A GitHub Action that reads Cobertura XML coverage files and writes a compact text or markdown summary.

## How To

### Use with 1 Cobertura file

Inputs:

- `filename`: one Cobertura XML file
- `format`: `text`
- `output`: `console`

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: src/coverage.cobertura.xml
    format: text
    output: console
```

### Use with multiple Cobertura files

Inputs:

- `filename`: multiple files, comma-separated paths, or glob patterns
- `badge`: show the line-rate badge
- `thresholds`: lower and upper percentages for badge/indicator colors

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: src/coverage.aggregate-a.xml,src/coverage.aggregate-b.xml
    badge: 'true'
    format: markdown
    output: console
    thresholds: '50 75'
```

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: src/**/*.xml
    badge: 'true'
    format: markdown
    output: console
```

### Use without threshold

Inputs:

- `fail_below_min`: `false` keeps the workflow green
- `format`: `markdown` for PR comment/reporting use
- `output`: `both` to write a file and print to logs

```yaml
- uses: luncliff/code-coverage-summary@main
  with:
    filename: src/coverage.cobertura.xml
    fail_below_min: 'false'
    format: markdown
    output: both
```

## Status

[![Test TypeScript Action](https://github.com/luncliff/code-coverage-summary/actions/workflows/test-action.yml/badge.svg?branch=main)](https://github.com/luncliff/code-coverage-summary/actions/workflows/test-action.yml)

- ✅ [Action inputs and defaults](./project-requirements.md#31-functional-requirements)
- ✅ [File discovery and glob expansion](./project-requirements.md#23-legacy-file-discovery-behavior-glob--comma-separated-lists)
- ✅ [Cobertura parsing and aggregation](./project-requirements.md#24-legacy-cobertura-parsing-expectations)
- ✅ [Output formatting and thresholds](./project-requirements.md#28-output-formatting-behavior)
- ✅ [Output destination and failure messages](./project-requirements.md#29-output-destination-behavior)
- ✅ [Runtime, security, and test coverage constraints](./project-requirements.md#32-non-functional-requirements)

<!-- Coding Agent sync note: keep the requirement summary in this file aligned with `project-requirements.md`; when requirement sections, badges, or example workflows change in either file, update the other file in the same change. -->

Local verification:

```bash
npm install
npm run test
npm run build
```

## References

### GitHub Actions

- [Metadata syntax for actions](https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax)
- [Create a JavaScript action](https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action)
- [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Workflows and actions reference](https://docs.github.com/en/actions/reference/workflows-and-actions)
- [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [Immutable releases and tags for actions](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/using-immutable-releases-and-tags-to-manage-your-actions-releases)
- [JavaScript action template](https://github.com/actions/javascript-action)
- [TypeScript action template](https://github.com/actions/typescript-action)
- [GitHub Actions toolkit](https://github.com/actions/toolkit)

### CI and fixture maintenance

- [Workflow file for action verification](./.github/workflows/test-action.yml)
- [Project requirements and compatibility notes](./project-requirements.md)
- Prefer explicit fixture lists from `src/` for CI happy paths
- Keep invalid Cobertura fixtures out of broad happy-path globs

### Cobertura ecosystem

- [gcovr](https://github.com/gcovr/gcovr)
- [SimpleCov Cobertura formatter](https://github.com/jessebs/simplecov-cobertura)
- [lcov-to-cobertura-xml](https://github.com/eriwen/lcov-to-cobertura-xml)
- [pycobertura](https://github.com/aconrad/pycobertura)
- [Jenkins coverage plugin](https://github.com/jenkinsci/coverage-plugin)
