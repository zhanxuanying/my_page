import type { Post, Media } from '../payload-types'
import { dateLabel } from '../lib/posts'

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const cover = post.cover as Media | null
  const labels = { office: ['井井有条', 'WORK SMARTER, LIVE SLOWER', '＋'], music: ['留白时刻', 'A SOUNDTRACK FOR THE EVERYDAY', '♪'], journal: ['微小美好', 'COLLECT THE LITTLE JOYS', '✳'] }
  const theme = post.coverTheme || 'journal'
  const label = labels[theme]
  return <a href={`/blog/${encodeURIComponent(post.slug)}`} className={`post-card ${featured ? 'featured-card' : ''}`}><div className={`post-cover theme-${theme}`}>{cover?.url ? <img src={cover.url} alt={cover.alt} loading="lazy" /> : <><span className="cover-kicker">{label[1]}</span><strong>{label[0]}</strong><span className="cover-symbol" aria-hidden="true">{label[2]}</span><span className="cover-bottom-label">把平凡的日子，轻轻收藏。</span></>}</div><div className="post-card-copy"><div className="post-meta"><span>{post.category}</span><span>{post.readingMinutes || 1} 分钟阅读</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><div className="post-card-bottom"><time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time><span>翻开这篇笔记 ↗</span></div></div></a>
}
