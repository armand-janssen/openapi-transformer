const { assert } = require('chai');
const openApiGenerator = require('../src/index');

describe('openApiGenerator - loadYamlFile - HTTPS - Petstore - YAML', () => {
  it('Load six schema objects from HTTPS.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('https://raw.githubusercontent.com/openapitools/openapi-generator/master/modules/openapi-generator/src/test/resources/3_0/petstore.yaml', true);

    assert.isDefined(loadedSchemas);
    assert.equal(Object.keys(loadedSchemas).length, 6);
  });
});

describe('openApiGenerator - loadYamlFile - HTTPS - Petstore - JSON', () => {
  it('Load six schema objects from HTTPS.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('https://petstore.swagger.io/v2/swagger.json', false);

    assert.isDefined(loadedSchemas);
    assert.equal(Object.keys(loadedSchemas).length, 6);
  });
});

describe('openApiGenerator - loadYamlFile - HTTPS - NonSpec - JSON', () => {
  it('Load non-spec file.', async () => {
    const loadedSchemas = await openApiGenerator.loadYamlFile('https://raw.githubusercontent.com/openapitools/openapi-generator/master/modules/openapi-generator/src/test/resources/2_0/bash-config.json', true);

    assert.isDefined(loadedSchemas);
    assert.equal(Object.keys(loadedSchemas).length, 0);
  });
});

describe('openApiGenerator - loadYamlFile - HTTP - 404', () => {
  it('Load error from HTTP.', async () => {
    try {
      await openApiGenerator.loadYamlFile('http://www.doesnotexist/swagger.json', true);
      fail();
    } catch (error) {
      assert.isDefined(error);
      assert.equal(error.message, 'getaddrinfo ENOTFOUND www.doesnotexist');
    }
  });
});
