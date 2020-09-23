const { assert, expect } = require('chai');
const fs = require('fs');
const plantUmlTransformer = require('../src/plantUmlTransformer');

const openApiGenerator = require('../src/index.js');


describe('openApiGenerator - test plantUml transformer', () => {
  it('Test with no reference.', async () => {
    console.log(" ******************************************")
    console.log(" ******************************************")
    console.log(" ******************************************")
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/propertyNoRelationShipNoReferences.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = plantUmlTransformer.generate(loadedSchemas, true);
    const expectedResult = fs.readFileSync('./test/resources/expectedResultPlantumlPropertyNoRelationShipNoReferences.plantuml');

    expect(result).to.deep.equal(expectedResult.toString());
  });
  it('Test with references.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/propertyFiveRelationShipThreeReferencesUsingExtension.test.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = plantUmlTransformer.generate(loadedSchemas);
    const expectedResult = fs.readFileSync('./test/resources/expectedPropertyFiveRelationShipThreeReferencesUsingExtension.plantuml');

    console.log('======== result: ' + result);
    expect(result).to.deep.equal(expectedResult.toString());
  });
});
