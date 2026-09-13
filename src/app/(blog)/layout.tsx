import React from 'react'
import type { Metadata } from 'next'
import './blog.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: '博客笔记 · 轩颖的小世界', template: '%s · 轩颖的小世界' },
  description: '办公小记、生活灵感和日常里的微小美好。占轩颖的个人博客。',
  icons: { icon: '/assets/favicon.svg' },
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
}
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><a className="reader-skip" href="#main">跳转到正文</a><header className="blog-header"><div className="blog-container"><a href="/" className="blog-brand"><img src="/assets/favicon.svg" alt="" width="34" height="34" />轩颖的小世界<span>.</span></a><nav aria-label="主导航"><a href="/#about">关于我</a><a href="/#tools">实用工具</a><a className="current" href="/blog">博客笔记</a></nav><a className="header-write" href="/admin">写作间 ↗</a></div></header><main id="main">{children}</main><footer className="blog-footer"><div className="blog-container"><div><a className="footer-brand" href="/">轩颖的小世界<span>✳</span></a><p>把平凡的日子，过成粉色的诗。</p></div><div className="footer-links"><a href="/">回到主页</a><a href="/feed.xml">RSS 订阅</a><a href="/admin">写作后台</a><small>© {new Date().getFullYear()} 占轩颖</small></div></div></footer></body></html>
}
