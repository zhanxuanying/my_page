import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { storagePath, validateImage } from './validation'

export function supabaseStorage(options: { url: string; serviceKey: string; bucket: string; request?: typeof fetch }): Adapter {
  const { url, serviceKey, bucket, request = fetch } = options
  const base = `${url}/storage/v1/object`
  const publicURL = (filename: string) => `${base}/public/${bucket}/${storagePath(filename)}`
  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }
  return () => ({
    name: 'supabase-storage',
    generateURL: ({ filename }) => publicURL(filename),
    handleUpload: async ({ file }) => {
      validateImage(file)
      if (!serviceKey) throw new Error('图片存储尚未配置。')
      const response = await request(`${base}/${bucket}/${storagePath(file.filename)}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': file.mimeType, 'x-upsert': 'false', 'Cache-Control': 'max-age=31536000' },
        body: new Uint8Array(file.buffer), signal: AbortSignal.timeout(30000),
      })
      if (!response.ok) throw new Error(`图片上传失败（${response.status}），请重试。`)
    },
    handleDelete: async ({ filename }) => {
      const response = await request(`${base}/${bucket}`, {
        method: 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [filename] }), signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error(`图片删除失败（${response.status}），请重试。`)
    },
    staticHandler: async (_req, { params }) => Response.redirect(publicURL(params.filename), 302),
  })
}
