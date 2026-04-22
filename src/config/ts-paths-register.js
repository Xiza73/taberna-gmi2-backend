/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const tsConfigPaths = require('tsconfig-paths');
const Module = require('module');

const tsConfig = require('../../tsconfig.json');
const baseUrl = path.resolve(__dirname, '../..');

const matchPath = tsConfigPaths.createMatchPath(
  baseUrl,
  tsConfig.compilerOptions.paths,
);

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  // Strip .js extension for resolution (nodenext adds .js but files are .ts)
  let cleanRequest = request;
  if (request.endsWith('.js')) {
    cleanRequest = request.slice(0, -3);
  }

  // Try tsconfig-paths resolution (handles @modules/, @shared/, @test/)
  const found = matchPath(cleanRequest, undefined, undefined, [
    '.ts',
    '.tsx',
    '.js',
    '.json',
    '.node',
  ]);
  if (found) {
    return originalResolveFilename.call(this, found, parent, isMain, options);
  }

  // For relative .js imports, try without extension (ts-node handles .ts)
  if (request !== cleanRequest) {
    try {
      return originalResolveFilename.call(
        this,
        cleanRequest,
        parent,
        isMain,
        options,
      );
    } catch {
      // Fall through to original
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
