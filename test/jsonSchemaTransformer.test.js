const { assert, expect } = require('chai');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const jsonSchemaTransformer = require('../src/jsonSchemaTransformer');

const openApiGenerator = require('../src/index');


describe('openApiGenerator - test json transformer', () => {
  it('Test with no reference.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/propertyNoRelationShipNoReferences.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = jsonSchemaTransformer.generate(loadedSchemas, true);
    const expectedResult = fs.readFileSync('./test/resources/expectedResultPlantumlPropertyNoRelationShipNoReferences.json');

    expect(JSON.parse(result)).to.deep.equal(JSON.parse(expectedResult.toString()));
  });

  it('Test with references.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/propertyFiveRelationShipThreeReferencesUsingExtension.test.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = jsonSchemaTransformer.generate(loadedSchemas);
    const expectedResult = fs.readFileSync('./test/resources/expectedPropertyFiveRelationShipThreeReferencesUsingExtension.json');

    expect(JSON.parse(result)).to.deep.equal(JSON.parse(expectedResult.toString()));
  });

  it('Test with datetime  property.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/propertyDateTime.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = jsonSchemaTransformer.generate(loadedSchemas);
    const expectedResult = fs.readFileSync('./test/resources/expectedPropertyDateTime.json');

    expect(JSON.parse(result)).to.deep.equal(JSON.parse(expectedResult.toString()));
  });
});

describe('Pinned JSON Schema expected files', () => {
  const findJson = (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? findJson(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    .filter((f) => f.endsWith('.json'));

  findJson(path.join(__dirname, 'expected')).forEach((file) => {
    it(`${path.relative(__dirname, file)} is a valid draft-07 schema`, () => {
      const ajv = new Ajv({ strict: false });
      assert.doesNotThrow(() => ajv.compile(JSON.parse(fs.readFileSync(file, 'utf8'))));
    });
  });
});
