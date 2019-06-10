/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

/*
  Split the value based on the token and get the value behing the last token
*/
function lastToken(value, token) {
  const xs = value.split(token);
  return xs.length > 1 ? xs.pop() : null;
}

function addValueToArrayIfNotExists(array, value) {
  if (!array.includes(value)) {
    array.push(value);
  }
}
function addValuesOfArrayToOtherArrayIfNotExist(sourceArray, targetArray) {
  for (const sourceArrayIndex in sourceArray) {
    const value = sourceArray[sourceArrayIndex];
    this.addValueToArrayIfNotExists(targetArray, value);
  }
}

/**
 * Merge 2 objects, but only if not already defined in target.
 * @param {*} sourceObject
 * @param {*} targetObject
 */
function mergeObjects(sourceObject, targetObject) {
  if (sourceObject === undefined) return;
  if (targetObject === undefined) throw new Error('targetObject is undefined');

  Object.keys(sourceObject).forEach((attributeName) => {
    if (!Object.keys(targetObject).includes(attributeName)) {
      // eslint-disable-next-line no-param-reassign
      targetObject[attributeName] = sourceObject[attributeName];
    }
  });
}

module.exports = {
  lastToken,
  addValueToArrayIfNotExists,
  addValuesOfArrayToOtherArrayIfNotExist,
  mergeObjects,
};
