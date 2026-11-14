const HEADER = ['schema', 'property', 'required', 'type', 'description', 'details', 'enum', 'example'];

// RFC 4180: quote a field only when it contains a comma, a double quote or a line break.
function field(value) {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const list = (values) => (values ?? []).join('; ');

function propertyRow(schema, property) {
  return [
    schema.name,
    property.name,
    Boolean(property.required),
    property.type,
    property.description,
    list(property.details?.map((detail) => `${detail.name}: ${detail.value}`)),
    list(property.enumValues),
    property.example,
  ];
}

// One row per property; a top-level enum is one row without a property.
function schemaRows(schema) {
  if (schema.enumValues) {
    const type = schema.enumType && schema.enumType !== 'string' ? schema.enumType : 'enum';
    return [[schema.name, '', '', type, schema.description, '', list(schema.enumValues), '']];
  }
  return (schema.properties ?? []).map((property) => propertyRow(schema, property));
}

function generate(schemas) {
  const rows = [HEADER, ...Object.values(schemas ?? {}).flatMap(schemaRows)];
  return rows.map((row) => `${row.map(field).join(',')}\n`).join('');
}

module.exports = { generate };
