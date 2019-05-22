const { assert, expect } = require('chai');
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

describe('test merging named arrays', () => {
  it('source is undefined', () => {
    const sourceArray = undefined;
    const targetArray = [];
    targetArray.one = 1;
    targetArray.two = 2;

    utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray);
    assert.isUndefined(sourceArray);
    assert.equal(sizeOfArray(targetArray), 2);
  });
  it('source is empty', () => {
    const sourceArray = [];
    const targetArray = [];
    targetArray.one = 1;
    targetArray.two = 2;

    utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray);
    assert.equal(sizeOfArray(sourceArray), 0);
    assert.equal(sizeOfArray(targetArray), 2);
  });
  it('target is undefined', () => {
    const sourceArray = [];
    const targetArray = undefined;
    sourceArray.one = 1;
    sourceArray.two = 2;

    expect(() => utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray)).to.throw(Error, 'targetArray is undefined')

    // expect(utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray)).to.throw('targetArray is undefined');
  });
  it('target is empty', () => {
    const sourceArray = [];
    const targetArray = [];
    sourceArray.one = 1;
    sourceArray.two = 2;

    utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray);
    assert.equal(sizeOfArray(sourceArray), 2);
    assert.equal(sizeOfArray(targetArray), 2);
  });
  it('no duplicates', () => {
    const sourceArray = [];
    const targetArray = [];
    sourceArray.one = 1;
    sourceArray.two = 2;
    targetArray.three = 3;
    targetArray.four = 4;

    utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray);
    assert.equal(sizeOfArray(sourceArray), 2);
    assert.equal(sizeOfArray(targetArray), 4);

    assert.equal(targetArray.one, 1);
    assert.equal(targetArray.two, 2);
    assert.equal(targetArray.three, 3);
    assert.equal(targetArray.four, 4);
  });
  it('duplicates', () => {
    const sourceArray = [];
    const targetArray = [];
    sourceArray.one = 1;
    sourceArray.two = 2;
    targetArray.two = 3;
    targetArray.four = 4;

    utils.addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray);
    assert.equal(sizeOfArray(sourceArray), 2);
    assert.equal(sizeOfArray(targetArray), 3);

    assert.equal(targetArray.one, 1);
    assert.equal(targetArray.two, 3);
    assert.equal(targetArray.four, 4);
  });
});
