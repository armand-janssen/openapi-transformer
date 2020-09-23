#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const program = require('commander');
const { version } = require('../package.json');
const plantUmlTransformer = require('./plantUmlTransformer');
const markdownTransformer = require('./markdownTransformer');
const jsonSchemaTransformer = require('./jsonSchemaTransformer');
const openApiGenerator = require('./index.js');

program
  .version(version)
  .usage('[options] <inputfile>')
  .description('At least 1 output type must be selected: plantuml or markdown!')
  .option('-d, --details', 'Show extra attribute details')
  .option('-p, --plantuml <plantuml file>', 'Transform to plantuml')
  .option('-m, --markdown <markdown file>', 'Transform to markdown')
  .option('-j, --jsonschema <jsonschema file>', 'Transform to json schema')
  .option('-v, --verbose', 'Show verbose debug output')
  .parse(process.argv);

if (!program.args.length || (program.plantuml == null && program.markdown == null && program.jsonschema == null)) {
  program.help();
} else {
  const { verbose } = program;

  if (verbose) console.log('Reading openAPI...');
  (async () => {
    const allParsedSchemas = openApiGenerator.loadYamlFile(program.args[0], verbose);

    if (program.plantuml !== undefined) {
      if (verbose) console.log('Writing plantuml...');
      let uml = '';
      if (program.details === undefined) {
        uml = plantUmlTransformer.generate(allParsedSchemas, false);
      } else {
        uml = plantUmlTransformer.generate(allParsedSchemas, true);
      }
      fs.writeFileSync(program.plantuml, uml, 'utf8');
    }

    if (program.markdown !== undefined) {
      if (verbose) console.log('Writing markdown...');
      const md = markdownTransformer.generate(allParsedSchemas);
      fs.writeFileSync(program.markdown, md, 'utf8');
    }

    if (program.jsonschema !== undefined) {
      if (verbose) console.log('Writing JSON Schema...');
      const js = jsonSchemaTransformer.generate(allParsedSchemas);
      fs.writeFileSync(program.jsonschema, js, 'utf8');
    }

    if (verbose) console.log('Finished rendering documentation!');
  })();
}
