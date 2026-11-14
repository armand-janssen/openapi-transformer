const { assert, expect } = require('chai');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const openApiGenerator = require('..');


describe('openApiGenerator - test json transformer', () => {
  [
    ['no reference', 'propertyNoRelationShipNoReferences.yaml', 'expectedResultPlantumlPropertyNoRelationShipNoReferences.json'],
    ['references', 'propertyFiveRelationShipThreeReferencesUsingExtension.test.yaml', 'expectedPropertyFiveRelationShipThreeReferencesUsingExtension.json'],
    ['datetime property', 'propertyDateTime.yaml', 'expectedPropertyDateTime.json'],
  ].forEach(([title, input, expected]) => {
    it(`Test with ${title}.`, async () => {
      const loadedSchemas = await openApiGenerator.loadYamlFile(`./test/resources/${input}`, true);

      const result = openApiGenerator.generateJsonSchema(loadedSchemas);

      expect(JSON.parse(result)).to.deep.equal(JSON.parse(fs.readFileSync(`./test/resources/${expected}`, 'utf8')));
    });
  });
});

describe('Pinned JSON Schema expected files', () => {
  const findJson = (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? findJson(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    .filter((f) => f.endsWith('.json'));

  [...findJson(path.join(__dirname, 'expected')), ...findJson(path.join(__dirname, '..', 'example'))].forEach((file) => {
    it(`${path.relative(__dirname, file)} is a valid draft-07 schema`, () => {
      const ajv = new Ajv({ strict: false });
      assert.doesNotThrow(() => ajv.compile(JSON.parse(fs.readFileSync(file, 'utf8'))));
    });

    // ajv compiles lazily and skips definitions the root never reaches, so resolve every $ref by hand
    it(`${path.relative(__dirname, file)} has no unresolvable $ref`, () => {
      const root = JSON.parse(fs.readFileSync(file, 'utf8'));
      const refs = [];
      const walk = (node) => {
        if (node && typeof node === 'object') {
          if (typeof node.$ref === 'string') refs.push(node.$ref);
          Object.values(node).forEach(walk);
        }
      };
      walk(root);
      refs.forEach((ref) => {
        const target = ref.replace(/^#\/?/, '').split('/').filter(Boolean)
          .reduce((node, key) => node?.[key], root);
        assert.isObject(target, `${ref} does not resolve`);
      });
    });
  });
});
