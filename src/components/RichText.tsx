import React, { type ReactNode } from 'react'
import { safeURL, type LexicalContent, type LexicalNode } from '../lib/content'
import type { Media, Post } from '../payload-types'

export function RichText({ content }: { content: unknown }) {
  let headingIndex = 0
  const render = (node: LexicalNode, key: number): ReactNode => {
    const children = node.children?.map(render)
    switch (node.type) {
      case 'text': {
        let text: ReactNode = node.text || ''
        const f = typeof node.format === 'number' ? node.format : 0
        if (f & 16) text = <code>{text}</code>
        if (f & 1) text = <strong>{text}</strong>
        if (f & 2) text = <em>{text}</em>
        if (f & 8) text = <u>{text}</u>
        if (f & 4) text = <s>{text}</s>
        return <React.Fragment key={key}>{text}</React.Fragment>
      }
      case 'linebreak': return <br key={key} />
      case 'paragraph': return <p key={key}>{children?.length ? children : <br />}</p>
      case 'heading': {
        const Tag = (['h2', 'h3', 'h4'].includes(node.tag || '') ? node.tag : 'h2') as 'h2'
        return <Tag key={key} id={`section-${++headingIndex}`}>{children}</Tag>
      }
      case 'list': return node.listType === 'number' ? <ol key={key} start={Number(node.start) || 1}>{children}</ol> : <ul key={key}>{children}</ul>
      case 'listitem': return <li key={key}>{children}</li>
      case 'quote': return <blockquote key={key}>{children}</blockquote>
      case 'horizontalrule': return <hr key={key} />
      case 'link': case 'autolink': {
        const f = node.fields as { url?: string; newTab?: boolean; doc?: { value?: Post }; linkType?: string } | undefined
        const slug = f?.doc?.value?.slug
        const href = safeURL(slug ? `/blog/${encodeURIComponent(slug)}` : f?.url)
        return href ? <a key={key} href={href} target={f?.newTab ? '_blank' : undefined} rel={f?.newTab ? 'noopener noreferrer' : undefined}>{children}</a> : <span key={key}>{children}</span>
      }
      case 'upload': {
        const image = node.value as Media | undefined
        const src = safeURL(image?.url)
        const caption = (node.fields as { caption?: string } | undefined)?.caption || image?.caption
        return src ? <figure key={key}><img src={src} alt={image?.alt || ''} width={image?.width || undefined} height={image?.height || undefined} loading="lazy" />{caption && <figcaption>{caption}</figcaption>}</figure> : null
      }
      default: return <React.Fragment key={key}>{children}</React.Fragment>
    }
  }
  return <div className="prose">{(content as LexicalContent | null)?.root?.children?.map(render)}</div>
}
