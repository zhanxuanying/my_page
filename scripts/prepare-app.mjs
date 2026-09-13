import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
await mkdir(path.join(root, 'public'), { recursive: true })
for (const name of ['index.html','styles.css','app.js','blog.js','blog-data.js','supabase-config.js','cms-config.js','assets']) {
  await cp(path.join(root, name), path.join(root, 'public', name), { recursive: true })
}
await mkdir(path.join(root, 'src/generated'), { recursive: true })
await writeFile(path.join(root, 'src/generated/home.ts'), `export default ${JSON.stringify(await readFile(path.join(root, 'index.html'), 'utf8'))}\n`)
console.log('Homepage assets prepared.')
