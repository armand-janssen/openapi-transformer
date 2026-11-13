const path = require('path');
const { assert } = require('chai');
const { runCli, assertMatchesExpected } = require('./helpers');
// Library-API tests go through the package entry point (story 31).
const library = require('..');

const FIXTURES = path.join(__dirname, 'fixtures', 'behaviours');
const fixturePath = (file) => path.join(FIXTURES, file);

// Expected files pin what the tool outputs today, bugs included; the skipped tests further down state the correct behaviour.
const fixtures = [
  'property-types.yaml',
  'relationships.yaml',
  'allof-variants.yaml',
  'enums.yaml',
  'swagger2.yaml',
  'json-input.json',
];

describe('Transformer output per behaviour', () => {
  fixtures.forEach((file) => {
    const name = path.basename(file, path.extname(file));

    it(`${file}: CLI output`, async () => {
      const result = await runCli([fixturePath(file), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);
      assert.equal(result.code, 0, result.stderr);
      assert.equal(result.stderr, '');
      assertMatchesExpected(result.files['out.plantuml'], `behaviours/${name}.plantuml`);
      assertMatchesExpected(result.files['out.md'], `behaviours/${name}.md`);
      assertMatchesExpected(result.files['out.json'], `behaviours/${name}.json`);
    });

    it(`${file}: CLI output with --details`, async () => {
      const result = await runCli([fixturePath(file), '--details', '-p', 'out.plantuml']);
      assert.equal(result.code, 0, result.stderr);
      assertMatchesExpected(result.files['out.plantuml'], `behaviours/${name}-details.plantuml`);
    });

    it(`${file}: library output`, async () => {
      const schemas = await library.loadYamlFile(fixturePath(file));
      assertMatchesExpected(library.generatePlantUml(schemas, false), `behaviours/${name}.plantuml`);
      assertMatchesExpected(library.generatePlantUml(schemas, true), `behaviours/${name}-details.plantuml`);
      assertMatchesExpected(library.generateMarkdown(schemas), `behaviours/${name}.md`);
      assertMatchesExpected(library.generateJsonSchema(schemas), `behaviours/${name}.json`);
    });
  });
});

// Known failures: each states the correct behaviour (user stories in the spec) and is pending until phase 2 fixes it.
describe('Known failures', () => {
  const load = (file) => library.loadYamlFile(fixturePath(file));

  it('story 7: an empty required key does not crash the tool', async () => {
    const schemas = await load('empty-required.yaml');
    assert.property(schemas, 'Thing');
  });

  it('story 26: JSON Schema emits an array of primitives with an items type', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('property-types.yaml')));
    assert.deepInclude(json.properties.tags, { type: 'array' });
    assert.deepEqual(json.properties.tags.items, { type: 'string' });
  });

  it('story 26: JSON Schema emits an array of anyOf references as items with an anyOf list', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('property-types.yaml')));
    assert.deepEqual(json.properties.mixed.items, { anyOf: [{ $ref: '#/definitions/Other' }, { $ref: '#/definitions/Third' }] });
  });

  it('story 27: JSON Schema emits a binary string as type string with format binary', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('property-types.yaml')));
    assert.deepInclude(json.properties.photo, { type: 'string', format: 'binary' });
  });

  it('story 27: JSON Schema emits a byte string as type string with format byte', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('property-types.yaml')));
    assert.deepInclude(json.properties.secret, { type: 'string', format: 'byte' });
  });

  it('story 28: JSON Schema keeps the root description and gives each definition its own', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('relationships.yaml')));
    assert.equal(json.description, 'The root description.');
    assert.include(json.definitions.Toy.description, 'A toy with a | pipe');
  });

  it('story 29: PlantUML enum details list only the enum values', async () => {
    const uml = library.generatePlantUml(await load('enums.yaml'), true);
    assert.include(uml, 'withLength  : enum[x, y]');
    assert.include(uml, 'withPattern  : enum[m, n]');
    assert.include(uml, 'withLength  : enum[x, y][minLength : 1, maxLength : 3]');
    assert.include(uml, 'withPattern  : enum[m, n][pattern : ^[a-z]$]');
  });

  it('story 29: Markdown enum details list only the enum values', async () => {
    const md = library.generateMarkdown(await load('enums.yaml'));
    assert.include(md, '<ul><li>x</li><li>y</li></ul>');
    assert.include(md, '<ul><li>m</li><li>n</li></ul>');
    assert.include(md, '<ul><li>minLength : 1</li><li>maxLength : 3</li></ul>');
    assert.include(md, '<ul><li>pattern : ^[a-z]$</li></ul>');
  });

  it('story 29: JSON Schema enum lists contain only the enum values', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('enums.yaml')));
    assert.deepEqual(json.properties.withLength.enum, ['x', 'y']);
    assert.deepEqual(json.properties.withPattern.enum, ['m', 'n']);
    assert.deepInclude(json.properties.withLength, { minLength: 1, maxLength: 3 });
    assert.equal(json.properties.withPattern.pattern, '^[a-z]$');
  });

  it('story 22: a schema with several inline allOf objects shows all their properties', async () => {
    const schemas = await load('allof-variants.yaml');
    const names = schemas.SeveralInline.properties.map((p) => p.name);
    assert.deepEqual(names, ['first', 'second']);
  });

  it('story 22: the required lists of all inline allOf objects are kept in all three outputs', async () => {
    const schemas = await load('allof-variants.yaml');
    const uml = library.generatePlantUml(schemas, false);
    assert.include(uml, 'first * : string');
    assert.include(uml, 'second * : integer');
    assert.include(library.generateMarkdown(schemas), '| first | Y | string |');
    assert.deepEqual(JSON.parse(library.generateJsonSchema(schemas)).definitions.SeveralInline.required, ['first', 'second']);
  });

  it('story 22: with several referenced allOf members the first is the parent and the others get inheritance arrows too', async () => {
    const uml = library.generatePlantUml(await load('allof-variants.yaml'), false);
    assert.include(uml, 'Parent <|-- SeveralParents');
    assert.include(uml, 'OneInline <|-- SeveralParents');
    assert.include(uml, 'SeveralParents -- Parent  :  owner');
  });

  it('story 23: an allOf parent that lives in another file is loaded', async () => {
    const schemas = await load('allof-variants.yaml');
    assert.property(schemas, 'Base');
    assert.include(library.generatePlantUml(schemas, false), 'class Base {');
  });

  it('story 24: a top-level enum schema is rendered in all three outputs', async () => {
    const schemas = await load('enums.yaml');
    assert.include(library.generatePlantUml(schemas, false), 'enum Color {\n  red\n  green\n\n}');
    assert.include(library.generateMarkdown(schemas), '# Color\n&nbsp;\n\n## Values\n- red\n- green\n');
    assert.deepEqual(JSON.parse(library.generateJsonSchema(schemas)).definitions.Color, { type: 'string', enum: ['red', 'green'] });
  });

  it('story 24: a property referencing a top-level enum links to it in each output', async () => {
    const schemas = await load('enum-ref.yaml');
    const uml = library.generatePlantUml(schemas, false);
    assert.include(uml, 'color  : Color');
    assert.include(uml, 'Car -- Color  :  color');
    assert.include(library.generateMarkdown(schemas), '| color | &nbsp; | Color |');
    const json = JSON.parse(library.generateJsonSchema(schemas));
    assert.deepEqual(json.properties.color, { $ref: '#/definitions/Color' });
    assert.deepEqual(json.definitions.Color, { description: 'Paint colour', type: 'string', enum: ['red', 'green'] });
  });

  it('story 24: a top-level enum that is the first schema becomes the JSON Schema root', async () => {
    const json = JSON.parse(library.generateJsonSchema(await load('enum-first.yaml')));
    assert.deepInclude(json, { title: 'Color', type: 'string', enum: ['red'] });
    assert.deepEqual(json.definitions, {});
  });
});

