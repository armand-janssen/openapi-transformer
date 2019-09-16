const { assert, expect } = require('chai');
const fs = require('fs');
const jsonSchemaTransformer = require('../src/jsonSchemaTransformer');

const openApiGenerator = require('../src/index.js');


describe('openApiGenerator - test plantUml transformer', () => {
  it('Test with no reference.', () => {
    const loadedSchemas = openApiGenerator.loadYamlFile('./test/resources/propertyNoRelationShipNoReferences.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = jsonSchemaTransformer.generate(loadedSchemas, true);
    const expectedResult = fs.readFileSync('./test/resources/expectedResultPlantumlPropertyNoRelationShipNoReferences.json');

    expect(result).to.deep.equal(expectedResult.toString());
  });
  it('Test with references.', () => {
    const loadedSchemas = openApiGenerator.loadYamlFile('./test/resources/propertyFiveRelationShipThreeReferencesUsingExtension.test.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = jsonSchemaTransformer.generate(loadedSchemas);
    const expectedResult = fs.readFileSync('./test/resources/expectedPropertyFiveRelationShipThreeReferencesUsingExtension.json');

    expect(result).to.deep.equal(expectedResult.toString());
  });
});
