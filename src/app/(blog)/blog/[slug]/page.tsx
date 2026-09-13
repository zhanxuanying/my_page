import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getNeighbors, siteURL } from '@/lib/posts'
import { Article } from '@/components/Article'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return { title: '笔记未找到', robots: { index: false } }
  const cover = post.cover as Media | null
  return { title: post.seo?.title || post.title, description: post.seo?.description || post.excerpt, alternates: { canonical: `/blog/${post.slug}` }, openGraph: { title: post.title, description: post.excerpt || '', type: 'article', publishedTime: post.publishedAt, modifiedTime: post.updatedAt, ...(cover?.url ? { images: [cover.url] } : {}) } }
}
export default async function PostPage({ params }: Args) {
  const post = await getPost((await params).slug)
  if (!post) notFound()
  const neighbors = await getNeighbors(post)
  const structured = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { '@type': 'Person', name: '占轩颖' }, url: `${siteURL}/blog/${post.slug}` }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} /><Article post={post} {...neighbors} /></>
}
