const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const Property = require('../src/property');
const { assertMatchesExpected } = require('./helpers');

// Each resource's `owner` schema is parsed and compared with test/expected/properties/<name>.yaml:
// the parsed properties, the relationships and the referenced files.
describe('Property.parseProperties', () => {
  [
    'propertyNoRelationShipNoReferences',
    'propertyOneRelationShipNoReferences',
    'propertyTwoRelationShipOneReferences',
    'propertyThreeRelationShipTwoReferences',
    'propertyFiveRelationShipThreeReferencesUsingExtension.test',
  ].forEach((name) => {
    it(name, () => {
      const spec = YAML.parse(fs.readFileSync(path.join(__dirname, 'resources', `${name}.yaml`), 'utf8'));
      const { properties, required } = spec.components.schemas.owner;

      const [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(properties, required, 'owner', false);

      assertMatchesExpected(YAML.stringify({ properties: parsedProperties, relationShips, referencedFiles }), `properties/${name}.yaml`);
    });
  });
});
