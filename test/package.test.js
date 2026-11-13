const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { assert } = require('chai');

const ROOT = path.join(__dirname, '..');

// Packs the repo, unpacks the tarball into an empty temp dir (like an install would) and uses it from there.
// Runtime deps are not downloaded: NODE_PATH points at the repo's node_modules, so a runtime
// require of a package that is not a production dependency would still resolve here; the
// dependencies assertion below covers that gap.
describe('packed tarball', function packedTarball() {
  this.timeout(60000);
  let dir;
  let pkgDir;
  const env = () => ({ ...process.env, NODE_PATH: path.join(ROOT, 'node_modules') });

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-transformer-pack-'));
    const out = execFileSync('npm', ['pack', '--json', '--pack-destination', dir], { cwd: ROOT, encoding: 'utf8' });
    const [{ filename, files }] = JSON.parse(out);
    this.files = files.map((f) => f.path);
    pkgDir = path.join(dir, 'node_modules', 'openapi-transformer');
    fs.mkdirSync(pkgDir, { recursive: true });
    execFileSync('tar', ['-xzf', path.join(dir, filename), '-C', pkgDir, '--strip-components=1']);
  });
  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('contains only source, README, LICENSE and package.json', () => {
    const unexpected = this.files.filter((f) => !/^(src\/.*\.js|README\.md|LICENSE|package\.json)$/.test(f));
    assert.deepEqual(unexpected, []);
    assert.include(this.files, 'src/cli.js');
  });

  it('can be required from outside the repo', () => {
    const out = execFileSync(process.execPath, ['-e', "console.log(typeof require('openapi-transformer').loadYamlFile)"], { cwd: dir, env: env(), encoding: 'utf8' });
    assert.equal(out.trim(), 'function');
  });

  it('runs the CLI from the unpacked package', () => {
    const out = execFileSync(process.execPath, [path.join(pkgDir, 'src', 'cli.js'), path.join(ROOT, 'example', 'vehicle.yaml'), '-m', 'out.md'], { cwd: dir, env: env(), encoding: 'utf8' });
    assert.equal(out, '');
    assert.include(fs.readFileSync(path.join(dir, 'out.md'), 'utf8'), 'Vehicle');
  });

  it('declares every required package as a production dependency', () => {
    const deps = Object.keys(JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).dependencies);
    const required = ['commander', 'yaml'];
    required.forEach((d) => assert.include(deps, d));
    assert.sameMembers(deps, required);
  });
});
