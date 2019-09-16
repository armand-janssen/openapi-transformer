const { assert } = require('chai');
const openApiGenerator = require('../src/index.js');

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

describe('openApiGenerator - loadYamlFile - two relationships -  circular $refs between files', () => {
  const loadedSchemas = openApiGenerator.loadYamlFile('./test/resources/generatorCircularRefs/componentA.yaml', true);

  assert.isDefined(loadedSchemas);
  it('Load two schema objects with circular reference.', () => {
    assert.equal(Object.keys(loadedSchemas).length, 2);
  });

  it('Check relationships: between circular entities.', () => {
    assertRelationShip(loadedSchemas.componentA.relationShips[0], 'componentA', 'componentB', 'componentB', 'use');
    assertRelationShip(loadedSchemas.componentB.relationShips[0], 'componentB', 'componentA', 'componentA', 'use');
  });
});
