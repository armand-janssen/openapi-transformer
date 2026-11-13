/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const Schema = require('./schema');
const utils = require('./utils');

function resolveReferencedPath(basePath, referencedFile) {
  return basePath.startsWith('http') ? new URL(referencedFile, basePath).href : path.join(basePath, referencedFile);
}

const MAX_REDIRECTS = 10;

// Resolves to { url, body }: url is where the content came from after redirects, so references resolve against it.
async function loadUrl(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const httpLib = url.startsWith('https') ? https : http;
    const request = httpLib.request(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectsLeft === 0) {
            reject(new Error(`Too many redirects (more than ${MAX_REDIRECTS}) for ${url}`));
            return;
          }
          resolve(loadUrl(new URL(res.headers.location, url).href, redirectsLeft - 1));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const snippet = data.length > 200 ? `${data.slice(0, 200)}…` : data;
          reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage || ''} for ${url}${snippet ? `: ${snippet}` : ''}`));
          return;
        }
        resolve({ url, body: data });
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

// allLoadedFiles is per run: callers pass only (fileOrUrl, verbose); nested loads share the list.
async function loadYamlFile(fileOrUrl, verbose, allLoadedFiles = []) {
  if (allLoadedFiles.includes(fileOrUrl)) {
    if (verbose) console.log(`already loaded :: ${fileOrUrl}; skipping`);
    return [];
  }

  allLoadedFiles.push(fileOrUrl);
  if (verbose) console.log(`processing fileOrUrl :: ${fileOrUrl}`);
  const allParsedSchemas = {};

  let loadedFile;
  let basePath;
  if (fileOrUrl.startsWith('http')) {
    const response = await loadUrl(fileOrUrl);
    basePath = response.url;
    if (verbose) console.log(`base http path :: ${basePath}`);
    loadedFile = response.body;
  } else {
    // determine base to resolve other file references from
    basePath = path.dirname(fileOrUrl);
    if (verbose) console.log(`base file path :: ${basePath}`);

    loadedFile = fs.readFileSync(fileOrUrl, 'UTF-8');
  }
  const myYaml = YAML.parse(loadedFile);
  if (verbose) console.log(`loaded files :: ${allLoadedFiles}`);

  if ((myYaml.components !== undefined && myYaml.components.schemas !== undefined)
      || myYaml.definitions !== undefined) {
    let { schemas } = myYaml.components || {};
    if (!schemas) {
      schemas = myYaml.definitions;
    }

    const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose);

    utils.mergeObjects(parsedSchemas, allParsedSchemas);

    // sequential on purpose: schema order is first-seen (depth-first), whatever the response timing
    for (const referencedFile of referencedFiles) {
      const nextPath = resolveReferencedPath(basePath, referencedFile);
      // eslint-disable-next-line no-await-in-loop
      const referencedParsedSchemas = await loadYamlFile(nextPath, verbose, allLoadedFiles);

      utils.mergeObjects(referencedParsedSchemas, allParsedSchemas);
    }
  }
  return allParsedSchemas;
}
module.exports.loadYamlFile = loadYamlFile;
