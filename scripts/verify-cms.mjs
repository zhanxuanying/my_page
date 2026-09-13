// Run deliberately against a configured site. Only creates/removes its own verification data.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
const base=process.env.CMS_TEST_URL || 'http://localhost:3000'
const email=process.env.CMS_ADMIN_EMAIL
if(!email) throw new Error('CMS_ADMIN_EMAIL is required; credentials are loaded from macOS Keychain.')
const password=execFileSync('security',['find-generic-password','-s','Xuanying writing admin','-a',email,'-w'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
const ua={'User-Agent':'Xuanying-CMS-Verification/1.0'}
let token, testPost, media, report=[]
async function request(path,{method='GET',body,auth=false,raw=false}={}) {
 const headers={...ua,...(auth?{Authorization:`JWT ${token}`}:{})}
 if(body && !(body instanceof FormData)) headers['Content-Type']='application/json'
 const r=await fetch(base+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)})
 const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=null}
 return {status:r.status,data,text:raw?text:undefined,headers:r.headers}
}
function check(ok,label,detail='') {assert.ok(ok,`${label}: ${detail}`);report.push(label);console.log(`PASS ${label}`)}
const rich=(text)=>({root:{type:'root',version:1,format:'',indent:0,direction:null,children:[{type:'paragraph',version:1,format:'',indent:0,direction:null,children:[{type:'text',version:1,text,format:0,detail:0,mode:'normal',style:''}]}]}})
try {
 const login=await request('/api/users/login',{method:'POST',body:{email,password}})
 check(login.status===200 && login.data?.token,'Administrator login',String(login.status));token=login.data.token
 check((await request('/api/users')).status===403,'Anonymous cannot list administrators')
 for (const endpoint of ['first-register','FIRST-REGISTER','first-register/','%66irst-register']) {
   const registration=await request(`/api/users/${endpoint}`,{method:'POST',body:{email:'blocked@example.invalid',password:'must-never-register'}})
   check(registration.status===403 && registration.data?.errors?.[0]?.message==='本站不开放注册。',`Public registration disabled: ${endpoint}`)
 }
 const baseline=await request('/api/notes');check(baseline.status===200 && baseline.data.posts.length>=3,'Migrated homepage notes are available')
 const ordered=await request('/api/posts?sort=sortOrder,-publishedAt,id&limit=3&depth=0')
 const middle=ordered.data.docs[1]
 const neighborPage=await request(`/blog/${middle.slug}`,{raw:true})
 check(neighborPage.status===200 && neighborPage.text.includes(`href="/blog/${ordered.data.docs[0].slug}" rel="prev"`) && neighborPage.text.includes(`href="/blog/${ordered.data.docs[2].slug}" rel="next"`),'Article navigation follows adjacent published posts')
 const slug=`verification-${randomUUID()}`
 let r=await request('/api/posts?draft=true',{method:'POST',auth:true,body:{title:'临时验证 · 草稿',slug,category:'验证专用',sortOrder:null,content:rich('PRIVATE DRAFT CONTENT'),publishedAt:new Date().toISOString(),_status:'draft'}})
 check(r.status===201 && r.data?.doc?.id,'Create a draft',String(r.status));testPost=r.data.doc.id
 check(r.data.doc.sortOrder===0,'Cleared sort order becomes zero for stable navigation')
 r=await request(`/api/posts/${testPost}`);check([403,404].includes(r.status),'Draft cannot be read anonymously')
 r=await request(`/api/posts/${testPost}?draft=true`);check([403,404].includes(r.status),'Draft query cannot bypass authorization')
 r=await request(`/api/posts/${testPost}`,{method:'PATCH',body:{title:'unauthorized'}});check(r.status===403,'Anonymous cannot update a post')
 r=await request('/api/posts',{method:'POST',body:{title:'unauthorized'}});check(r.status===403,'Anonymous cannot create a post')
 const form=new FormData();form.append('_payload',JSON.stringify({alt:'自动验证图片',caption:'上传验证后自动删除'}));form.append('file',new Blob([readFileSync('assets/bunny-hero.png')],{type:'image/png'}),`可爱的兔子 #${randomUUID()}.png`)
 r=await request('/api/media',{method:'POST',auth:true,body:form});check(r.status===201 && r.data?.doc?.url?.includes('/storage/v1/object/public/blog-media/'),'Chinese filename upload persisted in Supabase',String(r.status));media=r.data.doc.id
 const remote=await fetch(r.data.doc.url,{headers:ua,signal:AbortSignal.timeout(45000)});check(remote.ok && (await remote.arrayBuffer()).byteLength>100000,'Uploaded image can be read')
 r=await request(`/api/posts/${testPost}`,{method:'PATCH',auth:true,body:{title:'临时验证 · 公开版本',content:rich('PUBLISHED CONTENT'),cover:media,_status:'published'}});check(r.status===200,'Publish a draft',String(r.status))
 r=await request(`/api/posts/${testPost}`);check(r.status===200 && r.data.title==='临时验证 · 公开版本','Published article is public')
 r=await request(`/blog/${slug}`,{raw:true});check(r.status===200 && r.text.includes('PUBLISHED CONTENT') && r.text.includes('application/ld+json'),'Reader renders published rich text and SEO')
 r=await request(`/api/posts/${testPost}?draft=true`,{method:'PATCH',auth:true,body:{title:'临时验证 · 未发布修改',content:rich('PRIVATE UPDATED CONTENT'),_status:'draft'}});check(r.status===200,'Save unpublished edits')
 r=await request(`/api/posts/${testPost}`);check(r.status===200 && r.data.title==='临时验证 · 公开版本' && !JSON.stringify(r.data).includes('PRIVATE UPDATED CONTENT'),'Unpublished edits do not replace public content')
 r=await request(`/api/posts/${testPost}?draft=true`,{auth:true});check(r.data?.title==='临时验证 · 未发布修改','Admin sees latest draft')
 r=await request(`/api/posts/versions?where[parent][equals]=${testPost}`,{auth:true});check(r.status===200 && r.data.totalDocs>=2,'History versions are recorded')
 const versions=r.data.docs
 r=await request(`/api/posts/versions?where[parent][equals]=${testPost}`);check(r.status===403,'Anonymous cannot read history')
 const version=versions.find(v=>v.version?.title==='临时验证 · 公开版本')
 if(version) {r=await request(`/api/posts/versions/${version.id}`,{method:'POST',auth:true});check(r.status===200,'Restore an earlier version',String(r.status))}
 r=await request(`/api/posts/${testPost}`,{method:'PATCH',auth:true,body:{publishedAt:new Date(Date.now()+86400000).toISOString(),_status:'published'}});check(r.status===200,'Save a future publication date')
 r=await request(`/api/posts/${testPost}`);check([403,404].includes(r.status),'Future articles stay private until their publication date')
 r=await request(`/api/posts/${testPost}`,{method:'DELETE'});check(r.status===403,'Anonymous cannot delete articles')
 check((await request('/feed.xml',{raw:true})).text?.includes('<rss'),'RSS feed is available')
} finally {
 if(testPost && token) {const r=await request(`/api/posts/${testPost}`,{method:'DELETE',auth:true});console.log(`Cleanup verification article: ${r.status}`);assert.equal(r.status,200)}
 if(media && token) {const r=await request(`/api/media/${media}`,{method:'DELETE',auth:true});console.log(`Cleanup verification image: ${r.status}`);assert.equal(r.status,200)}
 writeFileSync('artifacts/cms-verification.json',JSON.stringify({site:base,checkedAt:new Date().toISOString(),checks:report},null,2))
}
console.log(`Completed ${report.length} CMS checks.`)
