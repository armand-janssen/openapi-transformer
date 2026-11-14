#!/usr/bin/env node

const fs = require('node:fs');
const { program } = require('commander');
const { version } = require('../package.json');
const plantUmlTransformer = require('./plantUmlTransformer');
const markdownTransformer = require('./markdownTransformer');
const jsonSchemaTransformer = require('./jsonSchemaTransformer');
const csvTransformer = require('./csvTransformer');
const openApiGenerator = require('./index.js');

program
  .name('openapi-transformer')
  .version(version)
  .usage('[options] <inputFileOrUrl>')
  .argument('[inputFileOrUrl]')
  .description('At least 1 output type must be selected: plantuml, markdown, jsonschema (JSON Schema) or csv!')
  .option('-d, --details', 'Show extra attribute details')
  .option('-p, --plantuml <plantuml file>', 'Transform to plantuml')
  .option('-m, --markdown <markdown file>', 'Transform to markdown')
  .option('-j, --jsonschema <jsonschema file>', 'Transform to json schema')
  .option('-c, --csv <csv file>', 'Transform to csv')
  .option('-r, --root <schema>', 'Only output this schema and the schemas it needs')
  .option('-v, --verbose', 'Show verbose debug output')
  .parse(process.argv);

const options = program.opts();
// option name, label in the verbose log, transformer
const outputs = [
  ['plantuml', 'plantuml', (schemas) => plantUmlTransformer.generate(schemas, options.details !== undefined)],
  ['markdown', 'markdown', markdownTransformer.generate],
  ['jsonschema', 'JSON Schema', jsonSchemaTransformer.generate],
  ['csv', 'CSV', csvTransformer.generate],
].filter(([option]) => options[option] != null);

if (!program.args.length || outputs.length === 0) {
  program.help();
} else {
  const { verbose } = options;

  if (verbose) console.log('Reading openAPI...');
  (async () => {
    const warnings = [];
    let schemas = await openApiGenerator.loadYamlFile(program.args[0], verbose, warnings);
    warnings.forEach((warning) => console.error(`Warning: ${warning}`));
    if (Object.keys(schemas).length === 0) {
      throw new Error(`No schemas found in ${program.args[0]} (expected components.schemas or definitions)`);
    }
    if (options.root !== undefined) schemas = openApiGenerator.selectSchemas(schemas, options.root);

    outputs.forEach(([option, label, generate]) => {
      if (verbose) console.log(`Writing ${label}...`);
      fs.writeFileSync(options[option], generate(schemas), 'utf8');
    });

    if (verbose) console.log('Finished rendering documentation!');
  })().catch((err) => {
    // one line; the stack trace only with --verbose
    console.error(verbose ? err.stack : `Error: ${err.message.replace(/\s+/g, ' ')}`);
    process.exit(1);
  });
}
