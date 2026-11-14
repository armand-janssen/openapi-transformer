# Changelog

High-level summary per release. The full list of changes in 0.12.0, including every breaking change, is in the [README](README.md#changelog).

## 0.12.0 (unreleased)

A stabilisation release: the tool now fails loudly instead of producing incomplete output, and the toolchain is current.

- **Requires Node 22.13 or newer.**
- **Clear errors:** unreadable files, invalid YAML/JSON, HTTP errors and specs without schemas give a one-line error and exit code 1. Schemas that cannot be rendered produce a warning instead of disappearing.
- **Referenced files:** schemas from referenced files are no longer missing, `.yml` files are followed, reference cycles are handled, and references resolve relative to the spec, also after HTTP redirects.
- **allOf and enums:** all `allOf` members are combined, top-level enums are rendered, and number and boolean enums keep their type.
- **JSON Schema:** output is valid draft-07 for arrays, `anyOf`/`oneOf`/`allOf`, dates, binary strings and references to the root schema.
- **PlantUML:** inheritance is drawn as `Parent <|-- Child`; the old "extension" arrow is gone.
- **Library use:** `require('openapi-transformer')` works and exports `loadYamlFile`, `generatePlantUml`, `generateMarkdown` and `generateJsonSchema`.
- **Smaller install:** only `commander` and `yaml` remain as runtime dependencies.
- **License metadata:** `package.json` now says MIT, matching the LICENSE file.
- **Project:** a test suite with a coverage gate, a Docker image for testing, and CI on Node 22, 24 and 26.

## 0.11.0 (2023-10-14)

- Dependency updates for security advisories.
- Automated publishing to npm from GitHub releases.
- No functional changes.

## 0.9.0 (2022-05-10)

- Markdown: `date` properties without an example show a default example date.

Version 0.8.0 has the same content; it was published to npm later, on 2023-10-14.

## 0.7.1 (2021-11-24)

- JSON Schema: fixed the `date-time` format.

## 0.7.0 (2021-01-08)

- Load a spec from a URL.
- Support for Swagger 2 (`definitions`).

## 0.6.0 (2020-05-19)

- JSON Schema output declares draft-07.
