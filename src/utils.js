
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
  for (const sourceArrayIndex of Object.keys(sourceArray)) {
    const value = sourceArray[sourceArrayIndex];
    addValueToArrayIfNotExists(targetArray, value);
  }
}

// Adds the file part of a $ref ('other.yaml' in 'other.yaml#/components/schemas/X') to referencedFiles, once.
function addReferencedFile(reference, referencedFiles) {
  const referencedFile = reference.match('^[^#]*\\.ya?ml');
  if (referencedFile != null) addValueToArrayIfNotExists(referencedFiles, referencedFile[0]);
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
      targetObject[attributeName] = sourceObject[attributeName];
    }
  });
}

module.exports = {
  lastToken,
  addValueToArrayIfNotExists,
  addValuesOfArrayToOtherArrayIfNotExist,
  addReferencedFile,
  mergeObjects,
};
