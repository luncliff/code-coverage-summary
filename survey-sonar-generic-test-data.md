
# Technical Survey: SonarCloud/SonarQube “Generic Coverage” from Cobertura XML

## Executive summary
Many ecosystems already emit **Cobertura XML** because it’s a widely interoperable CI/reporting artifact. SonarCloud/SonarQube, meanwhile, can import either:

- **Language/tool-specific coverage formats** (preferred when available because they reduce path-mapping and format mismatch risk).
- **Generic Coverage XML** via `sonar.coverageReportPaths` (useful when a tool isn’t directly supported, or when teams want one uniform import path across languages).

Sonar positions the generic format specifically for “integrate a tool that is not directly supported… by having your custom CI task convert the output… to this generic format”.
Reference: [SonarQube Cloud generic test data documentation](https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/generic-test-data)

This repository’s proposed feature (“Cobertura → Sonar Generic Coverage”) is most valuable for:

- Teams already producing Cobertura (Python/.NET/JS/C++) but blocked by Sonar import limitations.
- Monorepos where teams want consistent coverage import wiring.
- CI environments where “path mismatch” causes Sonar to ignore coverage unless normalized.


## Cobertura vs. Generic Coverage
The two formats solve different problems. Cobertura is a **general-purpose coverage exchange format** used by many tools. Sonar Generic Coverage is a **Sonar ingestion format** designed to be simple and predictable for the scanner.

| Topic | Cobertura XML | Sonar Generic Coverage XML |
| --- | --- | --- |
| Primary purpose | Tool-agnostic coverage artifact used by test/CI/reporting ecosystems | Sonar-specific import format for unsupported or normalized toolchains |
| Typical producer | coverage.py, Coverlet, Istanbul, gcovr, OpenCppCoverage | Custom conversion step, Sonar-targeted exporter, or SonarSource example scripts |
| Per-line data | `hits` count, branch flags, optional condition details | boolean `covered`, optional branch totals only |
| Path model | commonly `<sources>` + relative class filenames | each `<file path="...">` must resolve to a Sonar-indexed file |
| Best fit | preserve more original tool semantics and broad CI interoperability | minimize Sonar import ambiguity and unify multi-language ingestion |
| Typical risk | Sonar may not use it directly for every language/tool combination | information is normalized; path correctness becomes the critical factor |

### Very short XML examples
Cobertura sample:

```xml
<coverage>
	<packages>
		<package name="app">
			<classes>
				<class filename="src/app.py">
					<lines>
						<line number="10" hits="1" branch="false"/>
					</lines>
				</class>
			</classes>
		</package>
	</packages>
</coverage>
```

Sonar Generic Coverage sample:

```xml
<coverage version="1">
	<file path="src/app.py">
		<lineToCover lineNumber="10" covered="true"/>
	</file>
</coverage>
```

Reader takeaway: Cobertura preserves more of the original tool’s representation; Generic Coverage trims the model down to what Sonar needs in order to attribute coverage reliably.


## Sonar generic test data: what users want (WHY)
### Why users pick Generic Coverage
- **Compatibility**: import coverage from tools Sonar doesn’t natively support.
- **Uniformity**: use one property (`sonar.coverageReportPaths`) across heterogeneous toolchains.
- **Determinism**: keep a stable, pipeline-generated artifact checked/archived like any other report.

### Format constraints that shape conversions
Generic Coverage is a per-file, per-line model:

- Root `<coverage version="1">`.
- Each `<file path="…">` contains `<lineToCover lineNumber="…" covered="true|false" …/>`.
- `path` can be absolute or relative to the module root.
- Optional branch counts per line: `branchesToCover` and `coveredBranches`.

Reference: [SonarQube Cloud generic test data documentation](https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/generic-test-data)

Implication (WHY it matters): conversions from Cobertura typically reduce `hits` counts into a boolean `covered` signal, and the quality bar becomes **path correctness**, not arithmetic.


