/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const Property = require('./property');
const utils = require('./utils');
const util = require('util')

class Schema {
  constructor(name, properties, description, relationShips, parent) {
    this.name = name;
    this.properties = properties;
    this.description = description;
    this.relationShips = relationShips;
    console.log("****#### parent: " + parent);
    this.parent = parent;
    console.log("****#### this.parent: " + this.parent);
  }

  static parseSchemas(schemas, verbose) {
    const allReferencedFiles = [];
    const allParsedSchemas = [];

    for (const schemaIndex in schemas) {
      const schema = schemas[schemaIndex];

      const name = schemaIndex;
      const parent = undefined;
      const { description } = schema;

      if (verbose) console.log(`\n\n############################### schema name :: ${name} ###############################`);

      if (schema.allOf !== undefined) {
        const [referencedFiles, parsedSchemas] = this.processInheritance(schema, schemaIndex, schema.allOf, verbose);

        utils.addValuesOfArrayToOtherArrayIfNotExist(parsedSchemas, allParsedSchemas);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      } else {
        // parse properties of this schema
        const [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(schema.properties, schema.required, schemaIndex, verbose);
        if (allParsedSchemas[name] === undefined) {
          allParsedSchemas[name] = new Schema(name, parsedProperties, description, relationShips, parent);

          utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
        }
      }
    }
    return [allReferencedFiles, allParsedSchemas];
  }

  static processInheritance(schema, schemaIndex, allOf, verbose) {
    if (verbose) console.log('***************** schemaIndex :: ' + schemaIndex);
    if (verbose) console.log('***************** schema === allOf :: ' + allOf);
    const parsedSchemas = [];
    let parent;
    const allReferencedFiles = [];
    const { description } = schema;

    if (verbose) console.log('allOf: ' + util.inspect(allOf, { showHidden: false, depth: null }))

    let parsedProperties, relationShips, referencedFiles;
    for (const attributeIndex in allOf) {
      const attribute = allOf[attributeIndex];

      if (verbose) console.log(`********************************************************************`);
      if (verbose) console.log('***************** attribute: ' + util.inspect(attribute, { showHidden: false, depth: null }))

      if (attribute.$ref !== undefined) {
        parent = utils.lastToken(attribute.$ref, '/');
        if (verbose) console.log(`***************** parent :: ${parent}`);
      }

      if (attribute.type !== undefined && attribute.type === 'object' && attribute.properties !== undefined) {
        if (verbose) console.log(`***************** type :: ${attribute.type}`);
        if (verbose) console.log(`***************** type.properties :: ${attribute.properties}`);

        [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(attribute.properties, attribute.required, schemaIndex, verbose);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      }
    }
    if (parsedSchemas[schemaIndex] === undefined) {
      if (verbose) console.log(`***************** creating schema :: ${schemaIndex}`);

      parsedSchemas[schemaIndex] = new Schema(schemaIndex, parsedProperties, description, relationShips, parent);
    }

    return [allReferencedFiles, parsedSchemas];
  }


}

module.exports = Schema;