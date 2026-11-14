
const JSON_TYPES = new Set(['string', 'integer', 'boolean', 'object', 'null']);
const DATE_PATTERN = String.raw`^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$`;
const DATE_TIME_PATTERN = '^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T[0-5][0-9]:[0-5][0-9]:[0-5][0-9]Z$';

function arrayItemFields(items, ref) {
  if (items.type) return { items: { type: items.type } };
  if (items.refs?.length === 1) return { items: ref(items.refs[0]) };
  if (items.refs) return { items: { [items.combinator]: items.refs.map(ref) } };
  return {};
}

function typeFields(property, ref) {
  const { type, items } = property;
  if (type === 'enum') return { type: 'string' };
  if (type === 'number') return { type: 'number' };
  if (type === 'string [byte]' || type === 'string [binary]') return { type: 'string', format: type.slice('string ['.length, -1) };
  if (type === 'date') return { type: 'string', format: 'date', pattern: DATE_PATTERN };
  if (type === 'date-time') return { type: 'string', format: 'date-time', pattern: DATE_TIME_PATTERN };
  if (items) return { type: 'array', ...arrayItemFields(items, ref) };
  if (JSON_TYPES.has(type)) return { type };
  return ref(type);
}

// dates carry their own pattern instead of details; a number drops its format
function detailFields(property) {
  if (property.type === 'date' || property.type === 'date-time') return {};
  const details = (property.details ?? []).filter((detail) => property.type !== 'number' || detail.name !== 'format');
  return Object.fromEntries(details.map((detail) => [detail.name, detail.value]));
}

function generateProperty(property, listOfUsedSchemas) {
  // the root schema is addressed as '#'; a schema that is not rendered has no definition, so allow anything (the loader warns)
  const ref = (name) => {
    if (!listOfUsedSchemas.includes(name)) return {};
    return { $ref: name === listOfUsedSchemas[0] ? '#' : `#/definitions/${name}` };
  };

  const description = property.description ? { description: property.description } : {};
  const enumFields = property.enumValues ? { enum: property.enumValues } : {};
  const details = detailFields(property);
  // key order is part of the output: a number lists its constraints before its enum, every other type after
  const tail = property.type === 'number' ? { ...details, ...enumFields } : { ...enumFields, ...details };

  return { ...description, ...typeFields(property, ref), ...tail };
}

function generateSchema(schema, listOfUsedSchemas) {
  const js = {};
  const required = [];

  if (schema.properties) {
    schema.properties.forEach((property) => {
      js[property.name] = generateProperty(property, listOfUsedSchemas);
      if (property.required) {
        required.push(property.name);
      }
    });
  }

  const result = {};
  result.js = js;
  result.required = required;
  return result;
}

function generate(schemas) {
  const js = {};
  js.$schema = 'http://json-schema.org/draft-07/schema#';

  // used for rendering references easy and correctly
  const listOfUsedSchemas = Object.keys(schemas);

  // fills the root or a definition: an enum, or an object with its properties
  const fill = (target, schema) => {
    if (schema.enumValues) {
      if (schema.enumType) target.type = schema.enumType;
      target.enum = schema.enumValues;
    } else {
      const result = generateSchema(schema, listOfUsedSchemas);
      target.type = 'object';
      target.properties = result.js;
      target.required = result.required;
      target.additionalProperties = false;
    }
    return target;
  };

  listOfUsedSchemas.forEach((name, index) => {
    const schema = schemas[name];
    if (index === 0) {
      // the first schema is the root, so a leading enum makes the whole document an enum
      js.title = name;
      js.description = schema.description;
      fill(js, schema);
      js.definitions = {};
    } else {
      js.definitions[name] = fill({ description: schema.description }, schema);
    }
  });

  return JSON.stringify(js, null, 2);
}

module.exports = { generate };
