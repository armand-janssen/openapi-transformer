
const lineBreak = '\n';
const rowSeperator = ',';
const colon = ':';

function escapePipe(text) {
    if(text === null)
        return '';
        
    if(text.replace === undefined)
        text = text.toString();

    return '"'+text.replace(/\"/g, '""')+'"';
  }

function generateDetails(details, isEnum) {
  if (details == null || details === undefined || details.length === 0) return '';

  let csv = '';
  details.forEach((detail) => {
    if (!isEnum) {
      csv += detail.name;
      csv += colon;
    }
    csv += detail.value;
    csv += '; ';
  });
  return csv;
}

function generateProperty(schemaName,property) {
  let details = '';
  if (property.type === 'enum') {
    details += generateDetails(property.details, true);
  } else if (property.type === 'date') {
    details += generateDetails(property.details, false);
    details += generateDetails([{ name: 'pattern', value: 'yyyy-MM-dd' }], false);
  } else {
    details += generateDetails(property.details, false);
  }
  details = escapePipe(details);

  let description = property.description === undefined ? '' : escapePipe(property.description);

  let example = '';
  if (property.type === 'date') {
    example = property.example === undefined ? '2020-12-31' : property.example;
  } else {
    example = property.example === undefined ? '' : property.example;
  }

  example = escapePipe(example);

  return escapePipe(schemaName)
    + rowSeperator + escapePipe(property.name)
    + rowSeperator + (property.required ? 'Y' : 'N')
    + rowSeperator + escapePipe(property.type)
    + rowSeperator + description
    + rowSeperator + details
    + rowSeperator + example
    + lineBreak;
}

function generateSchema(schema) {

  let csv = '';

  if (schema.properties === undefined || schema.properties.length === 0) {
    
  } else {
    schema.properties.forEach((property) => {
      csv += generateProperty(schema.name,property);
    });
  }
  return csv;
}

function generate(schemas) {
  let csv = 'Type'
  + rowSeperator + 'Property name' 
  + rowSeperator + 'Required'
  + rowSeperator + 'Property type'
  + rowSeperator + 'Description'
  + rowSeperator + 'Details'
  + rowSeperator + 'Example'
  + lineBreak;

  
  for (const schemaIndex in schemas) {
    if (Object.prototype.hasOwnProperty.call(schemas, schemaIndex)) {
      csv += generateSchema(schemas[schemaIndex]);
    }
  }
  return csv;
}

module.exports = { generate };