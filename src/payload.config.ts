import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { zh } from '@payloadcms/translations/languages/zh'
import {
  lexicalEditor, ParagraphFeature, HeadingFeature, BoldFeature, ItalicFeature,
  UnderlineFeature, StrikethroughFeature, InlineCodeFeature, OrderedListFeature,
  UnorderedListFeature, BlockquoteFeature, LinkFeature, UploadFeature,
  HorizontalRuleFeature, FixedToolbarFeature, InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { Media } from './collections/Media'
import { supabaseStorage } from './storage/supabase'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const payloadSecret = process.env.PAYLOAD_SECRET || (process.env.PAYLOAD_BUILD === '1' ? 'build-only-placeholder-not-for-runtime-000000000000' : '')
if (!payloadSecret) throw new Error('PAYLOAD_SECRET must be configured before running the writing backend.')
let hyperdrive: { connectionString: string } | undefined
try {
  hyperdrive = (getCloudflareContext().env as unknown as { HYPERDRIVE?: typeof hyperdrive }).HYPERDRIVE
} catch { /* Local Next.js and migration commands use DATABASE_URL. */ }

export default buildConfig({
  serverURL: siteURL,
  secret: payloadSecret,
  admin: {
    theme: 'light',
    user: Users.slug, importMap: { baseDir: dirname },
    meta: { titleSuffix: ' · 轩颖的写作间', icons: [{ rel: 'icon', url: '/assets/favicon.svg' }] },
    components: {
      graphics: { Logo: '/components/AdminBrand#AdminBrand', Icon: '/components/AdminBrand#AdminIcon' },
      beforeDashboard: ['/components/AdminWelcome#AdminWelcome'],
      beforeLogin: ['/components/AdminWelcome#LoginWelcome'],
    },
  },
  i18n: { supportedLanguages: { zh }, fallbackLanguage: 'zh' },
  collections: [Posts, Media, Users],
  graphQL: { disable: true },
  email: () => ({
    name: 'email-disabled', defaultFromAddress: 'admin@example.invalid', defaultFromName: '轩颖的写作间',
    sendEmail: async () => { throw new Error('暂未启用邮件找回密码，请通过本机管理员工具重置。') },
  }),
  cors: [siteURL, 'https://zhanxuanying.github.io'],
  csrf: [siteURL],
  editor: lexicalEditor({ features: [
    ParagraphFeature(), HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(), ItalicFeature(), UnderlineFeature(), StrikethroughFeature(), InlineCodeFeature(),
    OrderedListFeature(), UnorderedListFeature(), BlockquoteFeature(),
    LinkFeature({ enabledCollections: ['posts'] }), UploadFeature({ collections: { media: { fields: [{ name: 'caption', label: '图片说明', type: 'text' }] } } }),
    HorizontalRuleFeature(), FixedToolbarFeature(), InlineToolbarFeature(),
  ] }),
  db: postgresAdapter({
    schemaName: 'payload', push: false, disableCreateDatabase: true,
    migrationDir: path.resolve(dirname, 'migrations'),
    pool: {
      connectionString: hyperdrive?.connectionString || process.env.DATABASE_URL,
      max: 3, maxUses: hyperdrive ? 1 : undefined, idleTimeoutMillis: 10000, connectionTimeoutMillis: 15000,
      ...(hyperdrive ? {} : { ssl: process.env.DATABASE_CA ? { ca: process.env.DATABASE_CA, rejectUnauthorized: true } : undefined }),
    },
  }),
  upload: { limits: { fileSize: 5 * 1024 * 1024 }, abortOnLimit: true },
  plugins: [cloudStoragePlugin({ collections: { media: {
    adapter: supabaseStorage({ url: process.env.SUPABASE_URL || '', serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '', bucket: 'blog-media' }),
    disableLocalStorage: true, disablePayloadAccessControl: true,
  } } })],
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  telemetry: false,
  // workerd has no Node stream filesystem for pino-pretty.
  logger: process.env.NODE_ENV === 'production' ? {
    level: 'warn', options: {}, child() { return this },
    trace() {}, debug() {}, info() {}, warn(message: unknown) { console.warn(message) },
    error(message: unknown) { console.error(message) }, fatal(message: unknown) { console.error(message) },
  } as never : undefined,
})
