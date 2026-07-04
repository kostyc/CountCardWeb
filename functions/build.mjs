import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const workspacePackages = {
  '@countcard/core': path.join(root, 'packages/core'),
  '@countcard/encryption': path.join(root, 'packages/encryption'),
  '@countcard/firebase': path.join(root, 'packages/firebase'),
};

function loadPackageJson(pkgRoot) {
  return JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
}

function resolveExportTarget(pkgRoot, target) {
  const resolved = path.join(pkgRoot, target.replace(/^\.\//, ''));
  if (fs.existsSync(resolved)) return resolved;
  if (fs.existsSync(`${resolved}.ts`)) return `${resolved}.ts`;
  if (fs.existsSync(`${resolved}.tsx`)) return `${resolved}.tsx`;
  if (fs.existsSync(path.join(resolved, 'index.ts'))) return path.join(resolved, 'index.ts');
  throw new Error(`Cannot resolve export target: ${target}`);
}

function resolveWorkspaceImport(importPath) {
  for (const [pkgName, pkgRoot] of Object.entries(workspacePackages)) {
    if (importPath === pkgName) {
      const pkg = loadPackageJson(pkgRoot);
      return resolveExportTarget(pkgRoot, pkg.exports['.']);
    }
    const prefix = `${pkgName}/`;
    if (!importPath.startsWith(prefix)) continue;

    const exportKey = `.${importPath.slice(pkgName.length)}`;
    const pkg = loadPackageJson(pkgRoot);
    const exports = pkg.exports ?? {};

    if (exports[exportKey]) {
      return resolveExportTarget(pkgRoot, exports[exportKey]);
    }

    for (const [key, target] of Object.entries(exports)) {
      if (!key.includes('*')) continue;
      const pattern = `^${key.replace(/\./g, '\\.').replace('*', '(.+)')}$`;
      const match = exportKey.match(new RegExp(pattern));
      if (match) {
        return resolveExportTarget(pkgRoot, target.replace('*', match[1]));
      }
    }

    throw new Error(`No export for ${importPath}`);
  }
  return null;
}

const workspacePlugin = {
  name: 'countcard-workspace',
  setup(build) {
    build.onResolve({ filter: /^@countcard\// }, (args) => {
      const resolved = resolveWorkspaceImport(args.path);
      if (!resolved) return null;
      return { path: resolved };
    });
  },
};

await esbuild.build({
  entryPoints: [path.join(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: path.join(__dirname, 'lib/index.js'),
  sourcemap: true,
  logLevel: 'info',
  plugins: [workspacePlugin],
  external: [
    'firebase-admin',
    'firebase-admin/*',
    'firebase-functions',
    'firebase-functions/*',
    'express',
    'cors',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
  ],
});
