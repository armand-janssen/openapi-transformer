const { assert } = require('chai');
const openApiGenerator = require('../src/index.js');

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

describe('openApiGenerator - loadYamlFile - one relationship - relative directory $ref between files', () => {
  it('Load two schema objects from a parent reference file.', async () => {
    const loadedSchemas =
      await openApiGenerator.loadYamlFile('./test/resources/generatorRelativeDirectoryRefs/parentSchema.yaml', false);

    assert.isDefined(loadedSchemas);
    assert.equal(Object.keys(loadedSchemas).length, 2);
  });

  it('Check relationships: $ref is via relative (double dot) directory path.', async () => {
    const loadedSchemas =
      await openApiGenerator.loadYamlFile('./test/resources/generatorRelativeDirectoryRefs/parentSchema.yaml', false);

    assert.isDefined(loadedSchemas);
    assertRelationShip(loadedSchemas.componentA.relationShips[0], 'componentA', 'id', 'id', 'use');
  });
});
