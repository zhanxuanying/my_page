const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  parseConfig,
  renderBody,
  renderCard,
  loadPosts,
} = (() => {
  const vm = require("node:vm");
  const context = { module: { exports: {} }, fetch, URL, URLSearchParams, AbortController, AbortSignal, setTimeout, clearTimeout };
  vm.runInNewContext(require("node:fs").readFileSync(require("node:path").join(__dirname, "../blog.js"), "utf8"), context);
  return context.module.exports;
})();
const config = {
  url: "https://abcdefghijklmnopqrst.supabase.co",
  publishableKey: "sb_publishable_test123456789",
};
const post = {
  slug: "hello",
  title: "一篇笔记",
  excerpt: "摘要",
  category: "日常",
  cover_theme: "journal",
  body: "正文",
  reading_minutes: 2,
  is_sample: false,
};

test("homepage CMS requests link to full articles without credentials", async () => {
  const cmsURL = 'https://xuanying-homepage.xuanying-personal-homepage.workers.dev';
  const article = { ...post, article_url: `${cmsURL}/blog/hello` };
  let request;
  const result = await loadPosts({ cmsURL }, 6, async (url, options) => {
    request = { url: new URL(url), options };
    return new Response(JSON.stringify({ posts: [article], hasMore: false }));
  });
  assert.equal(request.url.pathname, '/api/notes');
  assert.equal(request.url.searchParams.get('offset'), '6');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.equal(request.options.headers.apikey, undefined);
  assert.equal(result.posts[0].title, post.title);
  assert.match(renderCard(result.posts[0]), /<a class="note-card" href="https:\/\/xuanying-homepage/);
  assert.throws(() => parseConfig({ cmsURL: 'https://attacker.example' }));
  await assert.rejects(() => loadPosts({ cmsURL }, 0, async () => new Response('{}')));
});

test("only a complete public-key configuration can enable remote mode", () => {
  assert.equal(parseConfig({ url: "", publishableKey: "" }), null);
  assert.deepEqual({ ...parseConfig({ ...config, url: config.url + "/" }) }, config);
  for (const bad of [
    { url: config.url },
    { publishableKey: config.publishableKey },
    { ...config, url: "https://attacker.example" },
    { ...config, url: config.url + "/other" },
    { ...config, url: "http://abcdefghijklmnopqrst.supabase.co" },
    { ...config, publishableKey: "sb_secret_do_not_publish" },
    { ...config, publishableKey: "eyJservice_role" },
  ])
    assert.throws(() => parseConfig(bad));
});

test("article markup remains text while supported formatting is rendered", () => {
  const html = renderBody(
    "第一行\n第二行\n\n## 小标题\n\n- 项目一\n- <img src=x onerror=alert(1)>\n\n> 一句引用\n\n<script>alert(1)</script>",
  );
  assert.match(html, /<h3>小标题<\/h3>/);
  assert.match(html, /<ul><li>项目一<\/li><li>&lt;img/);
  assert.match(html, /<blockquote>一句引用<\/blockquote>/);
  assert.match(html, /第一行<br>第二行/);
  assert.doesNotMatch(html, /<script|<img|onerror="/);
});

test("database titles and attributes cannot inject markup into cards", () => {
  const html = renderCard({
    ...post,
    slug: '" onclick="alert(1)',
    title: "<svg onload=alert(1)>",
    category: "<script>x</script>",
    cover_theme: 'music" onclick="x',
  });
  assert.doesNotMatch(html, /<script|<svg onload| onclick="/);
  assert.match(html, /&lt;svg onload/);
  assert.match(html, /cover-journal/);
});

test("API request uses the public key and provides a stable next page", async () => {
  let request;
  const rows = Array.from({ length: 7 }, (_, n) => ({
    ...post,
    slug: `post-${n}`,
  }));
  const result = await loadPosts(config, 6, async (url, options) => {
    request = { url: new URL(url), options };
    return new Response(JSON.stringify(rows), { status: 200 });
  });
  assert.equal(result.posts.length, 6);
  assert.equal(result.hasMore, true);
  assert.equal(result.posts[0].slug, "post-0");
  assert.equal(request.url.pathname, "/rest/v1/blog_posts");
  assert.equal(request.url.searchParams.get("published"), "eq.true");
  assert.equal(request.url.searchParams.get("offset"), "6");
  assert.equal(
    request.url.searchParams.get("order"),
    "sort_order.asc,published_at.desc,slug.asc",
  );
  assert.equal(request.options.headers.apikey, config.publishableKey);
  assert.equal(request.options.headers.Authorization, undefined);
  assert.equal(request.options.cache, "no-store");
});

test("an empty database stays empty without silently showing sample articles", async () => {
  const result = await loadPosts(config, 0, async () => new Response("[]"));
  assert.equal(result.posts.length, 0);
  assert.equal(result.hasMore, false);
});

test("network, permission, and malformed-data failures are exposed for retry", async () => {
  for (const response of [
    new Response("denied", { status: 401 }),
    new Response("{}"),
    new Response('[{"slug":"broken"}]'),
  ]) {
    await assert.rejects(() => loadPosts(config, 0, async () => response));
  }
  await assert.rejects(() =>
    loadPosts(config, 0, async () => {
      throw new Error("offline");
    }),
  );
});