describe('Array items', () => {
  it('an array without items, or with oneOf or allOf items, gives a JSON Schema array without crashing', async () => {
    const result = await runCli([fixturePath('array-items.yaml'), '-j', 'out.json']);
    assert.equal(result.code, 0, result.stderr);
    const { properties } = JSON.parse(result.files['out.json']);
    assert.deepEqual(properties.noItems, { type: 'array' });
    assert.deepEqual(properties.oneOfItems, { type: 'array', items: { oneOf: [{ $ref: '#/definitions/Other' }, { $ref: '#/definitions/Third' }] } });
    assert.deepEqual(properties.allOfItems, { type: 'array', items: { $ref: '#/definitions/Other' } });
  });

  it('a reference to the root schema points at the JSON Schema root', async () => {
    const result = await runCli([fixturePath('array-items.yaml'), '-j', 'out.json']);
    const { properties } = JSON.parse(result.files['out.json']);
    assert.deepEqual(properties.parent, { $ref: '#' });
    assert.deepEqual(properties.children.items, { $ref: '#' });
  });

  it('oneOf and allOf item references are drawn like anyOf ones', async () => {
    const result = await runCli([fixturePath('array-items.yaml'), '-p', 'out.plantuml']);
    assert.include(result.files['out.plantuml'], 'oneOfItems  : array[] of Other/Third');
    assert.include(result.files['out.plantuml'], 'Lists *-- Third  :  oneOfItems');
    assert.include(result.files['out.plantuml'], 'allOfItems  : array[] of Other');
  });
});

