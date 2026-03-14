# Quickstart: Coverage Aggregation & Threshold Classification

## Prerequisites
- Node.js 20
- npm

## Install dependencies
```bash
npm install
```

## Build the action
```bash
npm run build
```

## Run tests
```bash
npm test
```

## Local execution (example)
Set GitHub Action inputs as environment variables and run the bundled entrypoint:

```bash
INPUT_FILENAME=src/coverage.cobertura.xml \
INPUT_FORMAT=markdown \
INPUT_THRESHOLDS="50 75" \
INPUT_BADGE=true \
node dist/index.js
```

To test multi-file aggregation, provide a comma-separated list or glob patterns:

```bash
INPUT_FILENAME="src/coverage.cobertura.xml,src/coverage.gcovr.xml" node dist/index.js
```

The output will print to the console by default or write to `code-coverage-results.txt`/`code-coverage-results.md` if `INPUT_OUTPUT=file` or `both` is provided.
