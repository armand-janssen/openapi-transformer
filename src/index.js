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

// Only the root call sees every loaded schema, so it checks that what each schema points at is rendered.
function warnAboutMissingTargets(schemas, warnings) {
  Object.values(schemas).forEach((schema) => {
    const targets = [schema.parent, ...(schema.additionalParents || []), ...schema.relationShips.map((r) => r.to)];
    new Set(targets.filter((target) => target !== undefined && !schemas[target]))
      .forEach((target) => warnings.push(`schema ${schema.name} refers to ${target}, which is not rendered`));
  });
}

// allLoadedFiles is per run: callers pass only (fileOrUrl, verbose); nested loads share the list.
// warnings (optional array) collects one message per schema that is not rendered; the CLI prints them, the library stays silent.
async function loadYamlFile(fileOrUrl, verbose, warnings = [], allLoadedFiles = []) {
  // the same file can be reached as ./a.yaml and sub/../a.yaml, so compare resolved locations
  const key = fileOrUrl.startsWith('http') ? new URL(fileOrUrl).href : path.resolve(fileOrUrl);
  if (allLoadedFiles.includes(key)) {
    if (verbose) console.log(`already loaded :: ${fileOrUrl}; skipping`);
    return [];
  }

  allLoadedFiles.push(key);
  if (verbose) console.log(`processing fileOrUrl :: ${fileOrUrl}`);
  const allParsedSchemas = {};

  let loadedFile;
  let basePath;
  if (fileOrUrl.startsWith('http')) {
    let response;
    try {
      response = await loadUrl(fileOrUrl);
    } catch (err) {
      throw new Error(`Cannot load ${fileOrUrl}: ${err.message}`, { cause: err });
    }
    basePath = response.url;
    if (verbose) console.log(`base http path :: ${basePath}`);
    loadedFile = response.body;
  } else {
    // determine base to resolve other file references from
    basePath = path.dirname(fileOrUrl);
    if (verbose) console.log(`base file path :: ${basePath}`);

    try {
      loadedFile = fs.readFileSync(fileOrUrl, 'UTF-8');
    } catch (err) {
      throw new Error(`Cannot read ${fileOrUrl}: ${err.message}`, { cause: err });
    }
  }
  let myYaml;
  try {
    myYaml = YAML.parse(loadedFile);
  } catch (err) {
    throw new Error(`Invalid YAML or JSON in ${fileOrUrl}: ${err.message}`, { cause: err });
  }
  if (verbose) console.log(`loaded files :: ${allLoadedFiles}`);

  if (myYaml && ((myYaml.components !== undefined && myYaml.components.schemas !== undefined)
      || myYaml.definitions !== undefined)) {
    let { schemas } = myYaml.components || {};
    if (!schemas) {
      schemas = myYaml.definitions;
    }

    const skipped = [];
    const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose, skipped);
    skipped.forEach((name) => warnings.push(`schema ${name} in ${fileOrUrl} is not rendered (only objects and enums are supported)`));

    utils.mergeObjects(parsedSchemas, allParsedSchemas);

    // sequential on purpose: schema order is first-seen (depth-first), whatever the response timing
    for (const referencedFile of referencedFiles) {
      const nextPath = resolveReferencedPath(basePath, referencedFile);
      const referencedParsedSchemas = await loadYamlFile(nextPath, verbose, warnings, allLoadedFiles);

      utils.mergeObjects(referencedParsedSchemas, allParsedSchemas);
    }
  }
  if (allLoadedFiles[0] === key) warnAboutMissingTargets(allParsedSchemas, warnings);
  return allParsedSchemas;
}
module.exports = {
  loadYamlFile,
  generatePlantUml: require('./plantUmlTransformer').generate,
  generateMarkdown: require('./markdownTransformer').generate,
  generateJsonSchema: require('./jsonSchemaTransformer').generate,
};
