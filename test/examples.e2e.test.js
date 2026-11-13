const path = require('path');
const { assert } = require('chai');
const { ROOT, runCli, assertMatchesExpected } = require('./helpers');

// Pins what the CLI generates today for the example specs (not the stale committed example outputs).
const examples = [
  'example/vehicle.yaml',
];

describe('CLI on the example specs', () => {
  // Its only reference is under `paths`, so there are no schemas to render (story 19).
  it('example/example-openapi.yaml: no schemas is an error and writes nothing', async () => {
    const result = await runCli([path.join(ROOT, 'example/example-openapi.yaml'), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);

    assert.equal(result.code, 1);
    assert.include(result.stderr, 'No schemas found');
    assert.deepEqual(result.files, {});
  });

  examples.forEach((spec) => {
    const name = path.basename(spec, '.yaml');

    it(`${spec}: PlantUML, Markdown and JSON Schema`, async () => {
      const result = await runCli([path.join(ROOT, spec), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);

      assert.equal(result.code, 0, result.stderr);
      assert.equal(result.stderr, '');
      assertMatchesExpected(result.files['out.plantuml'], `examples/${name}.plantuml`);
      assertMatchesExpected(result.files['out.md'], `examples/${name}.md`);
      assertMatchesExpected(result.files['out.json'], `examples/${name}.json`);
    });

    it(`${spec}: PlantUML with --details`, async () => {
      const result = await runCli([path.join(ROOT, spec), '--details', '-p', 'out.plantuml']);

      assert.equal(result.code, 0, result.stderr);
      assertMatchesExpected(result.files['out.plantuml'], `examples/${name}-details.plantuml`);
    });
  });

  // Current behaviour: the empty `required:` in the all-in-one specs crashes the loader with a TypeError on null.
  ['all-in-one.yaml', 'all-in-one-openapi.yaml'].forEach((file) => {
    it(`example/all-in-one/${file}: crashes and writes nothing`, async () => {
      const result = await runCli([path.join(ROOT, 'example/all-in-one', file), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);

      assert.equal(result.code, 1);
      assert.include(result.stderr, "Cannot read properties of null (reading 'includes')");
      assert.deepEqual(result.files, {});
    });
  });
});
