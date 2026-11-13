const path = require('path');
const { assert } = require('chai');
const { ROOT, runCli, assertMatchesExpected } = require('./helpers');

// Pins what the CLI generates today for the example specs (not the stale committed example outputs).
const examples = [
  'example/vehicle.yaml',
  'example/example-openapi.yaml',
];

describe('CLI on the example specs', () => {
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

  // Current behaviour: the empty `required:` in all-in-one.yaml crashes the loader with a TypeError on null.
  it('example/all-in-one/all-in-one.yaml: crashes and writes nothing', async () => {
    const result = await runCli([path.join(ROOT, 'example/all-in-one/all-in-one.yaml'), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);

    assert.equal(result.code, 1);
    assert.include(result.stderr, "TypeError: Cannot read properties of null (reading 'includes')");
    assert.deepEqual(result.files, {});
  });

  // Current behaviour: the referenced file is loaded without being awaited, so empty outputs are written before the same crash.
  it('example/all-in-one/all-in-one-openapi.yaml: writes empty outputs, then crashes', async () => {
    const result = await runCli([path.join(ROOT, 'example/all-in-one/all-in-one-openapi.yaml'), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);

    assert.equal(result.code, 1);
    assert.include(result.stderr, "TypeError: Cannot read properties of null (reading 'includes')");
    assertMatchesExpected(result.files['out.plantuml'], 'examples/all-in-one-openapi.plantuml');
    assertMatchesExpected(result.files['out.md'], 'examples/all-in-one-openapi.md');
    assertMatchesExpected(result.files['out.json'], 'examples/all-in-one-openapi.json');
  });
});