## Ecosystems: Cobertura usage and Sonar analysis approaches (WHY-focused)

### Python
**Why Cobertura exists here**: coverage.py’s `coverage xml` produces an XML report “compatible with Cobertura”, making it a portable artifact for CI and downstream tools.
Reference: [coverage.py XML reporting](https://coverage.readthedocs.io/en/latest/commands/cmd_xml.html)

**Typical Sonar approach (WHY)**
- Prefer Sonar’s Python-specific coverage import when it fits: fewer moving parts than a conversion.
- Switch to Generic Coverage when teams need a single import mechanism shared with other languages or when their toolchain produces “Cobertura-like but not accepted” reports without path normalization.


### .NET
**Why Cobertura exists here**: Coverlet supports Cobertura among its standard output formats, so teams can emit a broadly supported report without committing to a Sonar-specific exporter.
Reference: [Coverlet MSBuild integration](https://github.com/coverlet-coverage/coverlet/tree/main/Documentation/MSBuildIntegration.md)

**Typical Sonar approach (WHY)**
- Prefer `.NET`-specific import properties when available (reduces path and schema mismatch risk).
- Consider Generic Coverage when consolidating multi-language coverage ingestion or when migrating away from another format and needing a stable, cross-platform target.


### JavaScript / TypeScript
**Why Cobertura exists here**: Istanbul’s report tooling includes a Cobertura report generator, reflecting Cobertura’s role as a “universal” CI/reporting interchange format.
Reference (implementation): [Istanbul Cobertura reporter](https://github.com/istanbuljs/istanbuljs/tree/main/packages/istanbul-reports/lib/cobertura/index.js)

**Typical Sonar approach (WHY)**
- Many teams use LCOV for JS/TS because it’s the path of least resistance with JS tooling.
- Generic Coverage becomes attractive when teams already standardized on XML reports across stacks or when they want one Sonar property in a polyglot repo.


### C / C++
**Why Cobertura exists here**: tools like gcovr generate Cobertura XML for CI/reporting systems and plugins.
Reference: [gcovr Cobertura XML output](https://gcovr.com/en/stable/output/cobertura.html)

**When teams avoid conversion (WHY)**
gcovr can also emit Sonar-compatible XML directly:

- It can generate “SonarQube XML output” and links Sonar’s generic test data as the format reference.

Reference: [gcovr SonarQube XML output](https://gcovr.com/en/stable/output/sonarqube.html)

Rationale: if the tool can output “Sonar-ready” XML, it’s safer than conversion because it removes one source of mismatch.


### Apple / Swift (example of “convert to generic” as a first-class pattern)
SonarSource’s scanning examples include generating and importing generic coverage (e.g., the Swift example imports a generated generic-coverage XML file via `sonar.coverageReportPaths`).
Reference: [SonarSource Swift coverage example](https://github.com/SonarSource/sonar-scanning-examples/tree/main/swift-coverage)

Rationale: this demonstrates Sonar’s intended use of the generic format—conversion is acceptable when the ecosystem’s native outputs don’t match what Sonar can consume.


## CI integration patterns: what users optimize for (WHY)

### Pattern A — “Use native import when possible”
Why: fewer moving parts, fewer file-path and schema surprises.

### Pattern B — “Standardize on generic coverage across languages”
Why: one property (`sonar.coverageReportPaths`) and one artifact shape across teams.

### Pattern C — “Emit Sonar-ready XML from the coverage tool”
Why: reduces conversion risk (gcovr is a concrete example).
Reference: [gcovr SonarQube XML output](https://gcovr.com/en/stable/output/sonarqube.html)


## Known SonarCloud/SonarQube pain points (WHY users get stuck)
These show why teams ask for “Cobertura → Generic Coverage” tooling and guardrails.

### 1) `sonar.coverageReportPaths` does not accept glob patterns
Why it matters: in monorepos, users often want `**/*.xml`, but must supply explicit paths.
Reference: [Sonar Community: wildcards in sonar.coverageReportPaths](https://community.sonarsource.com/t/wildcards-in-sonar-coveragereportpaths/103871)

### 2) Missing report files can fail analysis
Why it matters: pipelines that conditionally generate coverage (e.g., only on some jobs) can break scanning unless they always produce the report or guard the scan.
Reference: [Sonar Community: missing generic coverage file fails scan](https://community.sonarsource.com/t/skip-generic-code-coverage-when-coveragereportpaths-file-does-not-exist-instead-of-fail-scan/8766)

### 3) “Imported coverage data for 0 files” usually signals path mismatch
Why it matters: conversions succeed syntactically but coverage is ignored because `<file path="…">` doesn’t match the files Sonar indexed.
Reference: [Sonar Community: imported coverage data for 0 files](https://community.sonarsource.com/t/imported-coverage-data-for-0-files/9544)


## Existing tools and converter landscape
Search results do **not** show a clear, widely adopted, maintained “general-purpose Cobertura → Sonar Generic Coverage” converter. What does exist falls into three practical buckets:

### 1) Tools that avoid conversion by emitting Sonar-ready XML directly
- **gcovr**: emits SonarQube XML directly.
  - Why users choose it: avoids a second transformation step and keeps C/C++ coverage closer to the original producer.
  - CLI shape: generate a Sonar-targeted XML artifact during the coverage step, then pass that file to Sonar.
  - CI shape: coverage generation job writes a single scan-ready file before the Sonar scan job.
  - Source: [gcovr SonarQube XML output](https://gcovr.com/en/stable/output/sonarqube.html)

### 2) Format-specific converters that target Sonar Generic Coverage
- **SonarSource Swift example**: converts Xcode coverage data into Sonar Generic Coverage.
  - Why users choose it: the native coverage output is not the format Sonar expects, so conversion becomes the compatibility layer.
  - CLI shape: run a conversion script after tests, before scanning.
  - GitHub Actions shape: insert one workflow step that produces the generic coverage artifact, then a later step runs the scan.
  - Upstream example: [SonarSource Swift coverage example](https://github.com/SonarSource/sonar-scanning-examples/tree/main/swift-coverage)

### 3) Adjacent utilities that solve the main blocker instead of changing the format
- **CoberturaCoverageReportBaseDirFixer**: rewrites Cobertura base paths so Sonar can resolve files generated by OpenCppCoverage.
  - Why users choose it: in many failing pipelines, the real problem is path resolution, not the XML family itself.
  - CLI shape: run the path-fix utility on Cobertura output before the scan step.
  - GitHub Actions shape: add a preprocessing step between test coverage generation and Sonar analysis.
  - Upstream repository: [ericlemes/CoberturaCoverageReportBaseDirFixer](https://github.com/ericlemes/CoberturaCoverageReportBaseDirFixer)

### Practical conclusion
For readers evaluating this feature request, the search results suggest the gap is real: teams either rely on ecosystem-specific exporters, use niche preprocessors, or write small CI conversions themselves. A focused Cobertura → Generic Coverage feature in this repository would address a missing general-purpose option.


## Sonar project property differences
The property difference is the simplest way to explain when readers should expect Cobertura to work directly and when they should expect a Generic Coverage conversion step.

### Native Cobertura-aware import in SonarCloud (Python example)
SonarCloud’s current Python coverage documentation says the scanner expects a **Cobertura XML** report and uses `sonar.python.coverage.reportPaths`.

```properties
sonar.projectKey=my-python-project
sonar.organization=my-org
sonar.python.coverage.reportPaths=coverage.xml
```

Why readers care:
- This is the lower-friction path when the ecosystem already matches Sonar’s expected format.
- It reduces conversion logic and keeps ownership of the coverage semantics with the original tool.

Upstream working guidance:
- [SonarQube Cloud Python test coverage documentation](https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/python-test-coverage)
- [Official SonarSource scan action](https://github.com/SonarSource/sonarqube-scan-action)

Version note:
- The exact first release where Python Cobertura import became available was not identified in this survey.
- However, community evidence shows the **“Cobertura Sensor for Python coverage”** is already present in SonarQube **7.7** and SonarCloud discussions from **2019**, so this capability is not new.
- Evidence: [Sonar Community search results showing SonarQube 7.7 logs with the Cobertura sensor](https://community.sonarsource.com/search?q=%22Cobertura%20Sensor%20for%20Python%20coverage%22)

### Generic Coverage fallback for ecosystems / instances without direct native support
Sonar’s generic format uses `sonar.coverageReportPaths` instead.

```properties
sonar.projectKey=my-project
sonar.sources=src
sonar.coverageReportPaths=sonarqube-generic-coverage.xml
```

Why readers care:
- This is the compatibility path when the native output is not directly supported by the target Sonar analyzer or when the team wants one uniform ingestion contract across multiple languages.
- It is also the more defensible path for older or heterogeneous environments, because it moves compatibility logic into CI instead of depending on analyzer-specific import behavior.

Upstream working example:
- [SonarSource Swift coverage example](https://github.com/SonarSource/sonar-scanning-examples/tree/main/swift-coverage)

Reader-facing interpretation:
- `sonar.python.coverage.reportPaths` means “Sonar already understands this ecosystem’s Cobertura-shaped report”.
- `sonar.coverageReportPaths` means “normalize coverage into Sonar’s own generic ingestion format first”.


## Existing GitHub Actions: where this project fits (WHY users compose actions)

### Sonar scan actions
Users typically run a scan action and pass analysis parameters, rather than baking Sonar scanning into a coverage summarizer.

- Official SonarSource scan action (supports passing extra args): [SonarSource/sonarqube-scan-action](https://github.com/SonarSource/sonarqube-scan-action)

Rationale: this repo can focus on producing the *right artifact(s)*; the scan action stays responsible for analysis.


## What existing tooling already covers vs. the gap this repo can fill

### Covered by existing tools
- Some tools can emit Sonar-compatible XML directly ([gcovr](https://gcovr.com/en/stable/output/sonarqube.html)).
- Some ecosystems document conversion to Generic Coverage as an intended path ([SonarSource Swift example](https://github.com/SonarSource/sonar-scanning-examples/tree/main/swift-coverage)).

### Gap (why “Cobertura → Generic Coverage” still matters)
- Many producers emit Cobertura (Python coverage.py, .NET coverlet, JS Istanbul, C++ OpenCppCoverage/gcovr), but teams still hit:
  - path mismatch causing “unknown files” / 0 imported,
  - difficulty managing explicit `sonar.coverageReportPaths` in monorepos,
  - inconsistent source-root semantics across CI runners.


## If this action does NOT support Cobertura → Generic Coverage (user options)
Users can still reach Sonar coverage reporting by composing existing tools; the “right” choice is usually determined by which approach minimizes mismatches.

1) **Prefer tool-native “Sonar-ready XML” when available**
   - Why: removes a conversion step and lets the coverage tool own semantics.
   - Example: [gcovr](https://gcovr.com/en/stable/output/sonarqube.html) provides “SonarQube XML output” and references Sonar’s generic format docs.
   - Typical use in CI:

   ```yaml
   - name: Generate Sonar-ready coverage
     run: gcovr --sonarqube coverage-sonar.xml
   - name: SonarQube Scan
     uses: SonarSource/sonarqube-scan-action@v7
     env:
       SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
     with:
       args: >
         -Dsonar.coverageReportPaths=coverage-sonar.xml
   ```

2) **Prefer language-specific Sonar coverage import when available**
   - Why: avoids the generic sensor’s stricter expectations around file path resolution and reduces “0 files imported” surprises.
   - Supporting example: [SonarSource scan action](https://github.com/SonarSource/sonarqube-scan-action) documents passing language coverage parameters via `args`.
   - Typical use in CI:

   ```yaml
   - name: Run tests and produce Cobertura XML
     run: coverage xml
   - name: SonarQube Scan
     uses: SonarSource/sonarqube-scan-action@v7
     env:
       SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
     with:
       args: >
         -Dsonar.python.coverage.reportPaths=coverage.xml
   ```

3) **Add a dedicated conversion step in CI (script/tool), then import with `sonar.coverageReportPaths`**
   - Why: required when the tool’s native formats aren’t accepted by Sonar, or when teams want one uniform ingestion path across languages.
   - Typical use in CI:

   ```yaml
   - name: Generate Cobertura XML
     run: coverage xml
   - name: Convert coverage for Sonar generic import
     run: ./scripts/coverage-to-sonar-generic.sh coverage.xml sonarqube-generic-coverage.xml
   - name: SonarQube Scan
     uses: SonarSource/sonarqube-scan-action@v7
     env:
       SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
     with:
       args: >
         -Dsonar.coverageReportPaths=sonarqube-generic-coverage.xml
   ```

   - Critical guardrails (WHY they matter):
     - [Wildcards are not supported for `sonar.coverageReportPaths`](https://community.sonarsource.com/t/wildcards-in-sonar-coveragereportpaths/103871), so the output path should be stable and explicit.
     - [Missing report files can fail the scan](https://community.sonarsource.com/t/skip-generic-code-coverage-when-coveragereportpaths-file-does-not-exist-instead-of-fail-scan/8766), so the conversion step should be all-or-nothing.
     - [Path mismatches are the most common reason coverage is ignored](https://community.sonarsource.com/t/imported-coverage-data-for-0-files/9544), so conversion should normalize paths before scanning.


## References (grouped by topic)

### Sonar generic test data (format + motivation)
- SonarQube Cloud: Generic test data (coverage + execution): https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/generic-test-data

### Ecosystem coverage report producers (Cobertura)
- coverage.py: `coverage xml` outputs Cobertura-compatible XML: https://coverage.readthedocs.io/en/latest/commands/cmd_xml.html
- Coverlet: supported formats include `cobertura`: https://github.com/coverlet-coverage/coverlet/tree/main/Documentation/MSBuildIntegration.md
- Istanbul: Cobertura report implementation exists: https://github.com/istanbuljs/istanbuljs/tree/main/packages/istanbul-reports/lib/cobertura/index.js
- gcovr: Cobertura XML output: https://gcovr.com/en/stable/output/cobertura.html

### Tools that output Sonar-compatible XML directly
- gcovr SonarQube XML output: https://gcovr.com/en/stable/output/sonarqube.html

### SonarSource example: conversion to generic coverage in CI
- Sonar scanning examples (Swift coverage): https://github.com/sonarsource/sonar-scanning-examples/tree/main/swift-coverage

### Sonar language-specific import guidance
- SonarQube Cloud Python test coverage: https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/python-test-coverage
- Official SonarSource scan action: https://github.com/SonarSource/sonarqube-scan-action

### Existing converter / preprocessor landscape
- CoberturaCoverageReportBaseDirFixer repository: https://github.com/ericlemes/CoberturaCoverageReportBaseDirFixer

### Historical evidence for Python Cobertura support
- Sonar Community search for “Cobertura Sensor for Python coverage”: https://community.sonarsource.com/search?q=%22Cobertura%20Sensor%20for%20Python%20coverage%22

### Common trouble tickets (Sonar Community)
- Wildcards not supported in `sonar.coverageReportPaths`: https://community.sonarsource.com/t/wildcards-in-sonar-coveragereportpaths/103871
- Missing report file fails scan request: https://community.sonarsource.com/t/skip-generic-code-coverage-when-coveragereportpaths-file-does-not-exist-instead-of-fail-scan/8766
- Imported coverage for 0 files / unknown files: https://community.sonarsource.com/t/imported-coverage-data-for-0-files/9544

