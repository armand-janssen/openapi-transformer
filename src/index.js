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

const allLoadedFiles = [];

function resolveReferencedPath(basePath, referencedFile) {
  if (basePath.startsWith('http')) {
    return new URL(referencedFile, basePath).href;
  }
  return path.join(basePath, referencedFile);
}

async function loadUrl(url) {
  return new Promise((resolve, reject) => {
    const httpLib = url.startsWith('https') ? https : http;
    const request = httpLib.request(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const snippet = data.length > 200 ? `${data.slice(0, 200)}…` : data;
          reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage || ''} for ${url}${snippet ? `: ${snippet}` : ''}`));
          return;
        }
        res.body = data;
        resolve(res);
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

async function loadYamlFile(fileOrUrl, verbose, nested = false) {
  if (!nested) {
    allLoadedFiles.length = 0;
  }

  if (allLoadedFiles.includes(fileOrUrl)) {
    if (verbose) console.log(`already loaded :: ${fileOrUrl}; skipping`);
    return [];
  }

  if (verbose) console.log(`processing fileOrUrl :: ${fileOrUrl}`);
  const allParsedSchemas = {};

  let loadedFile;
  let basePath;
  if (fileOrUrl.startsWith('http')) {
    basePath = fileOrUrl;
    if (verbose) console.log(`base http path :: ${basePath}`);
    const response = await loadUrl(fileOrUrl);
    loadedFile = response.body;
  } else {
    // determine base to resolve other file references from
    basePath = path.dirname(fileOrUrl);
    if (verbose) console.log(`base file path :: ${basePath}`);

    loadedFile = fs.readFileSync(fileOrUrl, 'UTF-8');
  }
  const myYaml = YAML.parse(loadedFile);
  allLoadedFiles.push(fileOrUrl);
  if (verbose) console.log(`loaded files :: ${allLoadedFiles}`);

  if ((myYaml.components !== undefined && myYaml.components.schemas !== undefined)
      || myYaml.definitions !== undefined) {
    let { schemas } = myYaml.components || {};
    if (!schemas) {
      schemas = myYaml.definitions;
    }

    const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose);

    utils.mergeObjects(parsedSchemas, allParsedSchemas);

    if (referencedFiles !== undefined && referencedFiles.length > 0) {
      await Promise.all(referencedFiles.map(async (referencedFile) => {
        const nextPath = resolveReferencedPath(basePath, referencedFile);
        const referencedParsedSchemas = await loadYamlFile(nextPath, verbose, true);

        utils.mergeObjects(referencedParsedSchemas, allParsedSchemas);
      }));
    }
  }
  return allParsedSchemas;
}
module.exports.loadYamlFile = loadYamlFile;
