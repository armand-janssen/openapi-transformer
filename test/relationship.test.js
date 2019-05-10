const { assert } = require('chai');
const Relationship = require('../src/relationship');

describe('Test constructor', () =>{
  const expectedFrom = 'some-from';
  const expectedTo = 'some-to';
  const expectedDescription = 'some-description';
  const expectedType = 'some-type';
  const detail = new Relationship(expectedFrom, expectedTo,expectedDescription,expectedType);
  assert.equal(detail.from, expectedFrom);
  assert.equal(detail.to, expectedTo);
  assert.equal(detail.description, expectedDescription);
  assert.equal(detail.type, expectedType);
});