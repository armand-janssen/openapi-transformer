const fs = require('fs');
const path = require('path');
const { assert } = require('chai');
const { runCli, startServer } = require('./helpers');

// Pins how referenced files are loaded, through the CLI as a child process so a loader crash cannot reach the mocha process.
const DIR = path.join(__dirname, 'resources', 'loading');

const classes = (result) => (result.files['out.plantuml'] || '').match(/^class \w+/gm)
  ?.map((line) => line.slice('class '.length));
const load = (input) => runCli([input, '-p', 'out.plantuml']);

// root spec, classes in first-seen order when everything is loaded, and the story a URL-input fix belongs to
const topologies = [
  ['same directory', 'same-dir/root.yaml', ['Root', 'Sibling'], 12],
  ['relative directory', 'relative-dir/root.yaml', ['Root', 'Child', 'Common'], 13],
  ['transitive', 'transitive/root.yaml', ['Root', 'A', 'B'], 12],
  ['two-file cycle', 'cycle2/a.yaml', ['A', 'B'], 12],
  ['shared reference', 'order/root.yaml', ['Root', 'A', 'D', 'B'], 12],
];

describe('loading referenced files', function loadingTests() {
  this.timeout(30000);
  let server;
  before(async () => { server = await startServer(DIR); });
  after(() => server.close());

  describe('file input', () => {
    topologies.forEach(([name, root, expected]) => {
      it(`${name}: loads the root and every referenced file`, async () => {
        const result = await load(path.join(DIR, root));

        assert.equal(result.code, 0, result.stderr);
        assert.deepEqual(classes(result), expected);
      });
    });
  });

  describe('URL input', () => {
    topologies.forEach(([name, root, expected, story]) => {
      it(`(story ${story}) ${name}: loads the root and every referenced file`, async () => {
        const result = await load(`${server.url}/${root}`);

        assert.equal(result.code, 0, result.stderr);
        assert.deepEqual(classes(result), expected);
      });
    });

    [404, 500].forEach((status) => {
      it(`(story 15) a ${status} response stops the run with the URL and status`, async () => {
        server.respond(`/status${status}.yaml`, status);
        const url = `${server.url}/status${status}.yaml`;
        const result = await load(url);

        assert.notEqual(result.code, 0);
        assert.include(result.stderr, url);
        assert.include(result.stderr, String(status));
        assert.notInclude(result.stderr, 'TypeError');
        assert.deepEqual(result.files, {});
      });
    });

    it('schema order is first-seen even when the first-referenced file responds last', async () => {
      server.delay('/order/a.yaml', 300);
      const result = await load(`${server.url}/order/root.yaml`);

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['Root', 'A', 'D', 'B']);
    });

    it('(story 16) a redirect is followed', async () => {
      server.respond('/redirected.yaml', 301, '/same-dir/sibling.yaml');
      const result = await load(`${server.url}/redirected.yaml`);

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['Sibling']);
    });

    it('(story 16) references in a redirected spec resolve relative to the final URL', async () => {
      server.respond('/moved-root.yaml', 302, '/same-dir/root.yaml');
      const result = await load(`${server.url}/moved-root.yaml`);

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['Root', 'Sibling']);
    });

    it('(story 16) a redirect loop stops the run with an error naming the URL', async () => {
      server.respond('/loop.yaml', 302, '/loop.yaml');
      const url = `${server.url}/loop.yaml`;
      const result = await load(url);

      assert.notEqual(result.code, 0);
      assert.include(result.stderr, url);
      assert.include(result.stderr, 'redirect');
      assert.deepEqual(result.files, {});
    });

    it('a connection failure stops the run with the URL', async () => {
      const closed = await startServer(DIR);
      await closed.close();
      const result = await load(`${closed.url}/root.yaml`);

      assert.notEqual(result.code, 0);
      assert.include(result.stderr, 'ECONNREFUSED');
      assert.deepEqual(result.files, {});
    });
  });

  describe('other loader behaviour', () => {
    it('(story 14) a three-file cycle terminates and loads each file once', async () => {
      const result = await load(path.join(DIR, 'cycle3/a.yaml'));

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['A', 'B', 'C']);
    });

    it('(story 20) a property reference to a .yml file is followed', async () => {
      const result = await load(path.join(DIR, 'yml/root.yaml'));

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['Root', 'Other']);
    });

    it('(story 21) a local schema whose name contains "yaml" is not read as a file', async () => {
      const result = await load(path.join(DIR, 'yaml-name/root.yaml'));

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['Root', 'yamlThing']);
    });
  });

  describe('known failures: correct behaviour', () => {
    it('(story 23) an allOf parent in another file is loaded', async () => {
      const result = await load(path.join(DIR, 'allof-parent/root.yaml'));

      assert.equal(result.code, 0, result.stderr);
      assert.deepEqual(classes(result), ['Child', 'Parent']);
    });
  });

  it('no test file references a host outside this machine (suite runs offline)', () => {
    const external = new RegExp(`https?${':'}//(?!127\\.0\\.0\\.1)`);
    fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && f !== path.basename(__filename)).forEach((file) => {
      assert.notMatch(fs.readFileSync(path.join(__dirname, file), 'utf8'), external, file);
    });
  });
});
