
const header = '# ';
const lineBreak = '\n';
const firstRowSeperator = '| ';
const lastRowSeperator = ' |';
const rowSeperator = ' | ';
const headerCenterAligned = ':---:';
const headerLeftAligned = ':---';
const colon = ' : ';
const nbsp = '&nbsp;';

function escapePipe(text) {
  return text.replace(/\|/g, '\\|');
}
function createMainHeader(text) {
  return lineBreak + header + text + lineBreak;
}

function createTableHeader() {
  let md = firstRowSeperator;

  md += `property${rowSeperator}`;
  md += `required${rowSeperator}`;
  md += `type${rowSeperator}`;
  md += `description${rowSeperator}`;
  md += `details${rowSeperator}`;
  md += `example${lastRowSeperator}`;
  md += lineBreak;

  md += firstRowSeperator + headerLeftAligned; // property
  md += rowSeperator + headerCenterAligned; // required
  md += rowSeperator + headerCenterAligned; // type
  md += rowSeperator + headerLeftAligned; // description
  md += rowSeperator + headerLeftAligned; // details
  md += rowSeperator + headerLeftAligned; // example
  md += lastRowSeperator + lineBreak;

  return md;
}

function generateDetails(details, isEnum) {
  if (details == null || details === undefined || details.length === 0) return nbsp;

  let md = '<ul>';
  details.forEach((detail) => {
    md += '<li>';
    if (!isEnum) {
      md += detail.name;
      md += colon;
    }
    md += detail.value;
    md += '</li>';
  });
  md += '</ul>';
  return md;
}

function generateProperty(property) {
  let markDownDetails = '';
  if (property.type === 'enum') {
    markDownDetails += generateDetails(property.details, true);
  } else {
    markDownDetails += generateDetails(property.details, false);
  }
  markDownDetails = escapePipe(markDownDetails);

  let markDownDescription = property.description === undefined ? nbsp : property.description
    .replace(/\n/g, '<br/>')
    .replace(/todo/gi, '<span style="color:red"> **TODO** </span>');
  markDownDescription = escapePipe(markDownDescription);

  let markDownExample = property.example === undefined ? nbsp : property.example.toString()
    .replace(/\n/g, '<br/>');
  markDownExample = escapePipe(markDownExample);

  return firstRowSeperator + property.name
    + rowSeperator + (property.required ? 'Y' : nbsp)
    + rowSeperator + property.type
    + rowSeperator + markDownDescription
    + rowSeperator + markDownDetails
    + rowSeperator + markDownExample
    + lastRowSeperator + lineBreak;
}

function generateSchema(schema) {
  let md = createMainHeader(schema.name);
  md += schema.description === undefined ? nbsp : schema.description.replace(/\n/g, '<br/>').replace(/todo/gi, '<span style="color:red"> **TODO** </span>');
  md += lineBreak + lineBreak;

  if (schema.properties === undefined || schema.properties.length === 0) {
    md += lineBreak;
  } else {
    md += createTableHeader();
    schema.properties.forEach((property) => {
      md += generateProperty(property);
    });
  }
  return md;
}
function generate(schemas) {
  let md = '';

  // eslint-disable-next-line no-restricted-syntax
  for (const schemaIndex in schemas) {
    if (Object.prototype.hasOwnProperty.call(schemas, schemaIndex)) {
      md += generateSchema(schemas[schemaIndex]);
    }
  }
  return md;
}

module.exports = { generate };
