const path = require('node:path');
const { assert } = require('chai');
const { ROOT, runCli, assertMatchesExpected } = require('./helpers');
const { loadYamlFile, generateCsv, selectSchemas } = require('..');

const VEHICLE = path.join(ROOT, 'example', 'vehicle.yaml');
const CSV_FIXTURE = path.join(__dirname, 'fixtures', 'cli', 'csv.yaml');

describe('CSV output (--csv)', () => {
  it('quotes commas, quotes and line breaks, and follows the column rules', async () => {
    const result = await runCli([CSV_FIXTURE, '-c', 'out.csv']);

    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(Object.keys(result.files), ['out.csv']);
    assertMatchesExpected(result.files['out.csv'], 'cli/csv.csv');
  });

  it('--verbose logs the CSV step', async () => {
    const result = await runCli([CSV_FIXTURE, '-c', 'out.csv', '-v']);

    assert.include(result.stdout, 'Writing CSV...');
  });

  it('library: generateCsv gives the same text as the CLI, and only the header without schemas', async () => {
    assertMatchesExpected(generateCsv(await loadYamlFile(CSV_FIXTURE)), 'cli/csv.csv');
    assert.equal(generateCsv({}), 'schema,property,required,type,description,details,enum,example\n');
    assert.equal(generateCsv(), 'schema,property,required,type,description,details,enum,example\n');
  });
});

describe('Root selection (--root)', () => {
  it('limits every output to the root and what it needs, with the root first', async () => {
    const result = await runCli([VEHICLE, '-r', 'landVehicle', '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json', '-c', 'out.csv']);

    assert.equal(result.code, 0, result.stderr);
    ['plantuml', 'md', 'json', 'csv'].forEach((type) => assertMatchesExpected(result.files[`out.${type}`], `cli/root-landVehicle.${type}`));
    assert.equal(JSON.parse(result.files['out.json']).title, 'landVehicle');
  });

  it('an unknown root is a one-line error listing the schemas, and writes nothing', async () => {
    const result = await runCli([VEHICLE, '-r', 'LandVehicle', '-c', 'out.csv']);

    assert.equal(result.code, 1);
    assert.equal(result.stderr, 'Error: Root schema LandVehicle not found; available: vehicle, landVehicle, waterVehicle, airVehicle, owner, registration\n');
    assert.deepEqual(result.files, {});
  });

  it('--root alone is not an output type: the help text is printed', async () => {
    const result = await runCli([VEHICLE, '-r', 'landVehicle']);

    assert.include(result.stdout, 'Usage: openapi-transformer [options] <inputFileOrUrl>');
    assert.deepEqual(result.files, {});
  });

  it('library: follows parents and references, keeps the original order after the root, leaves the rest out', async () => {
    const schemas = await loadYamlFile(VEHICLE);

    assert.deepEqual(Object.keys(selectSchemas(schemas, 'landVehicle')), ['landVehicle', 'vehicle', 'owner', 'registration']);
    assert.deepEqual(Object.keys(selectSchemas(schemas, 'registration')), ['registration']);
    assert.deepEqual(Object.keys(selectSchemas(schemas, 'vehicle')), ['vehicle', 'owner', 'registration']);
  });

  it('library: a schema that refers to itself or to a schema that is not rendered does not loop or fail', async () => {
    const schemas = await loadYamlFile(CSV_FIXTURE);

    assert.deepEqual(Object.keys(selectSchemas(schemas, 'Paint')), ['Paint', 'Colour']);
    assert.throws(() => selectSchemas(schemas, 'toString'), 'Root schema toString not found');
  });
});
