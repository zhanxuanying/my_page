export type LexicalNode = {
  type: string; version: number; children?: LexicalNode[]; text?: string;
  tag?: string; format?: number | string; [key: string]: unknown
}
export type LexicalContent = { root: LexicalNode & { children: LexicalNode[] } }

const textNode = (text: string): LexicalNode => ({ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' })
const element = (type: string, children: LexicalNode[], extra = {}): LexicalNode => ({ type, version: 1, children, format: '', indent: 0, direction: null, ...extra })

export function markdownToLexical(body: string): LexicalContent {
  const children: LexicalNode[] = []
  for (const block of body.replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/)) {
    const lines = block.split('\n')
    if (lines.every(line => /^[-*]\s/.test(line))) {
      children.push(element('list', lines.map((line, i) => element('listitem', [textNode(line.replace(/^[-*]\s+/, ''))], { value: i + 1, checked: undefined })), { listType: 'bullet', start: 1, tag: 'ul' }))
    } else if (/^#{1,3}\s/.test(block)) {
      const level = block.match(/^#+/)![0].length
      children.push(element('heading', [textNode(block.replace(/^#{1,3}\s+/, ''))], { tag: `h${Math.max(2, level)}` }))
    } else if (lines.every(line => /^>/.test(line))) {
      children.push(element('quote', [textNode(lines.map(line => line.replace(/^>\s?/, '')).join('\n'))]))
    } else {
      children.push(element('paragraph', lines.flatMap((line, i) => i ? [{ type: 'linebreak', version: 1 }, textNode(line)] : [textNode(line)]), { textFormat: 0, textStyle: '' }))
    }
  }
  return { root: element('root', children) as LexicalContent['root'] }
}

export function textFromLexical(content: unknown): string {
  const visit = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const n = node as LexicalNode
    if (typeof n.text === 'string') return n.text
    if (n.type === 'linebreak') return '\n'
    return Array.isArray(n.children) ? n.children.map(visit).join(['root', 'list'].includes(n.type) ? '\n' : '') : ''
  }
  return visit((content as LexicalContent | null)?.root)
}

export function headingsFromLexical(content: unknown) {
  const headings: { id: string; text: string; level: number }[] = []
  const walk = (node: LexicalNode) => {
    if (node.type === 'heading') headings.push({ id: `section-${headings.length + 1}`, text: textFromLexical({ root: node }), level: Number(node.tag?.slice(1)) || 2 })
    node.children?.forEach(walk)
  }
  const root = (content as LexicalContent | null)?.root
  if (root) walk(root)
  return headings
}

export function safeURL(url: unknown): string | undefined {
  if (typeof url !== 'string' || /[\u0000-\u001f\u007f\\]/.test(url)) return undefined
  if (/^(https?:\/\/|mailto:|#|\/(?!\/))/.test(url)) return url
  return undefined
}
