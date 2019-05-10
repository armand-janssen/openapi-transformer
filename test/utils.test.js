const { assert } = require('chai');
const utils = require('../src/utils');

describe('test lastToken function', () => {
  it('Test adding new value is only added if not already present', () => {
    assert.equal(utils.lastToken('some-string-with-a-value', '-'), 'value');
    assert.equal(utils.lastToken('some-other.string', '.'), 'string');
    assert.equal(utils.lastToken('some-string-with-a-value', '.'), null);
  });
});
describe('test add to array if not exists', () => {
  const myArray = [];
  myArray.push('Sarah');
  myArray.push('John');

  it('Test adding new value is only added if not already present', () => {
    utils.addValueToArrayIfNotExists(myArray, 'Kyle');
    utils.addValueToArrayIfNotExists(myArray, 'Sarah');
    assert.equal(myArray.length, 3);
    assert.equal(myArray[0], 'Sarah');
    assert.equal(myArray[1], 'John');
    assert.equal(myArray[2], 'Kyle');
  });
});

describe('test add array to array if value not exists', () => {
  const sourceArray = [];
  sourceArray.push('Kyle');
  sourceArray.push('Sarah');

  const targetArray = [];
  targetArray.push('Sarah');
  targetArray.push('John');

  it('Test adding new value is only added if not already present', () => {
    utils.addValuesOfArrayToOtherArrayIfNotExist(sourceArray, targetArray);
    assert.equal(targetArray.length, 3);
    assert.equal(targetArray[0], 'Sarah');
    assert.equal(targetArray[1], 'John');
    assert.equal(targetArray[2], 'Kyle');
  });
});

describe('test add array to array if targetArray is empty', () => {
  const sourceArray = [];
  sourceArray.push('Kyle');
  sourceArray.push('Sarah');

  const targetArray = [];

  it('Test adding new value is only added if not already present', () => {
    utils.addValuesOfArrayToOtherArrayIfNotExist(sourceArray, targetArray);
    assert.equal(targetArray.length, 2);
    assert.equal(targetArray[0], 'Kyle');
    assert.equal(targetArray[1], 'Sarah');
  });
});
