#!/usr/bin/env node
/** Emit browser evaluate snippet to inject fixture xlsx into file input. */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(
  __dirname,
  '../sprints/Sprint-27-Recruit-Lifecycle/fixtures/kilo-receiving-import-5.xlsx'
);
const b64 = readFileSync(fixture).toString('base64');
const expr = `(async () => {
  const b64 = ${JSON.stringify(b64)};
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const file = new File([bytes], 'kilo-receiving-import-5.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const input = document.querySelector('input[accept*="xlsx"]');
  if (!input) return { ok: false, err: 'no input' };
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true, files: input.files.length, name: file.name };
})()`;
writeFileSync(resolve(__dirname, '.kilo-xlsx-inject.expr.json'), JSON.stringify({ expression: expr }));
console.log('wrote inject expr', expr.length, 'chars');
