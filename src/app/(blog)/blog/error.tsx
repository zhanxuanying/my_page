'use client'
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="empty-notes"><span>✳</span><h2>笔记暂时没能打开</h2><p>稍等一下，再来试试吧。</p><button onClick={reset} type="button">重新打开</button></section> }
