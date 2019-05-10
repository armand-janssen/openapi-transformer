/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const YAML = require('yaml');
const fs = require('fs');
const Schema = require('./schema');
const utils = require('./utils');
//const { constants } = require('./constants');

function loadYamlFile(file, verbose) {
  if (verbose) console.log(`***************** processing file :: ${file}`);
  const allParsedSchemas = [];

  const loadedFile = fs.readFileSync(file, 'UTF-8');
  const myYaml = YAML.parse(loadedFile);

  if (myYaml !== undefined && myYaml.components !== undefined && myYaml.components.schemas !== undefined) {
    const { schemas } = myYaml.components;
    const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose);

    utils.addValuesOfArrayToOtherArrayIfNotExist(parsedSchemas, allParsedSchemas);

    if (referencedFiles !== undefined && referencedFiles.length > 0) {
      for (const referencedFileIndex in referencedFiles) {
        const referencedParsedSchemas = loadYamlFile(`./${referencedFiles[referencedFileIndex]}`, verbose);

        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedParsedSchemas, allParsedSchemas);
      }
    }
  }
  return allParsedSchemas;
}
module.exports = { loadYamlFile };
