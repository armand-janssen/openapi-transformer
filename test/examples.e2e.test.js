const path = require('path');
const { assert } = require('chai');
const { ROOT, runCli, assertMatchesExpected } = require('./helpers');

// Pins what the CLI generates today for the example specs (not the stale committed example outputs).
const examples = [
  'example/vehicle.yaml',
  'example/example-openapi.yaml',
  'example/all-in-one/all-in-one.yaml',
  'example/all-in-one/all-in-one-openapi.yaml',
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
});
