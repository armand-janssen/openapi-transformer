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
function addValuesOfNamedArrayToOtherNamedArrayIfNotExist(sourceArray, targetArray) {
  if (sourceArray === undefined) return;
  if (targetArray === undefined) throw new Error('targetArray is undefined');
  for (const sourceKey in sourceArray) {
    const sourceValue = sourceArray[sourceKey];

    if (targetArray[sourceKey] === undefined) {
      // eslint-disable-next-line no-param-reassign
      targetArray[sourceKey] = sourceValue;
    }
  }
}

module.exports = {
  lastToken,
  addValueToArrayIfNotExists,
  addValuesOfArrayToOtherArrayIfNotExist,
  addValuesOfNamedArrayToOtherNamedArrayIfNotExist,
};
