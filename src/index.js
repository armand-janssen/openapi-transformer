const YAML = require('yaml');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
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
          const detail = snippet ? `: ${snippet}` : '';
          reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage || ''} for ${url}${detail}`));
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

// Resolves to { basePath, content }: basePath is what the file's references resolve against.
async function readSource(fileOrUrl, verbose) {
  if (fileOrUrl.startsWith('http')) {
    let response;
    try {
      response = await loadUrl(fileOrUrl);
    } catch (err) {
      throw new Error(`Cannot load ${fileOrUrl}: ${err.message}`, { cause: err });
    }
    if (verbose) console.log(`base http path :: ${response.url}`);
    return { basePath: response.url, content: response.body };
  }
  const basePath = path.dirname(fileOrUrl);
  if (verbose) console.log(`base file path :: ${basePath}`);
  try {
    return { basePath, content: fs.readFileSync(fileOrUrl, 'UTF-8') };
  } catch (err) {
    throw new Error(`Cannot read ${fileOrUrl}: ${err.message}`, { cause: err });
  }
}

function parseYaml(content, fileOrUrl) {
  try {
    return YAML.parse(content);
  } catch (err) {
    throw new Error(`Invalid YAML or JSON in ${fileOrUrl}: ${err.message}`, { cause: err });
  }
}

// allLoadedFiles is per run: callers leave it out and nested loads share it.
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

  const { basePath, content } = await readSource(fileOrUrl, verbose);
  const myYaml = parseYaml(content, fileOrUrl);
  if (verbose) console.log(`loaded files :: ${allLoadedFiles}`);

  const schemas = myYaml?.components?.schemas || myYaml?.definitions;
  if (schemas) {
    const skipped = [];
    const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose, skipped);
    skipped.forEach((name) => warnings.push(`schema ${name} in ${fileOrUrl} is not rendered (only objects and enums are supported)`));

    utils.mergeObjects(parsedSchemas, allParsedSchemas);

    // chained on purpose: schema order is first-seen (depth-first), whatever the response timing
    await referencedFiles.reduce(async (previous, referencedFile) => {
      await previous;
      const nextPath = resolveReferencedPath(basePath, referencedFile);
      utils.mergeObjects(await loadYamlFile(nextPath, verbose, warnings, allLoadedFiles), allParsedSchemas);
    }, Promise.resolve());
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
