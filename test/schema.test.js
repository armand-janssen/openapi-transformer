const YAML = require('yaml');
const Schema = require('../src/schema');
const { assertMatchesExpected } = require('./helpers');

const nameProperty = { name: { description: 'the name of the owner' } };

// Each case is parsed and compared with test/expected/schemas/<name>.yaml: the referenced files and the parsed schemas.
describe('Schema.parseSchemas', () => {
  const cases = {
    noRelationshipsNoReferences: {
      owner: {
        title: 'Owner', description: 'Owner information', type: 'object', properties: nameProperty,
      },
    },
    threeRelationshipsTwoReferences: {
      owner: {
        title: 'Owner',
        description: 'Owner information',
        type: 'object',
        properties: {
          partner: { $ref: 'parent.yaml#/components/schemas/parent' },
          children: { type: 'array', items: { $ref: 'child.yml#/components/schemas/child' } },
          parents: { type: 'array', items: { $ref: 'parent.yaml#/components/schemas/parent' } },
        },
      },
    },
    allOf: {
      child: {
        title: 'Child',
        description: 'Child information',
        allOf: [{ $ref: '#/components/schemas/child' }, { type: 'object', properties: nameProperty }],
      },
    },
  };

  Object.entries(cases).forEach(([name, schemas]) => {
    it(name, () => {
      const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, false);

      assertMatchesExpected(YAML.stringify({ referencedFiles, schemas: parsedSchemas }), `schemas/${name}.yaml`);
    });
  });
});
