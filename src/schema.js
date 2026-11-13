
const util = require('node:util');
const Property = require('./property');
const utils = require('./utils');

class Schema {
  constructor(title, name, properties, description, relationShips, parent, additionalParents, enumValues, enumType) {
    this.title = title;
    this.name = name;
    this.properties = properties;
    this.description = description;
    this.relationShips = relationShips;
    this.parent = parent;
    this.additionalParents = additionalParents; // only set for allOf: referenced members after the first
    this.enumValues = enumValues; // only set for top-level enums
    this.enumType = enumType; // the enum's declared type, if any
  }

  // skippedSchemaNames receives the names of schemas that cannot be rendered.
  static parseSchemas(schemas, verbose, skippedSchemaNames = []) {
    const allReferencedFiles = [];
    const allParsedSchemas = {};

    for (const schemaIndex of Object.keys(schemas)) {
      const schema = schemas[schemaIndex];

      const { title } = schema;
      const parent = undefined;
      const { description } = schema;

      if (verbose) console.log(`\n\n############################### schema name :: ${title} ###############################`);

      if (schema.$ref !== undefined) {
        if (verbose) console.log(`found ref :: ${schema.$ref}`);
        utils.addReferencedFile(schema.$ref, allReferencedFiles);
      } else if (schema.allOf !== undefined) {
        const [referencedFiles, parsedSchemas] = this.processInheritance(schema, schemaIndex, schema.allOf, verbose);

        utils.mergeObjects(parsedSchemas, allParsedSchemas);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      } else if (schema.type === 'object' || schema.properties !== undefined) {
        // parse properties of this schema
        const [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(schema.properties, schema.required || undefined, schemaIndex, verbose);
        if (allParsedSchemas[schemaIndex] === undefined) {
          allParsedSchemas[schemaIndex] = new Schema(title, schemaIndex, parsedProperties, description, relationShips, parent);

          utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
        }
      } else if (schema.enum !== undefined) {
        allParsedSchemas[schemaIndex] = new Schema(title, schemaIndex, [], description, [], parent, undefined, schema.enum, schema.type);
      } else {
        skippedSchemaNames.push(schemaIndex);
        if (verbose) console.log(`unparseable schema definition :: ${JSON.stringify(schema)}`);
      }
    }
    return [allReferencedFiles, allParsedSchemas];
  }

  // Inline members are concatenated in order; the first referenced member is the parent, later ones are additionalParents.
  static processInheritance(schema, schemaIndex, allOf, verbose) {
    if (verbose) console.log(`schemaIndex :: ${schemaIndex}`);
    if (verbose) console.log(`fullschema: ${util.inspect(schema, { showHidden: false, depth: null })}`);

    const parents = [];
    const allReferencedFiles = [];
    const allProperties = [];
    let allRelationShips = [];

    allOf.forEach((attribute) => {
      if (verbose) console.log(`attribute: ${util.inspect(attribute, { showHidden: false, depth: null })}`);

      if (attribute.$ref !== undefined) {
        parents.push(utils.lastToken(attribute.$ref, '/'));
        utils.addReferencedFile(attribute.$ref, allReferencedFiles);
      } else if (attribute.properties !== undefined) {
        const [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(attribute.properties, attribute.required || undefined, schemaIndex, verbose);
        // a later member overrides a property of an earlier one, keeping its first position
        parsedProperties.forEach((property) => {
          const index = allProperties.findIndex((p) => p.name === property.name);
          if (index === -1) {
            allProperties.push(property);
          } else {
            allProperties[index] = property;
            allRelationShips = allRelationShips.filter((r) => r.description !== property.name);
          }
        });
        allRelationShips.push(...relationShips);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      }
    });
    if (verbose) console.log(`parents :: ${parents}`);

    const [parent, ...additionalParents] = parents;
    const parsedSchema = new Schema(schema.title, schemaIndex, allProperties, schema.description, allRelationShips, parent, additionalParents);
    return [allReferencedFiles, { [schemaIndex]: parsedSchema }];
  }
}

module.exports = Schema;
