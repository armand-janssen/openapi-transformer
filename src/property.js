const { constants } = require('./constants');
const utils = require('./utils');
const Detail = require('./detail');
const RelationShip = require('./relationship');

class Property {
  constructor(name, type, required, details, description, example, enumValues, items) {
    this.name = name;
    this.type = type;
    this.required = required;
    this.details = details;
    this.description = description;
    this.example = example;
    this.enumValues = enumValues; // only set for enums; constraints stay in details
    this.items = items; // only set for arrays: { type } for primitives, { refs, combinator? } for references, {} without items
  }

  static parseDetails(property) {
    const details = [];
    let typeAfterDetailsParsing;
    // a string enum becomes type 'enum'; other enums keep their type and only carry the values
    let enumValues = property.enum;

    if (property.type === 'string') {
      if (property.minLength !== undefined) details.push(new Detail('minLength', property.minLength));
      if (property.maxLength !== undefined) details.push(new Detail('maxLength', property.maxLength));
      if (property.pattern !== undefined) details.push(new Detail('pattern', property.pattern));

      if (property.enum !== undefined) {
        typeAfterDetailsParsing = 'enum';
      } else if (property.format === 'date') {
        typeAfterDetailsParsing = 'date';
      } else if (property.format === 'date-time') {
        typeAfterDetailsParsing = 'date-time';
      } else if (property.format === 'binary') {
        typeAfterDetailsParsing = 'string [binary]';
      } else if (property.format === 'byte') {
        typeAfterDetailsParsing = 'string [byte]';
      }
    } else if (property.type === 'number' || property.type === 'integer') {
      if (property.format !== undefined) details.push(new Detail('format', property.format));
      if (property.minimum !== undefined) details.push(new Detail('minimum', property.minimum));
      if (property.maximum !== undefined) details.push(new Detail('maximum', property.maximum));
      if (property.multipleOf !== undefined) details.push(new Detail('multipleOf', property.multipleOf));
    } else if (property.type === 'array') {
      if (property.minItems !== undefined) details.push(new Detail('minItems', property.minItems));
      if (property.maxItems !== undefined) details.push(new Detail('maxItems', property.maxItems));
      if (property.uniqueItems !== undefined) details.push(new Detail('uniqueItems', property.uniqueItems));
    }

    return [typeAfterDetailsParsing, details, enumValues];
  }

  static parseProperties(properties, required, schemaName, verbose) {
    const parsedProperties = [];

    const relationShips = [];
    const referencedFiles = [];

    for (const propertyIndex of Object.keys(properties ?? {})) {
      const property = properties[propertyIndex];

      const name = propertyIndex;
      let { type } = property;
      let items;
      const { description } = property;
      const { example } = property;
      if (verbose) console.log(`processing property :: [${name}] of type ::  [${type}]`);

      if (type == null && property.$ref != null) {
        // reference to other object, maybe in other file
        const reference = property.$ref;
        const referencedFile = reference.match('^[^#]*\\.ya?ml');

        if (referencedFile != null && referencedFile.length === 1 && !referencedFiles.includes(referencedFile[0])) {
          referencedFiles.push(referencedFile[0]);
        }
        const to = utils.lastToken(reference, '/');
        type = to;
        relationShips.push(new RelationShip(schemaName, to, name, constants.RELATIONSHIP_USE));
      } else if (type === 'array') {
        type = 'array[] of ';
        items = {};
        let first = true;

        for (const itemIndex of Object.keys(property.items ?? {})) {
          const item = property.items[itemIndex];

          if (itemIndex === 'type') {
            // process array of primitives
            type += `${item}s`;
            items.type = item;
          } else if (itemIndex === '$ref') {
            // process array of specific schema
            if (typeof item === 'string') {
              // add relationShip
              const objectName = utils.lastToken(item, '/');
              relationShips.push(new RelationShip(schemaName, objectName, name, constants.RELATIONSHIP_AGGREGATION));

              type += objectName;
              items.refs = [objectName];

              // is it a reference to an external file?
              const referencedFile = item.match('^[^#]*\\.ya?ml');
              if (referencedFile != null && referencedFile.length === 1 && !referencedFiles.includes(referencedFile[0])) {
                referencedFiles.push(referencedFile[0]);
              }
            }
          } else if (['anyOf', 'oneOf', 'allOf'].includes(itemIndex)) {
            for (const refIndex of Object.keys(item)) {
              const reference = item[refIndex].$ref;

              const objectName = utils.lastToken(reference, '/');
              relationShips.push(new RelationShip(schemaName, objectName, name, constants.RELATIONSHIP_AGGREGATION));

              if (!first) {
                type += '/';
              }
              first = false;

              type += objectName;
              items.combinator = itemIndex;
              items.refs = items.refs || [];
              items.refs.push(objectName);

              const referencedFile = reference.match('^[^#]*\\.ya?ml');
              if (referencedFile != null && referencedFile.length === 1 && !referencedFiles.includes(referencedFile[0])) {
                referencedFiles.push(referencedFile[0]);
              }
            }
          }
        }
      }

      const [typeAfterDetailsParsing, details, enumValues] = this.parseDetails(property);

      if (typeAfterDetailsParsing !== undefined) type = typeAfterDetailsParsing;
      const requiredProperty = (required === undefined ? undefined : required.includes(name));

      parsedProperties.push(new Property(name, type, requiredProperty, details, description, example, enumValues, items));
    }
    return [parsedProperties, relationShips, referencedFiles];
  }
}


module.exports = Property;
