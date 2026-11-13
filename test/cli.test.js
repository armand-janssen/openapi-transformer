const path = require('path');
const { assert } = require('chai');
const {
  runCli, startServer, assertMatchesExpected, ROOT,
} = require('./helpers');
const { version } = require('../package.json');

const VEHICLE = path.join(ROOT, 'example', 'vehicle.yaml');
const fixture = (file) => path.join(__dirname, 'fixtures', 'cli', file);

describe('CLI arguments and failures', () => {
  describe('current behaviour', () => {
    it('no arguments prints the help text and exits 0', async () => {
      const result = await runCli([]);

      assert.equal(result.code, 0);
      assert.include(result.stdout, 'Usage: cli [options] <inputFileOrUrl>');
      assert.deepEqual(result.files, {});
    });

    it('an input but no output option prints the help text, writes nothing and exits 0', async () => {
      const result = await runCli([VEHICLE]);

      assert.equal(result.code, 0);
      assert.include(result.stdout, 'Usage: cli [options] <inputFileOrUrl>');
      assert.deepEqual(result.files, {});
    });

    ['-V', '--version'].forEach((flag) => {
      it(`${flag} prints the package version`, async () => {
        const result = await runCli([flag]);

        assert.equal(result.code, 0);
        assert.equal(result.stdout, `${version}\n`);
      });
    });

    it('--verbose logs each step on stdout and still writes the output', async () => {
      const result = await runCli([VEHICLE, '-p', 'out.plantuml', '-m', 'out.md', '-j', 'out.json', '-v']);

      assert.equal(result.code, 0, result.stderr);
      ['Reading openAPI...', 'Writing plantuml...', 'Writing markdown...', 'Writing JSON Schema...', 'Finished rendering documentation!']
        .forEach((line) => assert.include(result.stdout, line));
      assert.sameMembers(Object.keys(result.files), ['out.plantuml', 'out.md', 'out.json']);
    });

    it('without --verbose nothing is logged', async () => {
      const result = await runCli([VEHICLE, '-p', 'out.plantuml']);

      assert.equal(result.stdout, '');
    });

    it('an option without its file argument is rejected with exit 1', async () => {
      const result = await runCli([VEHICLE, '-p']);

      assert.equal(result.code, 1);
      assert.include(result.stderr, 'argument missing');
    });
  });

  describe('input and output variants, current behaviour', () => {
    let server;
    before(async () => { server = await startServer(path.join(__dirname, 'fixtures', 'cli')); });
    after(() => server.close());

    it('markdown only: writes just the markdown file', async () => {
      const result = await runCli([fixture('edge-cases.yaml'), '-m', 'out.md']);

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(Object.keys(result.files), ['out.md']);
      assertMatchesExpected(result.files['out.md'], 'cli/edge-cases.md');
    });

    it('a schema that is not an object is left out of the output', async () => {
      const result = await runCli([fixture('edge-cases.yaml'), '-p', 'out.plantuml', '-v']);

      assert.equal(result.code, 0, result.stderr);
      assert.include(result.stdout, 'unparseable schema definition');
      assert.notInclude(result.files['out.plantuml'], 'Name');
    });

    it('URL input with --verbose loads and renders the spec', async () => {
      const result = await runCli([`${server.url}/edge-cases.yaml`, '-m', 'out.md', '-v']);

      assert.equal(result.code, 0, result.stderr);
      assert.include(result.stdout, 'base http path');
      assertMatchesExpected(result.files['out.md'], 'cli/edge-cases.md');
    });

    it('several schemas referencing the same file load it once', async () => {
      const result = await runCli([fixture('file-refs.yaml'), '-m', 'out.md', '-v']);

      assert.equal(result.code, 0, result.stderr);
      assertMatchesExpected(result.files['out.md'], 'cli/file-refs.md');
    });
  });

  describe('known failures: correct behaviour', () => {
    const assertOneLineError = (result, ...mentions) => {
      assert.notEqual(result.code, 0);
      assert.notInclude(result.stderr, '    at ', 'no stack trace');
      assert.equal(result.stderr.trim().split('\n').length, 1, result.stderr);
      mentions.forEach((text) => assert.include(result.stderr, text));
    };

    it.skip('(story 17) a missing input file is a one-line error with a non-zero exit', async () => {
      const missing = path.join(__dirname, 'does-not-exist.yaml');
      const result = await runCli([missing, '-p', 'out.plantuml']);

      assertOneLineError(result, missing);
    });

    it.skip('(story 18) invalid YAML is a one-line error naming the file', async () => {
      const result = await runCli([fixture('invalid.yaml'), '-p', 'out.plantuml']);

      assertOneLineError(result, 'invalid.yaml');
    });

    it.skip('(story 19) a spec with no schemas warns on stderr and exits non-zero', async () => {
      const result = await runCli([fixture('no-schemas.yaml'), '-p', 'out.plantuml']);

      assertOneLineError(result, 'no-schemas.yaml');
    });

    it.skip('(story 25) a schema that cannot be rendered is reported as a warning on stderr', async () => {
      const result = await runCli([fixture('edge-cases.yaml'), '-p', 'out.plantuml']);

      assert.include(result.stderr, 'Name');
    });

    it.skip('(story 30) the help text mentions all three output types', async () => {
      const { stdout } = await runCli([]);

      assert.match(stdout, /At least 1 output type[^\n]*plantuml[^\n]*markdown[^\n]*json/i);
    });
  });
});
