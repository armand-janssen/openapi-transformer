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
  const sourceObject = [];
  sourceObject.push('Kyle');
  sourceObject.push('Sarah');

  const targetObject = [];
  targetObject.push('Sarah');
  targetObject.push('John');

  it('Test adding new value is only added if not already present', () => {
    utils.addValuesOfArrayToOtherArrayIfNotExist(sourceObject, targetObject);
    assert.equal(targetObject.length, 3);
    assert.equal(targetObject[0], 'Sarah');
    assert.equal(targetObject[1], 'John');
    assert.equal(targetObject[2], 'Kyle');
  });
});

describe('test add array to array if targetObject is empty', () => {
  const sourceObject = [];
  sourceObject.push('Kyle');
  sourceObject.push('Sarah');

  const targetObject = [];

  it('Test adding new value is only added if not already present', () => {
    utils.addValuesOfArrayToOtherArrayIfNotExist(sourceObject, targetObject);
    assert.equal(targetObject.length, 2);
    assert.equal(targetObject[0], 'Kyle');
    assert.equal(targetObject[1], 'Sarah');
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

describe('test merged objects', () => {
  it('source is undefined', () => {
    const sourceObject = undefined;
    const targetObject = {};
    targetObject.one = 1;
    targetObject.two = 2;

    utils.mergeObjects(sourceObject, targetObject);
    assert.isUndefined(sourceObject);
    assert.equal(sizeOfArray(targetObject), 2);
  });

  it('source is empty', () => {
    const sourceObject = {};
    const targetObject = {};
    targetObject.one = 1;
    targetObject.two = 2;

    utils.mergeObjects(sourceObject, targetObject);
    assert.equal(sizeOfArray(sourceObject), 0);
    assert.equal(sizeOfArray(targetObject), 2);
  });

  it('target is undefined', () => {
    const sourceObject = {};
    const targetObject = undefined;
    sourceObject.one = 1;
    sourceObject.two = 2;

    expect(() => utils.mergeObjects(sourceObject, targetObject)).to.throw(Error, 'targetObject is undefined');
  });

  it('target is empty', () => {
    const sourceObject = {};
    const targetObject = {};
    sourceObject.one = 1;
    sourceObject.two = 2;

    utils.mergeObjects(sourceObject, targetObject);
    assert.equal(sizeOfArray(sourceObject), 2);
    assert.equal(sizeOfArray(targetObject), 2);
  });
  it('no duplicates', () => {
    const sourceObject = {};
    const targetObject = {};
    sourceObject.one = 1;
    sourceObject.two = 2;
    targetObject.three = 3;
    targetObject.four = 4;

    utils.mergeObjects(sourceObject, targetObject);
    assert.equal(sizeOfArray(sourceObject), 2);
    assert.equal(sizeOfArray(targetObject), 4);

    assert.equal(targetObject.one, 1);
    assert.equal(targetObject.two, 2);
    assert.equal(targetObject.three, 3);
    assert.equal(targetObject.four, 4);
  });

  it('duplicates', () => {
    const sourceObject = {};
    const targetObject = {};
    sourceObject.one = 1;
    sourceObject.two = 2;
    targetObject.two = 3;
    targetObject.four = 4;

    utils.mergeObjects(sourceObject, targetObject);
    assert.equal(sizeOfArray(sourceObject), 2);
    assert.equal(sizeOfArray(targetObject), 3);

    assert.equal(targetObject.one, 1);
    assert.equal(targetObject.two, 3);
    assert.equal(targetObject.four, 4);
  });
});
