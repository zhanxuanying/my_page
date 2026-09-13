import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cms } from '@/lib/posts'
import { isAdmin } from '@/lib/access'
import { Article } from '@/components/Article'

export const dynamic = 'force-dynamic'
export const metadata = { title: '草稿预览', robots: { index: false, follow: false } }
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const payload = await cms()
  const { user } = await payload.auth({ headers: await headers() })
  if (!isAdmin(user)) redirect(`/admin/login?redirect=${encodeURIComponent(`/blog/preview/${id}`)}`)
  const post = await payload.findByID({ collection: 'posts', id, user, overrideAccess: false, draft: true, depth: 2, disableErrors: true })
  if (!post) notFound()
  return <Article post={post} preview />
}
