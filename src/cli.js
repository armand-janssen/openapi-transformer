#!/usr/bin/env node

const fs = require('fs');
const { program } = require('commander');
const { version } = require('../package.json');
const plantUmlTransformer = require('./plantUmlTransformer');
const markdownTransformer = require('./markdownTransformer');
const jsonSchemaTransformer = require('./jsonSchemaTransformer');
const openApiGenerator = require('./index.js');

program
  .name('openapi-transformer')
  .version(version)
  .usage('[options] <inputFileOrUrl>')
  .argument('[inputFileOrUrl]')
  .description('At least 1 output type must be selected: plantuml, markdown or jsonschema (JSON Schema)!')
  .option('-d, --details', 'Show extra attribute details')
  .option('-p, --plantuml <plantuml file>', 'Transform to plantuml')
  .option('-m, --markdown <markdown file>', 'Transform to markdown')
  .option('-j, --jsonschema <jsonschema file>', 'Transform to json schema')
  .option('-v, --verbose', 'Show verbose debug output')
  .parse(process.argv);

const options = program.opts();
if (!program.args.length || (options.plantuml == null && options.markdown == null && options.jsonschema == null)) {
  program.help();
} else {
  const { verbose } = options;

  if (verbose) console.log('Reading openAPI...');
  (async () => {
    const warnings = [];
    const allParsedSchemas = await openApiGenerator.loadYamlFile(program.args[0], verbose, warnings);
    warnings.forEach((warning) => console.error(`Warning: ${warning}`));
    if (Object.keys(allParsedSchemas).length === 0) {
      throw new Error(`No schemas found in ${program.args[0]} (expected components.schemas or definitions)`);
    }

    if (options.plantuml !== undefined) {
      if (verbose) console.log('Writing plantuml...');
      let uml;
      if (options.details === undefined) {
        uml = plantUmlTransformer.generate(allParsedSchemas, false);
      } else {
        uml = plantUmlTransformer.generate(allParsedSchemas, true);
      }
      fs.writeFileSync(options.plantuml, uml, 'utf8');
    }

    if (options.markdown !== undefined) {
      if (verbose) console.log('Writing markdown...');
      const md = markdownTransformer.generate(allParsedSchemas);
      fs.writeFileSync(options.markdown, md, 'utf8');
    }

    if (options.jsonschema !== undefined) {
      if (verbose) console.log('Writing JSON Schema...');
      const js = jsonSchemaTransformer.generate(allParsedSchemas);
      fs.writeFileSync(options.jsonschema, js, 'utf8');
    }

    if (verbose) console.log('Finished rendering documentation!');
  })().catch((err) => {
    // one line; the stack trace only with --verbose
    console.error(verbose ? err.stack : `Error: ${err.message.replace(/\s+/g, ' ')}`);
    process.exit(1);
  });
}
