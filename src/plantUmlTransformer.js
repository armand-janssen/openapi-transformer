const { constants } = require('./constants');

function generateParents(schema) {
  return [schema.parent, ...(schema.additionalParents || [])]
    .filter((parent) => parent !== undefined)
    .map((parent) => `${parent} <|-- ${schema.name}${constants.lineBreak}`)
    .join('');
}
function generateRelationShips(relationShips) {
  let uml = '';
  if (relationShips !== undefined) {
    relationShips.forEach((relationShip) => {
      uml += relationShip.from;

      if (relationShip.type === constants.RELATIONSHIP_AGGREGATION) {
        uml += ' *-- ';
      } else if (relationShip.type === constants.RELATIONSHIP_USE) {
        uml += ' -- ';
      }
      uml += relationShip.to;

      uml += constants.space;
      uml += constants.colon;
      uml += constants.space;

      uml += relationShip.description;
      uml += constants.lineBreak;
    });
  }
  return uml;
}
function generateDetails(details, isEnum) {
  if (details.length === 0) return '';
  let first = true;

  let uml = constants.detailStart;
  details.forEach((detail) => {
    if (!first) uml += constants.comma;
    first = false;

    if (!isEnum) {
      uml += detail.name;
      uml += constants.colon;
    }
    uml += detail.value;
  });
  uml += constants.detailEnd;
  return uml;
}

function generateProperty(property, generateExtraDetails) {
  let uml = property.name;
  uml += constants.space;
  uml += property.required ? '*' : '';
  uml += constants.colon;
  uml += property.type;

  if (generateExtraDetails) {
    if (property.type === 'enum') {
      uml += generateDetails(property.enumValues.map((value) => ({ value })), true);
      uml += generateDetails(property.details, false);
    } else if (property.type === 'date') {
      uml += generateDetails(property.details, false);
      uml += generateDetails([{ name: 'pattern', value: 'yyyy-MM-dd' }], false);
    } else if (property.type === 'date-time') {
      uml += generateDetails(property.details, false);
      uml += generateDetails([{ name: 'pattern', value: 'yyyy-MM-ddTHH:mm:ssZ' }], false);
    } else {
      uml += generateDetails(property.details, false);
    }
  }
  uml += constants.lineBreak;

  // when a property contains a parenthesis ( or ), then plantuml generates it as a method instead of field
  if (uml.includes('(') || uml.includes(')')) {
    uml = `{field} ${uml}`;
  }
  return constants.tab + uml;
}
function generateSchema(schema, generateExtraDetails) {
  let uml = constants.lineBreak;
  uml += schema.enumValues ? 'enum ' : 'class ';
  uml += schema.name;
  uml += ' {';
  uml += constants.lineBreak;

  if (schema.enumValues) {
    schema.enumValues.forEach((value) => { uml += constants.tab + value + constants.lineBreak; });
  }
  if (schema.properties !== undefined) {
    schema.properties.forEach((property) => {
      uml += generateProperty(property, generateExtraDetails);
    });
  }

  uml += constants.lineBreak;
  uml += '}';
  uml += constants.lineBreak;

  uml += generateRelationShips(schema.relationShips);
  uml += generateParents(schema);

  return uml;
}

function generate(schemas, generateExtraDetails) {
  let uml = `@startuml${constants.lineBreak}`;
  // eslint-disable-next-line no-restricted-syntax
  for (const schemaIndex in schemas) {
    if (Object.prototype.hasOwnProperty.call(schemas, schemaIndex)) {
      uml += generateSchema(schemas[schemaIndex], generateExtraDetails);
    }
  }
  uml += `@enduml${constants.lineBreak}`;
  return uml;
}

module.exports = { generate };
