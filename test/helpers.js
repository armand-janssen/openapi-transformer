/*
 * Shared test helpers. Usage:
 *   const result = await runCli([path.join(ROOT, 'example/vehicle.yaml'), '-p', 'out.plantuml']);
 *     -> { code, stdout, stderr, files: { 'out.plantuml': '...' } }; runs in a fresh temp dir, so pass inputs as absolute paths or URLs.
 *   const server = await startServer(dir); server.url; server.respond('/a.yaml', 404 | 500 | 301, '/b.yaml'); server.close();
 *   assertMatchesExpected(actual, 'examples/vehicle.md'); // compares with test/expected/<name>
 *   Regenerate expected files on purpose: UPDATE_EXPECTED=1 npm test
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { assert } = require('chai');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'src', 'cli.js');
const EXPECTED = path.join(__dirname, 'expected');

function runCli(args) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-transformer-'));
  return new Promise((resolve) => {
    // nyc instruments the child; without this flag its babel deps write a browserslist warning to stderr on a cold cache
    const env = { ...process.env, BROWSERSLIST_IGNORE_OLD_DATA: '1' };
    execFile(process.execPath, [CLI, ...args], { cwd, env }, (error, stdout, stderr) => {
      const files = {};
      fs.readdirSync(cwd).forEach((name) => { files[name] = fs.readFileSync(path.join(cwd, name), 'utf8'); });
      fs.rmSync(cwd, { recursive: true, force: true });
      resolve({
        code: error ? error.code : 0, stdout, stderr, files,
      });
    });
  });
}

function startServer(dir) {
  const overrides = {};
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const override = overrides[urlPath];
    if (override) {
      res.writeHead(override.status, override.location ? { Location: override.location } : {});
      res.end();
      return;
    }
    const file = path.join(dir, urlPath);
    if (!file.startsWith(dir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200);
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      respond(urlPath, status, location) { overrides[urlPath] = { status, location }; },
      close: promisify(server.close.bind(server)),
    }));
  });
}

function assertMatchesExpected(actual, name) {
  const file = path.join(EXPECTED, name);
  if (process.env.UPDATE_EXPECTED) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, actual);
    return;
  }
  assert.isTrue(fs.existsSync(file), `missing expected file ${file}; run with UPDATE_EXPECTED=1 to create it`);
  assert.equal(actual, fs.readFileSync(file, 'utf8'), `output differs from ${file}`);
}

module.exports = {
  ROOT, runCli, startServer, assertMatchesExpected,
};
