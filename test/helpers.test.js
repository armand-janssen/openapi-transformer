const http = require('http');
const path = require('path');
const { assert } = require('chai');
const { startServer } = require('./helpers');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }));
    }).on('error', reject);
  });
}

describe('test helper: startServer', () => {
  let server;
  before(async () => { server = await startServer(path.join(__dirname, '..', 'example')); });
  after(() => server.close());

  it('serves files from the fixture directory', async () => {
    const res = await get(`${server.url}/owner.yaml`);
    assert.equal(res.status, 200);
    assert.include(res.body, 'owner');
  });

  it('answers 404 for a missing file', async () => {
    assert.equal((await get(`${server.url}/nope.yaml`)).status, 404);
  });

  it('does not serve files outside the fixture directory', async () => {
    assert.equal((await get(`${server.url}/..%2Fpackage.json`)).status, 404);
  });

  it('answers a configured status or redirect for a given path', async () => {
    server.respond('/owner.yaml', 500);
    server.respond('/moved.yaml', 301, '/owner.yaml');
    assert.equal((await get(`${server.url}/owner.yaml`)).status, 500);
    const moved = await get(`${server.url}/moved.yaml`);
    assert.equal(moved.status, 301);
    assert.equal(moved.location, '/owner.yaml');
  });
});
