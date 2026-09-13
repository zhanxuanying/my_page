import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { publicPostQuery, publishedOnly } from './access'
import type { Post } from '../payload-types'

export const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const cms = () => getPayload({ config })
export const getPost = cache(async (slug: string) => {
  const payload = await cms()
  const result = await payload.find({ ...publicPostQuery(), limit: 1, depth: 2, where: { and: [publishedOnly(), { slug: { equals: slug } }] } })
  return result.docs[0] || null
})
export const getCategories = cache(async () => {
  const payload = await cms()
  const result = await payload.find({ ...publicPostQuery(), limit: 1000, depth: 0, select: { category: true } })
  return [...new Set(result.docs.map(post => post.category))]
})
export async function getNeighbors(post: Post) {
  const payload = await cms()
  const order = post.sortOrder || 0
  const direction = (previous: boolean) => {
    const position = previous ? 'less_than' : 'greater_than'
    const time = previous ? 'greater_than' : 'less_than'
    return payload.find({
      ...publicPostQuery(), limit: 1, depth: 0,
      sort: previous ? ['-sortOrder', 'publishedAt', '-id'] : ['sortOrder', '-publishedAt', 'id'],
      where: { and: [publishedOnly(), { or: [
        { sortOrder: { [position]: order } },
        { and: [{ sortOrder: { equals: order } }, { publishedAt: { [time]: post.publishedAt } }] },
        { and: [{ sortOrder: { equals: order } }, { publishedAt: { equals: post.publishedAt } }, { id: { [position]: post.id } }] },
      ] }] },
    })
  }
  const [previous, next] = await Promise.all([direction(true), direction(false)])
  return { previous: previous.docs[0], next: next.docs[0] }
}
export const dateLabel = (value: string | undefined | null) => value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value)) : ''
