const { assert } = require('chai');
const openApiGenerator = require('../src/index.js');

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

describe('openApiGenerator - loadYamlFile - one relationship - relative directory $ref between files', () => {

  const loadedSchemas =
    openApiGenerator.loadYamlFile('./test/resources/generatorRelativeDirectoryRefs/parentSchema.yaml', false);

  assert.isDefined(loadedSchemas);
  it('Load two schema objects from a parent reference file.', () => {
    assert.equal(loadedSchemas.length, 2);
  });

  it('Check relationships: $ref is via relative (double dot) directory path.', () => {
    assertRelationShip(loadedSchemas[0].relationShips[0], 'componentA', 'id', 'id', 'use');
  });

});