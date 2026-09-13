import { cms, siteURL } from '@/lib/posts'
import { publicPostQuery } from '@/lib/access'
export const dynamic = 'force-dynamic'
const xml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
export async function GET() {
  const payload = await cms()
  const posts = await payload.find({ ...publicPostQuery(), limit: 50, depth: 0, sort: '-publishedAt' })
  const items = posts.docs.map(p => `<item><title>${xml(p.title)}</title><link>${siteURL}/blog/${p.slug}</link><guid>${siteURL}/blog/${p.slug}</guid><description>${xml(p.excerpt || '')}</description><category>${xml(p.category)}</category><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate></item>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>轩颖的小世界</title><link>${siteURL}/blog</link><description>把平凡的日子，过成粉色的诗。</description><language>zh-CN</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store' } })
}
