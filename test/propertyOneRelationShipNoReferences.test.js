const { assert } = require('chai');
const YAML = require('yaml');
const fs = require('fs');
const Property = require('../src/property');

function getTestData(testYamlFile) {
  const loadedFile = fs.readFileSync(testYamlFile, 'UTF-8');
  return YAML.parse(loadedFile)
}

function assertDetail(detail, expectedName, expectedValue) {
  assert.equal(detail.name, expectedName);
  assert.equal(detail.value, expectedValue);
}

describe('properties - parseProperties - one relationship - no references to other files', () => {
  const testData = getTestData('./test/resources/propertyOneRelationShipNoReferences.yaml');

  const { properties } = testData.components.schemas.owner;
  const { required } = testData.components.schemas.owner;
  const extraAttributeDetails = true;
  const verbose = false;

  const arrayUnderTest = Property.parseProperties(properties, required, 'owner', verbose);
  assert.isDefined(arrayUnderTest);
  it('Reponse is array of sub-arrays of which the first one contains properties and the second one the ', () => {
    assert.equal(arrayUnderTest.length, 3);
    assert.equal(arrayUnderTest[0].length, 2); // properties
    assert.equal(arrayUnderTest[1].length, 1); // relation ships
    assert.equal(arrayUnderTest[2].length, 0); // external files
  });

  it('Check first property: name', () => {
    const property = arrayUnderTest[0][0];
    assert.equal(property.name, 'name');
    assert.equal(property.type, 'string');
    assert.equal(property.required, false);
    assert.equal(property.description, 'the name of the owner');
    assert.equal(property.example, 'John Doe');

    assert.equal(property.details.length, 1);
    assertDetail(property.details[0], 'maxLength', '30');
  });

  it('Check first relationship: partner', () => {
    const relationShip = arrayUnderTest[1][0];
    assert.equal(relationShip.from, 'owner');
    assert.equal(relationShip.to, 'partner');
    assert.equal(relationShip.description, 'partner');
    assert.equal(relationShip.type, 'use');
  });


});

