(function (root) {
  "use strict";

  const PAGE_SIZE = 6;
  const themes = {
    office: [
      "WORK SMARTER, LIVE SLOWER",
      "井井有条",
      "让工作轻一点",
      "plus",
      "＋",
      "check",
    ],
    music: [
      "A SOUNDTRACK FOR THE EVERYDAY",
      "留白时刻",
      "把时间调成慢速",
      "note",
      "♪",
      "music",
    ],
    journal: [
      "COLLECT THE LITTLE JOYS",
      "微小美好",
      "普通日子也值得记录",
      "flower",
      "✳",
      "heart",
    ],
  };

  function escapeHTML(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function parseConfig(config = {}) {
    const url = String(config.url || "")
      .trim()
      .replace(/\/$/, "");
    const publishableKey = String(config.publishableKey || "").trim();
    if (!url && !publishableKey) return null;
    if (
      !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) ||
      !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)
    ) {
      throw new Error("请配置 Supabase 项目 URL 和 publishable key。");
    }
    return { url, publishableKey };
  }

  // Only these simple text formats become markup; HTML and links stay literal text.
  function renderBody(body) {
    const blocks = [];
    let lines = [];
    let kind = "";
    function flush() {
      if (!lines.length) return;
      if (kind === "list")
        blocks.push(
          `<ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul>`,
        );
      else
        blocks.push(
          `<${kind === "quote" ? "blockquote" : "p"}>${lines.join("<br>")}</${kind === "quote" ? "blockquote" : "p"}>`,
        );
      lines = [];
    }
    for (const original of String(body).replace(/\r\n?/g, "\n").split("\n")) {
      const line = original.trim();
      if (!line) {
        flush();
        kind = "";
        continue;
      }
      if (/^#{1,3}\s+/.test(line)) {
        flush();
        kind = "";
        blocks.push(`<h3>${escapeHTML(line.replace(/^#{1,3}\s+/, ""))}</h3>`);
        continue;
      }
      const next = /^[-*]\s+/.test(line)
        ? "list"
        : /^>\s?/.test(line)
          ? "quote"
          : "paragraph";
      if (next !== kind) flush();
      kind = next;
      lines.push(
        escapeHTML(
          line.replace(
            kind === "list" ? /^[-*]\s+/ : kind === "quote" ? /^>\s?/ : /^$/,
            "",
          ),
        ),
      );
    }
    flush();
    return blocks.join("");
  }

  function renderCard(post) {
    const theme = Object.hasOwn(themes, post.cover_theme)
      ? post.cover_theme
      : "journal";
    const [label, title, caption, decoration, symbol, icon] = themes[theme];
    return `<button class="note-card" type="button" data-note="${escapeHTML(post.slug)}" aria-haspopup="dialog"><span class="note-cover cover-${theme}"><span class="cover-label">${label}</span><span class="cover-title">${title}<span class="cover-${decoration}" aria-hidden="true">${symbol}</span></span><span class="cover-bottom"><span>${caption}</span><svg class="icon" aria-hidden="true"><use href="#i-${icon}" /></svg></span></span><span class="note-category">${escapeHTML(post.category)} <span>· ${escapeHTML(post.reading_minutes)} 分钟阅读</span></span><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt)}</p><span class="note-read">翻开这篇笔记 <svg class="icon" aria-hidden="true"><use href="#i-up-right" /></svg></span></button>`;
  }

  async function loadPosts(
    rawConfig,
    offset = 0,
    request = root.fetch.bind(root),
  ) {
    const config = parseConfig(rawConfig);
    if (!config) throw new Error("Supabase 尚未配置。");
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new Error("无效的分页位置。");
    const url = new URL(`${config.url}/rest/v1/blog_posts`);
    url.search = new URLSearchParams({
      select:
        "slug,title,excerpt,category,cover_theme,body,reading_minutes,is_sample,published_at",
      published: "eq.true",
      order: "sort_order.asc,published_at.desc,slug.asc",
      offset: String(offset),
      limit: String(PAGE_SIZE + 1),
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await request(url.toString(), {
        headers: { apikey: config.publishableKey, Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`笔记读取失败（${response.status}）。`);
      const rows = await response.json();
      if (
        !Array.isArray(rows) ||
        rows.some(
          (post) =>
            !post ||
            ![
              "slug",
              "title",
              "excerpt",
              "category",
              "cover_theme",
              "body",
            ].every((key) => typeof post[key] === "string") ||
            !post.slug ||
            !post.title.trim() ||
            !Number.isInteger(post.reading_minutes) ||
            post.reading_minutes < 1 ||
            typeof post.is_sample !== "boolean",
        )
      ) {
        throw new Error("笔记数据格式不正确。");
      }
      return {
        posts: rows.slice(0, PAGE_SIZE),
        hasMore: rows.length > PAGE_SIZE,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const api = { escapeHTML, parseConfig, renderBody, renderCard, loadPosts };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.XuanyingBlog = Object.freeze(api);
})(globalThis);
