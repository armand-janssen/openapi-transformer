/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const Schema = require('./schema');
const utils = require('./utils');

const allLoadedFiles = [];

function loadYamlFile(file, verbose) {
  if(allLoadedFiles.includes(file)) {
    if (verbose) console.log(`@@@@@@@@@@@@@@@@ already loaded :: ${file}; skipping`);
    return [];
  }

  if (verbose) console.log(`***************** processing file :: ${file}`);
  const allParsedSchemas = [];

  // determine base to resolve other file references from
  const filePath = path.dirname(file);
  if (verbose) console.log(`**************** basedir file path :: ${filePath}`);

  const loadedFile = fs.readFileSync(file, 'UTF-8');
  const myYaml = YAML.parse(loadedFile);
  allLoadedFiles.push(file);
  if (verbose) console.log(`@@@@@@@@@@@@@@@@ loaded files :: ${allLoadedFiles}`);

  if (myYaml !== undefined && myYaml.components !== undefined && myYaml.components.schemas !== undefined) {
    const { schemas } = myYaml.components;
    const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose);

    utils.addValuesOfArrayToOtherArrayIfNotExist(parsedSchemas, allParsedSchemas);

    if (referencedFiles !== undefined && referencedFiles.length > 0) {
      for (const referencedFileIndex in referencedFiles) {
        const referencedParsedSchemas = loadYamlFile(`${filePath}/${referencedFiles[referencedFileIndex]}`, verbose);

        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedParsedSchemas, allParsedSchemas);
      }
    }
  }
  return allParsedSchemas;
}
module.exports = { loadYamlFile };
