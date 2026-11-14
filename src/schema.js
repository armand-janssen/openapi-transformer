
const util = require('node:util');
const Property = require('./property');
const utils = require('./utils');

class Schema {
  constructor(title, name, properties, description, relationShips, parent, { additionalParents, enumValues, enumType } = {}) {
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

    for (const [name, schema] of Object.entries(schemas)) {
      if (verbose) console.log(`\n\n############################### schema name :: ${schema.title} ###############################`);

      const parsed = Schema.parseSchema(schema, name, verbose);
      if (parsed === undefined) {
        skippedSchemaNames.push(name);
        if (verbose) console.log(`unparseable schema definition :: ${JSON.stringify(schema)}`);
      } else {
        const [referencedFiles, parsedSchemas] = parsed;
        utils.mergeObjects(parsedSchemas, allParsedSchemas);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      }
    }
    return [allReferencedFiles, allParsedSchemas];
  }

  // Returns [referencedFiles, parsedSchemas] for one schema, or undefined when it cannot be rendered.
  static parseSchema(schema, name, verbose) {
    if (schema.$ref !== undefined) {
      if (verbose) console.log(`found ref :: ${schema.$ref}`);
      const referencedFiles = [];
      utils.addReferencedFile(schema.$ref, referencedFiles);
      return [referencedFiles, {}];
    }
    if (schema.allOf !== undefined) {
      return Schema.processInheritance(schema, name, schema.allOf, verbose);
    }
    if (schema.type === 'object' || schema.properties !== undefined) {
      const [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(schema.properties, schema.required || undefined, name, verbose);
      return [referencedFiles, { [name]: new Schema(schema.title, name, parsedProperties, schema.description, relationShips) }];
    }
    if (schema.enum !== undefined) {
      const options = { enumValues: schema.enum, enumType: schema.type };
      return [[], { [name]: new Schema(schema.title, name, [], schema.description, [], undefined, options) }];
    }
    return undefined;
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
    const parsedSchema = new Schema(schema.title, schemaIndex, allProperties, schema.description, allRelationShips, parent, { additionalParents });
    return [allReferencedFiles, { [schemaIndex]: parsedSchema }];
  }
}

module.exports = Schema;
