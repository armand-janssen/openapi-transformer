#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const program = require('commander');
const { version } = require('../package.json');
const plantUmlTransformer = require('./plantUmlTransformer');
const markdownTransformer = require('./markdownTransformer');
const jsonSchemaTransformer = require('./jsonSchemaTransformer');
const csvTransformer = require('./csvTransformer');
const openApiGenerator = require('./index.js');
const filter = require('./filter');

program
  .version(version)
  .usage('[options] <inputFileOrUrl>')
  .description('At least 1 output type must be selected: plantuml or markdown!')
  .option('-d, --details', 'Show extra attribute details')
  .option('-r --root <root type>', 'Specify root class to start extracting from')
  .option('--depth <depth>', 'Specify extracting depth')
  .option('-p, --plantuml <plantuml file>', 'Transform to plantuml')
  .option('-m, --markdown <markdown file>', 'Transform to markdown')
  .option('-c, --csv <csv file>', 'Transform to csv')
  .option('-j, --jsonschema <jsonschema file>', 'Transform to json schema')
  .option('-v, --verbose', 'Show verbose debug output')
  .parse(process.argv);

if (!program.args.length || (program.plantuml == null && program.markdown == null && program.jsonschema == null && program.csv == null)) {
  program.help();
} else {
  const { verbose } = program;

  if (verbose) console.log('Reading openAPI...');
  (async () => {
    const _allParsedSchemas = await openApiGenerator.loadYamlFile(program.args[0], verbose);

    let parsedSchemas = _allParsedSchemas;
    
    if(program.root != null){
      let depth = program.depth || Infinity;
      parsedSchemas = filter.filterByMainSchema(_allParsedSchemas,program.root,depth);
    }

    if (program.plantuml !== undefined) {
      if (verbose) console.log('Writing plantuml...');
      let uml = '';
      if (program.details === undefined) {
        uml = plantUmlTransformer.generate(parsedSchemas, false);
      } else {
        uml = plantUmlTransformer.generate(parsedSchemas, true);
      }
      fs.writeFileSync(program.plantuml, uml, 'utf8');
    }

    if (program.markdown !== undefined) {
      if (verbose) console.log('Writing markdown...');
      const md = markdownTransformer.generate(parsedSchemas);
      fs.writeFileSync(program.markdown, md, 'utf8');
    }

    if (program.jsonschema !== undefined) {
      if (verbose) console.log('Writing JSON Schema...');
      const js = jsonSchemaTransformer.generate(parsedSchemas);
      fs.writeFileSync(program.jsonschema, js, 'utf8');
    }

    if (program.csv !== undefined) {
      if (verbose) console.log('Writing CSV Schema...');
      const csv = csvTransformer.generate(parsedSchemas);
      fs.writeFileSync(program.csv, csv, 'utf8');
    }

    if (verbose) console.log('Finished rendering documentation!');
  })();
}
