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

  // Current behaviour: an empty `required:` key parses as null and crashes the loader.
  it('empty-required.yaml: crashes and writes nothing', async () => {
    const result = await runCli([fixturePath('empty-required.yaml'), '-p', 'out.plantuml']);
    assert.equal(result.code, 1);
    assert.include(result.stderr, "TypeError: Cannot read properties of null (reading 'includes')");
    assert.deepEqual(result.files, {});
  });
});

// Known failures: each states the correct behaviour (user stories in the spec) and is pending until phase 2 fixes it.
describe('Known failures', () => {
  const load = (file) => library.loadYamlFile(fixturePath(file));

  it.skip('story 7: an empty required key does not crash the tool', async () => {
    const schemas = await load('empty-required.yaml');
    assert.property(schemas, 'Thing');
  });

  it.skip('story 26: JSON Schema emits an array of primitives with an items type', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepInclude(json.properties.tags, { type: 'array' });
    assert.deepEqual(json.properties.tags.items, { type: 'string' });
  });

  it.skip('story 27: JSON Schema emits a binary string as type string with format binary', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepInclude(json.properties.photo, { type: 'string', format: 'binary' });
  });

  it.skip('story 27: JSON Schema emits a byte string as type string with format byte', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('property-types.yaml')));
    assert.deepInclude(json.properties.secret, { type: 'string', format: 'byte' });
  });

  it.skip('story 28: JSON Schema keeps the root description and gives each definition its own', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('relationships.yaml')));
    assert.equal(json.description, 'The root description.');
    assert.include(json.definitions.Toy.description, 'A toy with a | pipe');
  });

  it.skip('story 29: PlantUML enum details list only the enum values', async () => {
    const uml = plantUml.generate(await load('enums.yaml'), true);
    assert.include(uml, 'withLength : enum[x, y]');
    assert.include(uml, 'withPattern : enum[m, n]');
  });

  it.skip('story 29: Markdown enum details list only the enum values', async () => {
    const md = markdown.generate(await load('enums.yaml'));
    assert.include(md, '<ul><li>x</li><li>y</li></ul>');
    assert.include(md, '<ul><li>m</li><li>n</li></ul>');
  });

  it.skip('story 29: JSON Schema enum lists contain only the enum values', async () => {
    const json = JSON.parse(jsonSchema.generate(await load('enums.yaml')));
    assert.deepEqual(json.properties.withLength.enum, ['x', 'y']);
    assert.deepEqual(json.properties.withPattern.enum, ['m', 'n']);
  });

  it.skip('story 22: a schema with several inline allOf objects shows all their properties', async () => {
    const schemas = await load('allof-variants.yaml');
    const names = schemas.SeveralInline.properties.map((p) => p.name);
    assert.deepEqual(names, ['first', 'second']);
  });

  it.skip('story 23: an allOf parent that lives in another file is loaded', async () => {
    assert.property(await load('allof-variants.yaml'), 'Base');
  });

  it.skip('story 24: a top-level enum schema is rendered', async () => {
    const schemas = await load('enums.yaml');
    assert.property(schemas, 'Color');
    assert.include(markdown.generate(schemas), '# Color');
    assert.deepEqual(JSON.parse(jsonSchema.generate(schemas)).definitions.Color.enum, ['red', 'green']);
  });
});
