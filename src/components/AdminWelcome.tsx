import React from 'react'
export function AdminWelcome() {
  return <section className="writing-welcome"><div><span className="writing-kicker">A LITTLE ROOM FOR YOUR WORDS</span><h1>今天，想记录些什么？</h1><p>留住一个念头，也留住一个平凡而美好的瞬间。</p><a className="writing-new" href="/admin/collections/posts/create">开始写一篇 →</a><a className="writing-visit" href="/blog" target="_blank" rel="noreferrer">看看我的博客 ↗</a></div><div className="writing-hint"><span>写作小贴士</span><p>正文里输入 <b>/</b>，插入标题、列表或图片。</p><p>草稿会自动保存；写好后，点击「发布」。</p><p>「版本」里可以找回之前的文字。</p></div></section>
}
export function LoginWelcome() { return <p className="writing-login-note">欢迎回来。在这里，安心写下你的日常。</p> }
