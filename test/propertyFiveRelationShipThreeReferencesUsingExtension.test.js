const { assert } = require('chai');
const YAML = require('yaml');
const fs = require('fs');
const Property = require('../src/property');

function getTestData(testYamlFile) {
  const loadedFile = fs.readFileSync(testYamlFile, 'UTF-8');
  return YAML.parse(loadedFile)
}

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {  
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

function assertDetail(detail, expectedName, expectedValue) {
  assert.equal(detail.name, expectedName);
  assert.equal(detail.value, expectedValue);
}

describe('properties - parseProperties - two relationships - one references to other files', () => {
  const testData = getTestData('./test/resources/propertyFiveRelationShipThreeReferencesUsingExtension.test.yaml');

  const { properties } = testData.components.schemas.owner;
  const { required } = testData.components.schemas.owner;
  const extraAttributeDetails = true;
  const verbose = false;

  const arrayUnderTest = Property.parseProperties(properties, required, 'owner', verbose);
  assert.isDefined(arrayUnderTest);
 
  it('Check response from parseProperties', () => {
    assert.equal(arrayUnderTest.length, 3);
    assert.equal(arrayUnderTest[0].length, 2); // properties
    assert.equal(arrayUnderTest[1].length, 5); // relation ships
    assert.equal(arrayUnderTest[2].length, 2); // external files
  });
  it('Check property: child', () => {
    const property = arrayUnderTest[0][0];
    assert.equal(property.name, 'child');
    assert.equal(property.type, 'child');
    assert.equal(property.required, undefined);
    assert.equal(property.description, undefined);
    assert.equal(property.example, undefined);

    assert.equal(property.details.length, 0);
  });
  it('Check property: family', () => {
    const property = arrayUnderTest[0][1];
    assert.equal(property.name, 'family');
    assert.equal(property.type, 'array[] of partner/father/mother/child');
    assert.equal(property.required, undefined);
    assert.equal(property.description, 'family of the owner');
    assert.equal(property.example, undefined);

    assert.equal(property.details.length, 0);
  });

  it('Check relationship: child', () => {
    assertRelationShip(arrayUnderTest[1][0],'owner', 'child', 'child', 'use');
  });
  it('Check relationship: partner', () => {
    // const relationShip = arrayUnderTest[1][1];
    // assert.equal(relationShip, ' *-- partner : family');
    assertRelationShip(arrayUnderTest[1][1],'owner', 'partner', 'family', 'aggregation');
  });

  it('Check relationship: father', () => {
    // const relationShip = arrayUnderTest[1][2];
    // assert.equal(relationShip, ' *-- father : family');
    assertRelationShip(arrayUnderTest[1][2],'owner', 'father', 'family', 'aggregation');
  });
  it('Check relationship: mother', () => {
    // const relationShip = arrayUnderTest[1][3];
    // assert.equal(relationShip, ' *-- mother : family');
    assertRelationShip(arrayUnderTest[1][3],'owner', 'mother', 'family', 'aggregation');
  });
  it('Check relationship: child', () => {
    // const relationShip = arrayUnderTest[1][4];
    // assert.equal(relationShip, ' *-- child : family');
    assertRelationShip(arrayUnderTest[1][4],'owner', 'child', 'family', 'aggregation');
  });

  it('Check external file: child', () => {
    const file = arrayUnderTest[2][0];
    assert.equal(file, 'child.yaml');
  });

  it('Check external file: parent', () => {
    const file = arrayUnderTest[2][1];
    assert.equal(file, 'parent.yaml');
  });

});



