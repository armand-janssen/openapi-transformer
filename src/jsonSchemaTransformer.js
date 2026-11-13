
const JSON_TYPES = ['string', 'integer', 'boolean', 'object', 'null'];

function generateProperty(property, listOfUsedSchemas) {
  const js = {};
  let processDetails = true;
  // the root schema is addressed as '#'; a schema that is not rendered has no definition, so allow anything (the loader warns)
  const ref = (name) => {
    if (!listOfUsedSchemas.includes(name)) return {};
    return { $ref: name === listOfUsedSchemas[0] ? '#' : `#/definitions/${name}` };
  };

  if (property.description) {
    js.description = property.description;
  }
  if (property.type === 'enum') {
    js.type = 'string';
  } else if (property.type === 'number') {
    js.type = 'number';
    if (property.details) {
      property.details.forEach((detail) => {
        if (detail.name !== 'format') {
          js[detail.name] = detail.value;
        }
      });
      processDetails = false;
    }
  } else if (property.type === 'string [byte]' || property.type === 'string [binary]') {
    js.type = 'string';
    js.format = property.type.slice('string ['.length, -1);
  } else if (property.type === 'date') {
    js.type = 'string';
    js.format = 'date';
    js.pattern = '^\\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$';
    processDetails = false;
  } else if (property.type === 'date-time') {
    js.type = 'string';
    js.format = 'date-time';
    js.pattern = '^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T[0-5][0-9]:[0-5][0-9]:[0-5][0-9]Z$';
    processDetails = false;
  } else if (property.items) {
    js.type = 'array';
    const { items } = property;
    if (items.type) js.items = { type: items.type };
    else if (items.refs?.length === 1) js.items = ref(items.refs[0]);
    else if (items.refs) js.items = { [items.combinator]: items.refs.map(ref) };
  } else {
    const { type } = property;
    if (JSON_TYPES.includes(type)) js.type = type;
    else Object.assign(js, ref(type));
  }
  if (property.enumValues) js.enum = property.enumValues;
  if (processDetails && property.details) {
    property.details.forEach((detail) => {
      js[detail.name] = detail.value;
    });
  }

  return js;
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
