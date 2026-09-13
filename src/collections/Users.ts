import type { CollectionConfig } from 'payload'
import { adminOnly, isAdmin } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users', labels: { singular: '管理员', plural: '管理员' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email'], group: '设置' },
  auth: {
    tokenExpiration: 7200, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    forgotPassword: { expiration: 3600000 },
  },
  access: { admin: ({ req }) => isAdmin(req.user), create: adminOnly, read: adminOnly, update: adminOnly, delete: () => false },
  // Custom endpoints precede built-ins and use Payload's own case-insensitive matcher.
  endpoints: [
    { path: '/first-register', method: 'post', handler: () => Response.json({ errors: [{ message: '本站不开放注册。' }] }, { status: 403 }) },
    { path: '/forgot-password', method: 'post', handler: () => Response.json({ errors: [{ message: '暂未启用邮件找回密码，请通过本机管理员工具重置。' }] }, { status: 503 }) },
  ],
  fields: [{ name: 'name', label: '显示名称', type: 'text', required: true, defaultValue: '占轩颖' }],
}
