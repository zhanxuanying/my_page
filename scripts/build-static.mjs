import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '_site');
const publicFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'blog.js',
  'blog-data.js',
  'supabase-config.js',
  '.nojekyll',
  'assets',
];

// Both hosts publish the same allowlist, keeping source and credentials private.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file), {
    recursive: true,
    filter: (source) =>
      source === path.join(root, '.nojekyll') || !path.basename(source).startsWith('.'),
  });
}

console.log(`Static website ready in _site/ (${(await readdir(output)).length} entries).`);
