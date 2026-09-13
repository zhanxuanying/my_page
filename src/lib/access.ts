import type { Access, Where } from 'payload'

export const isAdmin = (user: { collection?: string } | null | undefined): boolean => user?.collection === 'users'
export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const publishedOnly = (now = new Date()): Where => ({ and: [
  { _status: { equals: 'published' } },
  { publishedAt: { less_than_equal: now.toISOString() } },
] })
export const adminOrPublished: Access = ({ req }) => isAdmin(req.user) || publishedOnly()

export function publicPostQuery(params: { page?: string | string[]; q?: string | string[]; category?: string | string[] } = {}, now = new Date()) {
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page)
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().slice(0, 120)
  const category = (Array.isArray(params.category) ? params.category[0] : params.category)?.trim().slice(0, 30)
  const and: Where[] = [publishedOnly(now)]
  if (q) and.push({ or: [{ title: { contains: q } }, { excerpt: { contains: q } }, { searchText: { contains: q } }] })
  if (category) and.push({ category: { equals: category } })
  return {
    collection: 'posts' as const, overrideAccess: false, draft: false, depth: 1,
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
    limit: 9, sort: ['sortOrder', '-publishedAt', 'id'], where: { and },
  }
}
