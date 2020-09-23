const { assert } = require('chai');
const openApiGenerator = require('../src/index.js');

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

describe('openApiGenerator - loadYamlFile - two relationships -  circular $refs between files', () => {
  it('Load two schema objects with circular reference.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/generatorCircularRefs/componentA.yaml', true);

    assert.isDefined(loadedSchemas);
    assert.equal(Object.keys(loadedSchemas).length, 2);
  });

  it('Check relationships: between circular entities.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('./test/resources/generatorCircularRefs/componentA.yaml', true);

    assert.isDefined(loadedSchemas);
    assertRelationShip(loadedSchemas.componentA.relationShips[0], 'componentA', 'componentB', 'componentB', 'use');
    assertRelationShip(loadedSchemas.componentB.relationShips[0], 'componentB', 'componentA', 'componentA', 'use');
  });
});
