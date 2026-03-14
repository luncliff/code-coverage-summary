# Contract: Output Destination

## Scope

This contract specifies the behavior of the `output` input that controls where the generated report is written.

## Inputs

### `output`

| Value | Action log contains report? | Workspace file created? |
|-------|-----------------------------|--------------------------|
| `console` | Yes | No |
| `file` | No | Yes |
| `both` | Yes | Yes |

## Output files (legacy filenames)

When a file is written, the filename depends only on the selected `format`:

- `format=text` → `code-coverage-results.txt`
- `format=markdown` → `code-coverage-results.md`

## Error behavior

- If `output` is not one of `console`, `file`, or `both`, the action fails and logs:

```text
Error: Unknown output type.
```

## Notes

- Diagnostic logging such as discovered coverage file paths may still be written to the action log; the contract above refers specifically to the *final report* content.
