import type { CollectionConfig } from 'payload'
import { adminOnly, adminOrPublished } from '../lib/access'
import { textFromLexical } from '../lib/content'

export const Posts: CollectionConfig = {
  slug: 'posts', labels: { singular: '文章', plural: '文章' },
  admin: {
    useAsTitle: 'title', group: '创作', defaultColumns: ['title', 'category', '_status', 'publishedAt', 'updatedAt'],
    description: '从一个小想法开始。草稿会自动保存，准备好后再发布。',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/preview/${doc.id}`,
    pagination: { defaultLimit: 20 },
  },
  access: { read: adminOrPublished, create: adminOnly, update: adminOnly, delete: adminOnly, readVersions: adminOnly },
  versions: { maxPerDoc: 30, drafts: { autosave: { interval: 3000, showSaveDraftButton: true } } },
  hooks: { beforeValidate: [({ data }) => {
    if (!data) return data
    if (data.sortOrder === null) data.sortOrder = 0
    if (!data.slug) data.slug = `note-${crypto.randomUUID().slice(0, 12)}`
    if (data.content) {
      data.searchText = textFromLexical(data.content)
      data.readingMinutes = Math.max(1, Math.ceil(data.searchText.length / 400))
      if (!data.excerpt) data.excerpt = data.searchText.replace(/\s+/g, ' ').slice(0, 140)
    }
    return data
  }] },
  fields: [
    { name: 'title', label: '文章标题', type: 'text', required: true, maxLength: 120 },
    { name: 'excerpt', label: '摘要', type: 'textarea', maxLength: 300, admin: { description: '出现在文章卡片和搜索结果里；留空会从正文提取。' } },
    { name: 'content', label: '正文', type: 'richText', required: true },
    { name: 'cover', label: '封面图片', type: 'upload', relationTo: 'media', admin: { position: 'sidebar' } },
    { name: 'coverTheme', label: '无封面时的配色', type: 'select', defaultValue: 'journal', options: [
      { label: '樱花粉 · 日常', value: 'journal' }, { label: '奶油黄 · 办公', value: 'office' }, { label: '淡紫色 · 音乐', value: 'music' },
    ], admin: { position: 'sidebar' } },
    { name: 'category', label: '分类', type: 'text', defaultValue: '记录日常', required: true, maxLength: 30, admin: { position: 'sidebar', description: '例如：记录日常、办公小记、生活灵感。' } },
    { name: 'tags', label: '标签', type: 'array', maxRows: 8, fields: [{ name: 'label', label: '标签名称', type: 'text', required: true, maxLength: 20 }], admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: '发布时间', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' }, description: '设为未来时间后，已发布文章将在该时间起对访客可见。' } },
    { name: 'slug', label: '文章网址标识', type: 'text', required: true, unique: true, index: true, maxLength: 100,
      validate: (value: unknown) => !value || (typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) || '请使用小写字母、数字和短横线。',
      admin: { position: 'sidebar', description: '留空自动生成；发布后建议保持不变。' } },
    { name: 'readingMinutes', label: '预计阅读分钟', type: 'number', min: 1, defaultValue: 1, admin: { position: 'sidebar', readOnly: true } },
    { name: 'sortOrder', label: '排列顺序', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: '数字越小越靠前，相同则按发布时间倒序。' } },
    { name: 'isSample', label: '示例文章', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'seo', label: '搜索引擎展示', type: 'group', fields: [
      { name: 'title', label: 'SEO 标题', type: 'text', maxLength: 80 },
      { name: 'description', label: 'SEO 简介', type: 'textarea', maxLength: 180 },
    ] },
    { name: 'searchText', type: 'textarea', admin: { hidden: true } },
  ],
}
