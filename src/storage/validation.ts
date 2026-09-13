export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export function imageFilename(mimeType: string): string {
  const extension = ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' })[mimeType]
  if (!extension) throw new Error('不支持这种图片格式。')
  return `${crypto.randomUUID()}.${extension}`
}
export function storagePath(filename: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename)) throw new Error('图片文件名无效。')
  return encodeURIComponent(filename)
}
export function validateImage(file: { buffer: Buffer; mimeType: string; filesize: number }) {
  if (file.filesize > MAX_IMAGE_BYTES || file.buffer.length > MAX_IMAGE_BYTES) throw new Error('图片不能超过 5 MB。')
  const h = file.buffer
  const valid = {
    'image/png': h.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
    'image/jpeg': h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
    'image/gif': ['GIF87a','GIF89a'].includes(h.subarray(0, 6).toString()),
    'image/webp': h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP',
  }
  if (!valid[file.mimeType as keyof typeof valid]) throw new Error('请选择有效的 PNG、JPEG、WebP 或 GIF 图片。')
}
