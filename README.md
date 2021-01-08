# OpenAPI transformer

[![Coverage Status](https://coveralls.io/repos/github/armand-janssen/openapi-transformer/badge.svg?branch=master)](https://coveralls.io/github/armand-janssen/openapi-transformer?branch=master)

[![Build Status](https://travis-ci.org/armand-janssen/openapi-transformer.svg?branch=master)](https://travis-ci.org/armand-janssen/openapi-transformer)

[![Known Vulnerabilities](https://snyk.io/test/github/armand-janssen/openapi-transformer/badge.svg?targetFile=package.json)](https://snyk.io/test/github/armand-janssen/openapi-transformer?targetFile=package.json)

This tool creates one or more of the following from a **Swagger 2** or **OpenApi 3** specification -
* Markdown (Optimized for [Showdown](http://showdownjs.com))
* [PlantUML Class Diagram](http://plantuml.com/class-diagram)

# Requirements
- Swagger 2 or OpenAPI 3+ Specification
- [NodeJS](http://nodejs.org)

# Usage
Always run the script from the directory in which the yaml file are.
```
Usage: index [options] <inputfile>

Options:
  -V, --version                       Output the version number
  -p, --plantuml <plantuml file>      The plantuml file
  -m, --markdown <markdown file>      The output file for markdown
  -j, --jsonschema <jsonschema file>  Transform to json schema
  -v, --verbose                       Show verbose debug output
  -h, --help                          Output usage information
```

## Example
**Generates to plantuml**
```
openapi-transformer vehicle.yaml --plantuml vehicle.plantuml
```
**Generates to plantuml with verbose debug info :)**
```
openapi-transformer vehicle.yaml --verbose --plantuml vehicle.plantuml
```

**Generates to plantuml file and markdown file**
```
openapi-transformer vehicle.yaml --plantuml ./example.plantuml --markdown ./example.md
```
# Example output plantuml

## No details
![Example no details](https://raw.githubusercontent.com/armand-janssen/openapi-transformer/master/example/example-no-details.png)

## Details
![Example with details](https://raw.githubusercontent.com/armand-janssen/openapi-transformer/master/example/example-details.png)

# Online utils
- [Online Markdown Editor http://demo.showdownjs.com](http://demo.showdownjs.com)
- [Online PlantUML Editor https://www.planttext.com](https://www.planttext.com)
