const { assert } = require('chai');
const Detail = require('../src/detail');

describe('Test constructor', () =>{
  const expectedName = 'some-name';
  const expectedValue = 'some-value';
  const detail = new Detail(expectedName, expectedValue);
  assert.equal(detail.name, expectedName);
  assert.equal(detail.value, expectedValue);
});