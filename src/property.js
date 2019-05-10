/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { constants } = require('./constants');
const utils = require('./utils');
const Detail = require('./detail');
const RelationShip = require('./relationship');

class Property {
  constructor(name, type, required, details, description, example) {
    this.name = name;
    this.type = type;
    this.required = required;
    this.details = details;
    this.description = description;
    this.example = example;
  }

  static parseDetails(property) {
    let details = [];
    let typeAfterDetailsParsing = undefined;

    if (property.type === 'string') {
      if (property.minLength !== undefined) details.push(new Detail("minLength", property.minLength));
      if (property.maxLength !== undefined) details.push(new Detail("maxLength", property.maxLength));
      if (property.pattern !== undefined) details.push(new Detail("pattern", property.pattern));

      if (property.enum !== undefined) {
        typeAfterDetailsParsing = 'enum';

        property.enum.forEach((value) => {
          details.push(new Detail("enumvalue", value));
        });
      } else if (property.format === 'date') {
        typeAfterDetailsParsing = 'date';
        details.push(new Detail("pattern", 'yyyy-MM-dd'));
      } else if (property.format === 'binary') {
        typeAfterDetailsParsing = 'string [binary]';
      } else if (property.format === 'byte') {
        typeAfterDetailsParsing = 'string [byte]';
      }
    } else if (property.type === 'number' || property.type === 'integer') {
      if (property.format !== undefined) details.push(new Detail("format", property.format));
      if (property.minimum !== undefined) details.push(new Detail("minimum", property.minimum));
      if (property.maximum !== undefined) details.push(new Detail("maximum", property.maximum));
      if (property.multipleOf !== undefined) details.push(new Detail("multipleOf", property.multipleOf));

    } else if (property.type === 'array') {
      if (property.minItems !== undefined) details.push(new Detail("minItems", property.minItems));
      if (property.maxItems !== undefined) details.push(new Detail("maxItems", property.maxItems));
      if (property.uniqueItems !== undefined) details.push(new Detail("uniqueItems", property.uniqueItems));
    }


    return [typeAfterDetailsParsing, details];
  }
  static parseProperties(properties, required, schemaName, verbose) {
    const parsedProperties = [];

    const relationShips = [];
    const referencedFiles = [];

    for (const propertyIndex in properties) {
      const property = properties[propertyIndex];

      const name = propertyIndex;
      let { type } = property;
      const { description } = property;
      const { example } = property;
      if (verbose) console.log(`***************** processing property :: [${name}] of type ::  [${type}]`);

      if (type == null && property.$ref != null) {
        // reference to other object, maybe in other file
        type = name;
        const reference = property.$ref;
        const referencedFile = reference.match('^.*yaml');

        if (referencedFile != null && referencedFile.length === 1 && !referencedFiles.includes(referencedFile[0])) {
          referencedFiles.push(referencedFile[0]);
        }
        const to = utils.lastToken(reference, '/');
        relationShips.push(new RelationShip(schemaName, to, name, constants.RELATIONSHIP_USE));

      } else if (type === 'array') {
        type = 'array[] of ';
        let first = true;

        for (const itemIndex in property.items) {
          const item = property.items[itemIndex];

          if (itemIndex === 'type') {
            // process array of primitives
            type += `${item}s`;
          } else if (itemIndex === '$ref') {
            // process array of specific schema
            if (typeof item === 'string') {
              // add relationShip
              const objectName = utils.lastToken(item, '/');
              relationShips.push(new RelationShip(schemaName, objectName, name, constants.RELATIONSHIP_AGGREGATION));

              type += objectName;

              // is it a reference to an external file?
              const referencedFile = item.match('^.*yaml');
              if (referencedFile != null && referencedFile.length === 1 && !referencedFiles.includes(referencedFile[0])) {
                referencedFiles.push(referencedFile[0]);
              }
            }
          } else if (itemIndex === 'anyOf') { // typeof item === 'object') {
            // process anyOf / allOf / oneOf item
            for (const refIndex in item) {
              const reference = item[refIndex].$ref;

              const objectName = utils.lastToken(reference, '/');
              relationShips.push(new RelationShip(schemaName, objectName, name, constants.RELATIONSHIP_AGGREGATION));

              if (!first) {
                type += '/';
              }
              first = false;

              type += objectName;

              const referencedFile = reference.match('^.*yaml');
              if (referencedFile != null && referencedFile.length === 1 && !referencedFiles.includes(referencedFile[0])) {
                referencedFiles.push(referencedFile[0]);
              }
            }
          }
        }
      }

      const [typeAfterDetailsParsing, details] = this.parseDetails(property);

      if(typeAfterDetailsParsing !== undefined) type = typeAfterDetailsParsing;
      const requiredProperty = (required === undefined ? undefined : required.includes(name));

      parsedProperties.push(new Property(name, type, requiredProperty, details, description, example));

    }
    return [parsedProperties, relationShips, referencedFiles];

  }
}


module.exports = Property;
