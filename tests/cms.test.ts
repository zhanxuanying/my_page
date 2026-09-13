import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publishedOnly, isAdmin, publicPostQuery } from '../src/lib/access.ts'
import { markdownToLexical, textFromLexical, headingsFromLexical, safeURL } from '../src/lib/content.ts'
import { validateImage, storagePath, imageFilename } from '../src/storage/validation.ts'

test('visitors are restricted to published posts whose publication date has arrived', () => {
  const at = new Date('2026-09-13T00:00:00Z')
  assert.deepEqual(publishedOnly(at), { and: [
    { _status: { equals: 'published' } }, { publishedAt: { less_than_equal: at.toISOString() } },
  ] })
  assert.equal(isAdmin(null), false)
  assert.equal(isAdmin({ collection: 'visitors' }), false)
  assert.equal(isAdmin({ collection: 'users' }), true)
  const query = publicPostQuery({ page: 'garbage', q: ' <hello> ', category: '记录日常' }, at)
  assert.equal(query.overrideAccess, false)
  assert.equal(query.draft, false)
  assert.equal(query.page, 1)
  assert.ok(JSON.stringify(query.where).includes('published'))
  assert.ok(JSON.stringify(query.where).includes('<hello>'))
})

test('import preserves paragraphs, lists, quotes and headings as inert editor content', () => {
  const source = '第一行\n第二行\n\n## 小标题\n\n- 项目一\n- 项目二\n\n> 引用\n\n<script>坏内容</script>'
  const content = markdownToLexical(source)
  const text = textFromLexical(content)
  for (const expected of ['第一行','第二行','小标题','项目一','项目二','引用','<script>坏内容</script>']) assert.ok(text.includes(expected))
  assert.deepEqual(headingsFromLexical(content), [{ id: 'section-1', text: '小标题', level: 2 }])
  assert.equal(content.root.children.filter(n => n.type === 'list').length, 1)
})

test('rich text links reject executable and protocol-relative destinations', () => {
  for (const url of ['javascript:alert(1)','data:text/html,x','//evil.example','file:///etc/passwd','java\nscript:alert(1)']) assert.equal(safeURL(url), undefined)
  for (const url of ['https://example.com/a','mailto:hello@example.com','/blog/office','#section-1']) assert.equal(safeURL(url), url)
})

test('uploads reject unsupported, mismatched and oversized files', () => {
  const png = Buffer.from('89504e470d0a1a0a00000000', 'hex')
  assert.doesNotThrow(() => validateImage({ buffer: png, mimeType: 'image/png', filesize: png.length }))
  assert.throws(() => validateImage({ buffer: png, mimeType: 'image/jpeg', filesize: png.length }))
  assert.throws(() => validateImage({ buffer: Buffer.from('<svg/>'), mimeType: 'image/svg+xml', filesize: 6 }))
  assert.throws(() => validateImage({ buffer: png, mimeType: 'image/png', filesize: 6 * 1024 * 1024 }))
  assert.match(imageFilename('image/png'), /^[a-f0-9-]{36}\.png$/)
  assert.throws(() => storagePath('你好 #1.png'))
  assert.throws(() => storagePath('../private'))
})
