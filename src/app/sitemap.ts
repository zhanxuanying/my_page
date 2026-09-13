import type { MetadataRoute } from 'next'
import { cms, siteURL } from '@/lib/posts'
import { publicPostQuery } from '@/lib/access'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await cms()
  const posts = await payload.find({ ...publicPostQuery(), limit: 1000, depth: 0 })
  return [{ url: siteURL }, { url: `${siteURL}/blog` }, ...posts.docs.map(p => ({ url: `${siteURL}/blog/${p.slug}`, lastModified: p.updatedAt }))]
}
