# Cobertura XML Parsing Contract

**Contract Type**: Cobertura XML file schema (subset)  
**Spec**: `specs/003-cobertura-xml-parsing/spec.md`  
**Source of Truth**: Cobertura coverage-04.dtd + action parsing rules

---

## Coverage Root (`<coverage>`)

| Attribute | Required | Type | Notes |
|-----------|----------|------|-------|
| `line-rate` | Yes | Number (0–1) | Overall line coverage ratio. |
| `lines-covered` | Yes | Integer | Count of covered lines. |
| `lines-valid` | Yes | Integer | Count of valid/executable lines. |
| `branch-rate` | No | Number (0–1) | Optional branch coverage ratio. Defaults to `0` when absent. |
| `branches-covered` | No | Integer | Optional covered branch count. Defaults to `0` when absent. |
| `branches-valid` | No | Integer | Optional valid branch count. Defaults to `0` when absent. |
| `complexity` | No | Number | Optional complexity metric; defaults to `0`. |

**Rules**
- Missing or non-numeric required attributes cause a parsing error that includes the filename.
- Optional branch attributes may be omitted without failing the run.

---

## Package Element (`<package>`)

Each `<package>` element produces one package row in the report.

| Attribute | Required | Type | Notes |
|-----------|----------|------|-------|
| `name` | No | String | If missing/empty, fallback to `<basename> Package <i>` per file. |
| `line-rate` | No | Number (0–1) | Defaults to `0` when missing/unparseable. |
| `branch-rate` | No | Number (0–1) | Defaults to `0` when missing/unparseable. |
| `complexity` | No | Number | Defaults to `0` when missing/unparseable. |

**Rules**
- Encounter order determines fallback naming index `i`.
- Missing numeric attributes do not fail parsing; they default to `0`.

---

## Error Contract

Parsing failures must include the filename in the log message (for example,
`Parsing Error: Overall line rate not found - coverage.cobertura.xml`) and must
fail the action step via `@actions/core` error handling.
