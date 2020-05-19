
function generateEnum(details) {
  const array = [];
  details.forEach((detail) => {
    array.push(detail.value);
  });
  return array;
}

function generateProperty(property, listOfUsedSchemas) {
  const js = {};
  let processDetails = true;

  if (property.description) {
    js.description = property.description;
  }
  if (property.type === 'enum') {
    js.type = 'string';
    js.enum = generateEnum(property.details);
    processDetails = false;
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
  } else if (property.type === 'string [byte]') {
    js.type = 'string';
  } else if (property.type === 'date') {
    js.type = 'string';
    js.format = 'date';
    js.pattern = '^\\d{4}\\-(0[1-9]|1[012])\\-(0[1-9]|[12][0-9]|3[01])$';
    processDetails = false;
  } else if (property.type.indexOf('array[] of ') > -1) {
    js.type = 'array';
    js.items = {};
    js.items.$ref = `#/definitions/${property.type.slice('11')}`;
  } else {
    const { type } = property;
    if (type && listOfUsedSchemas.includes(type)) {
      js.$ref = `#/definitions/${type}`;
    } else {
      js.type = property.type;
    }
  }
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
  const listOfUsedSchemas = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const schemaIndex in schemas) {
    if (Object.prototype.hasOwnProperty.call(schemas, schemaIndex)) {
      listOfUsedSchemas.push(schemaIndex);
    }
  }

  let firstProperty = true;
  // eslint-disable-next-line no-restricted-syntax
  for (const schemaIndex in schemas) {
    if (Object.prototype.hasOwnProperty.call(schemas, schemaIndex)) {
      const schema = schemas[schemaIndex];
      const result = generateSchema(schema, listOfUsedSchemas);
      if (firstProperty) {
        js.title = schemaIndex;
        js.description = schema.description;
        js.type = 'object';
        js.properties = result.js;
        js.required = result.required;
        js.additionalProperties = false;
        js.definitions = {};
      } else {
        js.definitions[schemaIndex] = {};
        const definition = js.definitions[schemaIndex];
        js.description = schema.description;
        definition.type = 'object';
        definition.properties = result.js;
        definition.required = result.required;
        definition.additionalProperties = false;
      }
      firstProperty = false;
    }
  }

  return JSON.stringify(js, null, 2);
}

module.exports = { generate };
