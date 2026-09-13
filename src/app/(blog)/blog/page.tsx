import type { Metadata } from 'next'
import { cms, getCategories } from '@/lib/posts'
import { publicPostQuery } from '@/lib/access'
import { PostCard } from '@/components/PostCard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '博客笔记', alternates: { canonical: '/blog' } }
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[]; page?: string | string[] }> }) {
  const raw = await searchParams
  const first = (v?: string | string[]) => Array.isArray(v) ? v[0] : v
  const params = { q: first(raw.q), category: first(raw.category), page: first(raw.page) }
  const payload = await cms()
  const [posts, categories] = await Promise.all([payload.find(publicPostQuery(params)), getCategories()])
  const query = (page: number, category = params.category) => { const p = new URLSearchParams(); if (params.q) p.set('q', params.q); if (category) p.set('category', category); if (page > 1) p.set('page', String(page)); return `/blog${p.size ? '?' + p : ''}` }
  return <div className="blog-container"><section className="blog-intro"><div><span className="small-label">NOTES & LITTLE MOMENTS</span><h1>生活的留白，<br />写一点<span>喜欢的事<svg viewBox="0 0 280 16" aria-hidden="true"><path d="M3 11C65 1 159 3 276 8" /></svg></span>。</h1><p>在工作、音乐和日常之间，<br className="mobile-break" />收藏一些值得记住的小小瞬间。</p></div><div className="intro-stamp" aria-hidden="true"><span>✳</span><p>慢慢记录<br />慢慢喜欢</p><small>EST. 2026</small></div></section><div className="blog-toolbar"><nav className="category-tabs" aria-label="文章分类"><a className={!params.category ? 'selected' : ''} href={query(1, '')}>所有笔记</a>{categories.map(c => <a className={params.category === c ? 'selected' : ''} href={query(1, c)} key={c}>{c}</a>)}</nav><form action="/blog" className="blog-search" role="search">{params.category && <input type="hidden" name="category" value={params.category} />}<label htmlFor="blog-search" className="visually-hidden">搜索笔记</label><input id="blog-search" name="q" defaultValue={params.q} placeholder="找一篇想读的笔记…" maxLength={120} /><button aria-label="搜索" type="submit">⌕</button></form></div><div className="results-line"><span>{params.q ? `“${params.q.slice(0, 120)}” 的搜索结果` : params.category || '所有值得收藏的日常'}</span><span>{posts.totalDocs} 篇笔记</span></div>{posts.docs.length ? <div className="blog-grid">{posts.docs.map((p, i) => <PostCard key={p.id} post={p} featured={i === 0 && posts.page === 1 && !params.q && !params.category} />)}</div> : <section className="empty-notes"><span>✳</span><h2>{params.q ? '暂时没有找到这篇笔记' : '下一篇故事，还在路上'}</h2><p>{params.q ? '换一个关键词，或逛逛其他笔记。' : '等灵感到来，我们在这里见。'}</p><a href="/blog">看看所有笔记 →</a></section>}{posts.totalPages > 1 && <nav className="blog-pagination" aria-label="文章分页">{posts.hasPrevPage ? <a href={query(posts.prevPage!)}>← 上一页</a> : <span />}<span>{posts.page} / {posts.totalPages}</span>{posts.hasNextPage ? <a href={query(posts.nextPage!)}>下一页 →</a> : <span />}</nav>}<section className="blog-signoff"><span>✳</span><p>不用很特别，<em>也值得被记住。</em></p><small>THANK YOU FOR STOPPING BY</small></section></div>
}
