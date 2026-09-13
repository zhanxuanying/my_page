import type { CollectionConfig } from 'payload'
import { adminOnly } from '../lib/access'
import { validateImage, imageFilename } from '../storage/validation'

export const Media: CollectionConfig = {
  slug: 'media', labels: { singular: '图片', plural: '图片库' },
  admin: { useAsTitle: 'alt', group: '创作', description: '上传封面或正文图片。图片属于公开素材，请勿上传私人文件。PNG / JPEG / WebP / GIF，最大 5 MB。' },
  access: { read: () => true, create: adminOnly, update: adminOnly, delete: adminOnly },
  upload: { mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], disableLocalStorage: true, crop: false, focalPoint: false },
  hooks: { beforeOperation: [({ args, operation }) => {
    if (['create','update'].includes(operation) && args.req?.file) {
      const f = args.req.file
      validateImage({ buffer: f.data, mimeType: f.mimetype, filesize: f.size })
      // Supabase object keys must be ASCII. Keep the user's description in alt/caption.
      f.name = imageFilename(f.mimetype)
    }
  }] },
  fields: [
    { name: 'alt', label: '图片描述', type: 'text', required: true, admin: { description: '用一句话描述图片，让每个人都能理解它。' } },
    { name: 'caption', label: '图片说明 / 来源', type: 'text' },
  ],
}
