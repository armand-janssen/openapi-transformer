const path = require('path');
const { assert } = require('chai');
const { runCli, assertMatchesExpected } = require('./helpers');
const plantUml = require('../src/plantUmlTransformer');
const markdown = require('../src/markdownTransformer');
const jsonSchema = require('../src/jsonSchemaTransformer');

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
      assertMatchesExpected(plantUml.generate(schemas, false), `behaviours/${name}.plantuml`);
      assertMatchesExpected(plantUml.generate(schemas, true), `behaviours/${name}-details.plantuml`);
      assertMatchesExpected(markdown.generate(schemas), `behaviours/${name}.md`);
      assertMatchesExpected(jsonSchema.generate(schemas), `behaviours/${name}.json`);
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
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepInclude(json.properties.tags, { type: 'array' });
    assert.deepEqual(json.properties.tags.items, { type: 'string' });
  });

  it('story 26: JSON Schema emits an array of anyOf references as items with an anyOf list', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepEqual(json.properties.mixed.items, { anyOf: [{ $ref: '#/definitions/Other' }, { $ref: '#/definitions/Third' }] });
  });

  it('story 27: JSON Schema emits a binary string as type string with format binary', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepInclude(json.properties.photo, { type: 'string', format: 'binary' });
  });

  it('story 27: JSON Schema emits a byte string as type string with format byte', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepInclude(json.properties.secret, { type: 'string', format: 'byte' });
  });

  it('story 28: JSON Schema keeps the root description and gives each definition its own', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('relationships.yaml')));
    assert.equal(json.description, 'The root description.');
    assert.include(json.definitions.Toy.description, 'A toy with a | pipe');
  });

  it('story 29: PlantUML enum details list only the enum values', async () => {
    const uml = plantUml.generate(await load('enums.yaml'), true);
    assert.include(uml, 'withLength  : enum[x, y]');
    assert.include(uml, 'withPattern  : enum[m, n]');
    assert.include(uml, 'withLength  : enum[x, y][minLength : 1, maxLength : 3]');
    assert.include(uml, 'withPattern  : enum[m, n][pattern : ^[a-z]$]');
  });

  it('story 29: Markdown enum details list only the enum values', async () => {
    const md = markdown.generate(await load('enums.yaml'));
    assert.include(md, '<ul><li>x</li><li>y</li></ul>');
    assert.include(md, '<ul><li>m</li><li>n</li></ul>');
    assert.include(md, '<ul><li>minLength : 1</li><li>maxLength : 3</li></ul>');
    assert.include(md, '<ul><li>pattern : ^[a-z]$</li></ul>');
  });

  it('story 29: JSON Schema enum lists contain only the enum values', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('enums.yaml')));
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
    const uml = plantUml.generate(schemas, false);
    assert.include(uml, 'first * : string');
    assert.include(uml, 'second * : integer');
    assert.include(markdown.generate(schemas), '| first | Y | string |');
    assert.deepEqual(JSON.parse(jsonSchema.generate(schemas)).definitions.SeveralInline.required, ['first', 'second']);
  });

  it('story 22: with several referenced allOf members the first is the parent and the others get inheritance arrows too', async () => {
    const uml = plantUml.generate(await load('allof-variants.yaml'), false);
    assert.include(uml, 'Parent <|-- SeveralParents');
    assert.include(uml, 'OneInline <|-- SeveralParents');
    assert.include(uml, 'SeveralParents -- Parent  :  owner');
  });

  it('story 23: an allOf parent that lives in another file is loaded', async () => {
    const schemas = await load('allof-variants.yaml');
    assert.property(schemas, 'Base');
    assert.include(plantUml.generate(schemas, false), 'class Base {');
  });

  it('story 24: a top-level enum schema is rendered in all three outputs', async () => {
    const schemas = await load('enums.yaml');
    assert.include(plantUml.generate(schemas, false), 'enum Color {\n  red\n  green\n\n}');
    assert.include(markdown.generate(schemas), '# Color\n&nbsp;\n\n## Values\n- red\n- green\n');
    assert.deepEqual(JSON.parse(jsonSchema.generate(schemas)).definitions.Color, { type: 'string', enum: ['red', 'green'] });
  });

  it('story 24: a property referencing a top-level enum links to it in each output', async () => {
    const schemas = await load('enum-ref.yaml');
    const uml = plantUml.generate(schemas, false);
    assert.include(uml, 'color  : Color');
    assert.include(uml, 'Car -- Color  :  color');
    assert.include(markdown.generate(schemas), '| color | &nbsp; | Color |');
    const json = JSON.parse(jsonSchema.generate(schemas));
    assert.deepEqual(json.properties.color, { $ref: '#/definitions/Color' });
    assert.deepEqual(json.definitions.Color, { description: 'Paint colour', type: 'string', enum: ['red', 'green'] });
  });

  it('story 24: a top-level enum that is the first schema becomes the JSON Schema root', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('enum-first.yaml')));
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

  it('oneOf and allOf item references are drawn like anyOf ones', async () => {
    const result = await runCli([fixturePath('array-items.yaml'), '-p', 'out.plantuml']);
    assert.include(result.files['out.plantuml'], 'oneOfItems  : array[] of Other/Third');
    assert.include(result.files['out.plantuml'], 'Lists *-- Third  :  oneOfItems');
    assert.include(result.files['out.plantuml'], 'allOfItems  : array[] of Other');
  });
});
