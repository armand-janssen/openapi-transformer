# CSV output and root schema selection

Status: implemented on branch `csv-output-and-root-selection`.
Origin: pull request #59, which proposed `--csv`, `--root` and `--depth` against version 0.8.0. That pull request cannot be merged any more; this spec rebuilds its ideas on the current code.

## Problem Statement

I document an API from its OpenAPI specification. Two things are hard today:

- I want the property list in a spreadsheet, to review it with people who do not read Markdown or to filter and sort it. The Markdown table is not usable for that.
- My specification is large. I only care about one schema and what it needs, but every output contains every schema. The JSON Schema output is the worst case: its root is always the first schema in the file, which is rarely the one I want.

## Solution

Two new options, usable alone or together and with every existing output:

- `-c, --csv <csv file>` writes one CSV row per property.
- `-r, --root <schema>` limits all outputs to that schema and the schemas it needs. The chosen schema comes first, so it is the root of the JSON Schema output.

```
openapi-transformer vehicle.yaml --csv vehicle.csv
openapi-transformer vehicle.yaml --root landVehicle --jsonschema land-vehicle.json
```

## User Stories

1. As an API documenter, I want a CSV file of all properties, so that I can open the specification in a spreadsheet.
2. As an API documenter, I want one row per property with the schema name in the first column, so that I can filter and sort by schema.
3. As an API documenter, I want the same information as the Markdown table (required, type, description, details, example), so that the CSV is not a lesser view.
4. As an API documenter, I want enum values in their own column, so that they do not mix with constraints such as `minLength`.
5. As an API documenter, I want top-level enum schemas to appear as a row, so that no rendered schema is missing from the CSV.
6. As a spreadsheet user, I want commas, quotes and line breaks in descriptions to stay inside their cell, so that rows do not shift.
7. As a script author, I want `true` and `false` in the required column and an unchanged example value, so that I can parse the file without guessing.
8. As an API documenter, I want to combine `--csv` with the other outputs in one run, so that all files come from the same read of the specification.
9. As an API documenter, I want to select one schema as the root, so that the output only contains what that schema needs.
10. As an API documenter, I want the selection to follow properties, array items and inheritance, also into referenced files, so that nothing the root needs is missing.
11. As a JSON Schema consumer, I want the selected root to be the root of the generated JSON Schema, so that I can validate documents of that type.
12. As an API documenter, I want `--root` to apply to PlantUML, Markdown, JSON Schema and CSV alike, so that the outputs stay consistent with each other.
13. As a user who mistypes the schema name, I want a one-line error that lists the available schemas and exit code 1, so that I do not get empty files.
14. As a library user, I want `generateCsv` and `selectSchemas` exported, so that I can do the same from code.
15. As a maintainer, I want the CSV for every example specification committed and checked by the tests, so that it cannot drift.

## Implementation Decisions

### CSV

- A new transformer beside the existing three, with the same shape: it takes the parsed schemas and returns a string. The library exports it as `generateCsv(schemas)`.
- Header row, always present: `schema,property,required,type,description,details,enum,example`.
- One row per property of an object schema, in schema order and property order.
- A top-level enum schema is one row: the property column is empty, the type is `enum` (or the declared type when it is not a string, such as `integer`), the description is the schema's description, and the values are in the enum column.
- An object schema without properties produces no row. Schema descriptions of object schemas are not in the CSV.
- `required` is `true` or `false`; it is empty on an enum schema row.
- `details` holds the constraints as `name: value`, separated by `; `. `enum` holds the values, separated by `; `.
- `example` is the value from the specification, unchanged. An object or array example is written as JSON. Unlike Markdown, no example date or date pattern is invented.
- Quoting follows RFC 4180: a field is quoted only when it contains a comma, a double quote or a line break, and double quotes inside it are doubled. Lines end with `\n`; the file is UTF-8 without a byte order mark.

### Root selection

- A library function `selectSchemas(schemas, rootName)` returns a new schema map; the transformers are unchanged and simply receive the smaller map.
- The selection is the root plus everything reachable from it through a schema's parent, its additional `allOf` parents and its relationships (referenced properties and array items), transitively. Cycles are handled.
- Only outgoing references are followed: schemas that inherit from the root, or refer to it, are not included.
- Order: the root first, then the other selected schemas in their original order.
- The name must match a rendered schema exactly (case-sensitive). Otherwise the function throws `Root schema <name> not found; available: <names>`, which the CLI prints as its usual one-line error with exit code 1 and without writing files.
- A reference to a schema that is not rendered is skipped; the loader already warns about it.
- The CLI applies the selection after loading, so warnings still describe the whole specification, including schemas outside the selection.

### CLI

- `-c, --csv <csv file>` counts as an output type: with only `--csv` the tool runs instead of printing the help text.
- `-r, --root <schema>` is not an output type on its own.

## Testing Decisions

- Tests check external behaviour only, through the existing seams: the real CLI as a child process and the library entry point, with expected-file comparison.
- The example specifications get a committed `.csv` next to their other outputs, checked by the example tests.
- A fixture with commas, quotes, line breaks, enum values, an enum schema and an object example pins the quoting and the column rules.
- `--root` is tested on the vehicle example for all four outputs, on inheritance, on a cycle, and with an unknown name.
- The library exports are tested directly for `generateCsv` and `selectSchemas`.

## Out of Scope

- `--depth`. Cutting the selection off at a depth leaves references to schemas that are not rendered: PlantUML would draw arrows to missing classes and JSON Schema would allow any value there. It can be added later if someone needs it.
- Protection against spreadsheet formula injection (cells starting with `=`, `+`, `-` or `@`). The CSV carries the specification's text unchanged; prefixing such cells would corrupt values such as negative numbers. Open CSV files from untrusted specifications as text.
- Choosing columns, the delimiter or the line ending.
- Selecting several roots.

## Further Notes

- Version: this is a backwards-compatible feature, so it fits a 0.13.0 release.
