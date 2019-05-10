#!/usr/bin/env node
/* eslint-disable no-console */
const plantUmlGenerator = require('./plantUmlTransformer');

const fs = require('fs');
const program = require('commander');
const openApiGenerator = require('./index.js');

program
  .version('0.1.0')
  .usage('[options] <inputfile>')
  .description('At least 1 output type must be selected: plantuml or markdown!')
  .option('-d, --details', 'Show extra attribute details')
  .option('-p, --plantuml <plantuml file>', 'Transform to plantuml')
  .option('-m, --markdown <markdown file>', 'Transform to markdown')
  .option('-v, --verbose', 'Show verbose debug output')
  .parse(process.argv);

if (!program.args.length || (program.plantuml == null && program.markdown == null)) {
  program.help();
} else {
  const { verbose } = program;

  if (verbose) console.log('Reading openAPI...');
  const allParsedSchemas = openApiGenerator.loadYamlFile(program.args[0], verbose);

  if (program.plantuml !== undefined) {
    if (verbose) console.log('Writing plantuml...');
    const uml = plantUmlGenerator.generate(allParsedSchemas);
    fs.writeFileSync(program.plantuml, uml, 'utf8');
  }

  if (program.markdown !== undefined) {
    if (verbose) console.log('Writing markdown...');
    const md = openApiGenerator.renderMarkDown(allParsedSchemas);
    fs.writeFileSync(program.markdown, md, 'utf8');
  }
  if (verbose) console.log('Finished rendering documentation!');
}
