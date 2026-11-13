const path = require('path');
const { assert } = require('chai');
const { ROOT, runCli, assertMatchesExpected } = require('./helpers');

// The committed outputs next to each example spec (example/*.md, *.plantuml, *.json) must equal what the CLI generates today.
const examples = [
  'example/vehicle.yaml',
  'example/all-in-one/all-in-one.yaml',
  'example/all-in-one/all-in-one-openapi.yaml',
];

describe('CLI on the example specs', () => {
  examples.forEach((spec) => {
    const out = `../../${spec.replace('.yaml', '')}`; // expected files live beside the spec in example/

    it(`${spec}: PlantUML, Markdown and JSON Schema`, async () => {
      const result = await runCli([path.join(ROOT, spec), '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json']);

      assert.equal(result.code, 0, result.stderr);
      assert.equal(result.stderr, '');
      assertMatchesExpected(result.files['out.plantuml'], `${out}.plantuml`);
      assertMatchesExpected(result.files['out.md'], `${out}.md`);
      assertMatchesExpected(result.files['out.json'], `${out}.json`);
    });

    it(`${spec}: PlantUML with --details`, async () => {
      const result = await runCli([path.join(ROOT, spec), '--details', '-p', 'out.plantuml']);

      assert.equal(result.code, 0, result.stderr);
      assertMatchesExpected(result.files['out.plantuml'], `${out}-details.plantuml`);
    });
  });
});