describe('allOf members that define the same property', () => {
  it('the later member overrides the earlier one in its first position, in all three outputs', async () => {
    const result = await runCli([fixturePath('allof-override.yaml'), '-j', 'out.json', '-m', 'out.md', '-p', 'out.plantuml']);
    assert.equal(result.code, 0, result.stderr);
    const uml = result.files['out.plantuml'];
    assert.include(uml, 'class Child {\n  dup * : integer\n  a  : string\n  b  : string\n\n}\n');
    assert.notInclude(uml, 'Child -- Other');
    assert.include(result.files['out.md'], '| dup | Y | integer |');
    assert.notInclude(result.files['out.md'], '| dup | &nbsp;');
    const json = JSON.parse(result.files['out.json']);
    assert.deepEqual(Object.keys(json.properties), ['dup', 'a', 'b']);
    assert.deepEqual(json.properties.dup, { type: 'integer' });
    assert.deepEqual(json.required, ['dup']);
  });
});

describe('Enums that are not strings', () => {
  it('a top-level enum keeps its declared type in JSON Schema, and an untyped one gets no type', async () => {
    const result = await runCli([fixturePath('enum-types.yaml'), '-j', 'out.json']);
    const json = JSON.parse(result.files['out.json']);
    assert.deepInclude(json, { type: 'integer', enum: [1, 2] });
    assert.deepEqual(json.definitions.Ratio, { type: 'number', enum: [0.5] });
    assert.deepEqual(json.definitions.Untyped, { enum: ['a', 1] });
  });

  it('a property enum of numbers or booleans keeps its type and values in every output', async () => {
    const result = await runCli([fixturePath('enum-types.yaml'), '-j', 'out.json', '-m', 'out.md', '-p', 'out.plantuml', '-d']);
    const { properties } = JSON.parse(result.files['out.json']).definitions.Thing;
    assert.deepEqual(properties.nums, { type: 'integer', enum: [1, 2, 3], minimum: 1 });
    assert.deepEqual(properties.flag, { type: 'boolean', enum: [true] });
    assert.include(result.files['out.md'], '| nums | &nbsp; | integer | &nbsp; | <ul><li>1</li><li>2</li><li>3</li></ul><ul><li>minimum : 1</li></ul> |');
    assert.include(result.files['out.plantuml'], 'nums  : integer[1, 2, 3][minimum : 1]');
    assert.include(result.files['out.plantuml'], 'flag  : boolean[true]');
  });
});
