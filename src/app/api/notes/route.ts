import { cms, siteURL } from '@/lib/posts'
import { publicPostQuery } from '@/lib/access'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const offset = Number(new URL(request.url).searchParams.get('offset') || 0)
  if (!Number.isSafeInteger(offset) || offset < 0 || offset % 6) return Response.json({ error: 'Invalid offset' }, { status: 400 })
  const payload = await cms()
  const result = await payload.find({ ...publicPostQuery(), limit: 6, page: offset / 6 + 1, depth: 1 })
  const posts = result.docs.map(p => ({ slug: p.slug, title: p.title, excerpt: p.excerpt || '', category: p.category, cover_theme: p.coverTheme || 'journal', body: '', reading_minutes: p.readingMinutes || 1, is_sample: p.isSample || false, published_at: p.publishedAt, article_url: `${siteURL}/blog/${encodeURIComponent(p.slug)}`, cover_url: typeof p.cover === 'object' ? p.cover?.url : null }))
  return Response.json({ posts, hasMore: result.hasNextPage }, { headers: { 'Access-Control-Allow-Origin': 'https://zhanxuanying.github.io', 'Cache-Control': 'no-store' } })
}
