# Contract: GitHub Action Interface

## Inputs (action.yml)
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `filename` | string | _required_ | Comma-separated list or glob patterns for Cobertura XML files. |
| `badge` | boolean string | `false` | Include a Shields.io badge in output. |
| `fail_below_min` | boolean string | `false` | Fail the workflow if summary line rate is below the lower threshold. |
| `format` | string | `text` | Output format (`text`, `markdown`, or `md`). |
| `hide_branch_rate` | boolean string | `false` | Hide branch rate metrics (overridden when branch metrics are absent). |
| `hide_complexity` | boolean string | `false` | Hide complexity values in output. |
| `indicators` | boolean string | `true` | Include health indicators in output. |
| `output` | string | `console` | Output destination (`console`, `file`, `both`). |
| `thresholds` | string | `50 75` | Lower/upper thresholds for badge and indicator classification. |

## Outputs
The action emits formatted output to stdout and/or a file. It does not currently declare formal GitHub Action outputs in `action.yml`.

### Output files
- `code-coverage-results.txt` for text output
- `code-coverage-results.md` for markdown output

## Behavioral Contracts
- **Aggregation**: Summary counts (`linesCovered`, `linesValid`, `branchesCovered`, `branchesValid`, `complexity`) are summed across all matched files. Summary `lineRate` and `branchRate` are unweighted averages of per-file root rates.
- **Branch suppression**: Branch-related columns are omitted when branch metrics are absent (all zeros) even if `hide_branch_rate` is `false`.
- **Threshold parsing**: `thresholds` accepts `"<lower> <upper>"` or `"<lower>"`, clamps to 0–100, and ensures `upper >= lower` using the legacy adjustment rule.
- **Badge classification**: Summary line rate < lower -> `critical`, between lower and upper -> `yellow`, >= upper -> `success`.
- **Failure behavior**: When `fail_below_min` is true and summary line rate is below lower threshold, the action fails with a descriptive message.
