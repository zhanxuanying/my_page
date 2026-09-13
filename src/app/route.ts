import html from '@/generated/home'
export function GET() { return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }) }
