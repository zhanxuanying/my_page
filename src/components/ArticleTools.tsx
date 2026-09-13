'use client'
import { useEffect, useState } from 'react'

export function ArticleTools() {
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [large, setLarge] = useState(false)
  useEffect(() => {
    const update = () => {
      const article = document.getElementById('article-body')
      if (!article) return
      const distance = article.getBoundingClientRect().top + window.scrollY
      setProgress(Math.min(100, Math.max(0, (window.scrollY - distance + window.innerHeight * .4) / Math.max(1, article.offsetHeight - window.innerHeight * .4) * 100)))
    }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])
  async function share() {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    catch { if (navigator.share) await navigator.share({ title: document.title, url: location.href }).catch(() => {}) }
  }
  return <><div className="reading-progress" style={{ width: `${progress}%` }} /><div className="reader-tools"><button type="button" aria-pressed={large} onClick={() => { setLarge(!large); document.getElementById('article-body')?.classList.toggle('large-text', !large) }}>Aa <span>{large ? '标准字号' : '放大文字'}</span></button><button type="button" onClick={share}>↗ <span aria-live="polite">{copied ? '链接已复制' : '分享文章'}</span></button></div></>
}
