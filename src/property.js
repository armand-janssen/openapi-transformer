const { constants } = require('./constants');
const utils = require('./utils');
const Detail = require('./detail');
const RelationShip = require('./relationship');

const NUMBER_DETAILS = ['format', 'minimum', 'maximum', 'multipleOf'];
// Maps (not objects) so a type or format named like an Object.prototype member finds nothing.
const DETAIL_NAMES = new Map([
  ['string', ['minLength', 'maxLength', 'pattern']],
  ['number', NUMBER_DETAILS],
  ['integer', NUMBER_DETAILS],
  ['array', ['minItems', 'maxItems', 'uniqueItems']],
]);
const STRING_FORMAT_TYPES = new Map([
  ['date', 'date'],
  ['date-time', 'date-time'],
  ['binary', 'string [binary]'],
  ['byte', 'string [byte]'],
]);
const COMBINATORS = new Set(['anyOf', 'oneOf', 'allOf']);

class Property {
  constructor(name, type, required, details, description, example, { enumValues, items } = {}) {
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
    const details = (DETAIL_NAMES.get(property.type) ?? [])
      .filter((name) => property[name] !== undefined)
      .map((name) => new Detail(name, property[name]));

    // a string enum becomes type 'enum'; other enums keep their type and only carry the values
    let typeAfterDetailsParsing;
    if (property.type === 'string') {
      typeAfterDetailsParsing = property.enum === undefined ? STRING_FORMAT_TYPES.get(property.format) : 'enum';
    }
    return [typeAfterDetailsParsing, details, property.enum];
  }

  // Returns [display type, items] of an array property; addReference records a referenced schema and returns its name.
  static parseArrayItems(definition, addReference) {
    const items = {};
    let type = 'array[] of ';
    let separator = '';

    for (const [key, item] of Object.entries(definition ?? {})) {
      if (key === 'type') {
        // array of primitives
        type += `${item}s`;
        items.type = item;
      } else if (key === '$ref' && typeof item === 'string') {
        // array of one specific schema
        const objectName = addReference(item);
        type += objectName;
        items.refs = [objectName];
      } else if (COMBINATORS.has(key)) {
        for (const member of Object.values(item)) {
          const objectName = addReference(member.$ref);
          type += separator + objectName;
          separator = '/';
          items.combinator = key;
          items.refs = [...(items.refs ?? []), objectName];
        }
      }
    }
    return [type, items];
  }

  static parseProperties(properties, required, schemaName, verbose) {
    const parsedProperties = [];
    const relationShips = [];
    const referencedFiles = [];

    for (const [name, property] of Object.entries(properties ?? {})) {
      let { type } = property;
      let items;
      if (verbose) console.log(`processing property :: [${name}] of type ::  [${type}]`);

      // reference to another schema, maybe in another file
      const addReference = (reference, relationShipType) => {
        const to = utils.lastToken(reference, '/');
        relationShips.push(new RelationShip(schemaName, to, name, relationShipType));
        utils.addReferencedFile(reference, referencedFiles);
        return to;
      };

      if (type == null && property.$ref != null) {
        type = addReference(property.$ref, constants.RELATIONSHIP_USE);
      } else if (type === 'array') {
        [type, items] = Property.parseArrayItems(property.items, (reference) => addReference(reference, constants.RELATIONSHIP_AGGREGATION));
      }

      const [typeAfterDetailsParsing, details, enumValues] = Property.parseDetails(property);
      if (typeAfterDetailsParsing !== undefined) type = typeAfterDetailsParsing;
      const requiredProperty = (required === undefined ? undefined : required.includes(name));

      parsedProperties.push(new Property(name, type, requiredProperty, details, property.description, property.example, { enumValues, items }));
    }
    return [parsedProperties, relationShips, referencedFiles];
  }
}


module.exports = Property;
