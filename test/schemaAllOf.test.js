const { assert } = require('chai');
const sinon = require('sinon');
const util = require('util');
const Property = require('../src/property');
const Schema = require('../src/schema');

// console.log('*** Schemas: ' + util.inspect(schemas, { showHidden: false, depth: null }));


function sizeOfArray(array) {
  let count = 0;
  // eslint-disable-next-line no-restricted-syntax
  // eslint-disable-next-line guard-for-in
  // eslint-disable-next-line no-empty-pattern
  for (const { } in array) {
    count += 1;
  }
  return count;
}

describe('schemas - parseSchemas - test inheritence', () => {
  // mock the schema
  const mockedSchemas = {};
  const mockedChild = {};
  mockedChild.title = 'Child';
  mockedChild.description = 'Child information';
  mockedChild.allOf = [];

  const ref = {};
  ref.$ref = '#/components/schemas/child';

  const other = {};
  other.type = 'object';

  // property only added to trigger sinon mock
  other.properties = {};
  other.properties.name = {};
  other.properties.name.description = 'the name of the owner';

  mockedChild.allOf.push(ref);
  mockedChild.allOf.push(other);

  mockedSchemas.child = mockedChild;

  console.log(`mockedSchema: ${util.inspect(mockedSchemas, { showHidden: false, depth: null })}`);

  // Mock the properties
  const mockedRelationShips = [];
  const mockedReferencedFiles = [];
  const mockedProperties = [new Property('fake', 'string')];
  const propertiesResponse = [mockedProperties, mockedRelationShips, mockedReferencedFiles];
  const propertyStub = sinon.stub(Property, 'parseProperties').returns(propertiesResponse);

  const verbose = true;

  const arrayUnderTest = Schema.parseSchemas(mockedSchemas, verbose);
  // console.log(`arrayUnderTest: ${util.inspect(arrayUnderTest, { showHidden: false, depth: null })}`);

  sinon.restore();

  assert.isDefined(arrayUnderTest);
  assert.equal(propertyStub.calledOnce, true);

  assert.equal(arrayUnderTest.length, 2);

  it('should return 2 referencedfiles', () => {
    assert.equal(arrayUnderTest[0].length, 0);
  });
  it('should return 1 parsedSchema', () => {
    assert.equal(sizeOfArray(arrayUnderTest[1]), 1);
  });

  it('validate schema', () => {
    const schema = arrayUnderTest[1].child;
    // console.log(schema);
    assert.equal(schema.name, 'child');
    assert.equal(schema.description, 'Child information');
    assert.equal(schema.properties.length, mockedProperties.length);
    assert.equal(schema.relationShips.length, 0);
    assert.equal(schema.parent, 'child');
  });
});
