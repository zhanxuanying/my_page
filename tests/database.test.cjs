const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");

const migrationPath = "supabase/migrations/20260912000100_blog_posts.sql";

test("PostgreSQL enforces publication visibility and denies visitor mutations", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;",
    );
    await db.exec(fs.readFileSync(migrationPath, "utf8"));
    await db.exec(`INSERT INTO public.blog_posts (slug,title,body,published,published_at) VALUES
      ('private-draft','DRAFT SECRET','Private body',false,now()),
      ('future-post','FUTURE SECRET','Future body',true,now()+interval '1 day'),
      ('public-post','PUBLIC','Public body',true,now()-interval '1 day');`);

    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      const { rows } = await db.query(
        "SELECT slug FROM public.blog_posts ORDER BY slug",
      );
      assert.equal(rows.length, 4);
      assert.ok(rows.some((row) => row.slug === "public-post"));
      assert.ok(
        rows.every(
          (row) => !["private-draft", "future-post"].includes(row.slug),
        ),
      );
      for (const query of [
        "INSERT INTO public.blog_posts (slug,title,body) VALUES ('attack','Changed','Changed')",
        "UPDATE public.blog_posts SET title='Changed' WHERE slug='public-post'",
        "DELETE FROM public.blog_posts WHERE slug='public-post'",
        "TRUNCATE public.blog_posts",
      ])
        await assert.rejects(db.exec(query), (error) => error.code === "42501");
      await db.exec("RESET ROLE");
    }

    await db.exec(
      "UPDATE public.blog_posts SET published=false WHERE slug='public-post'; SET ROLE anon;",
    );
    assert.deepEqual(
      (
        await db.query(
          "SELECT * FROM public.blog_posts WHERE slug='public-post'",
        )
      ).rows,
      [],
    );
    await db.exec("RESET ROLE");
    await assert.rejects(
      db.exec(
        "INSERT INTO public.blog_posts (slug,title,body,cover_theme) VALUES ('bad-theme','A','B','html')",
      ),
      (error) => error.code === "23514",
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO public.blog_posts (slug,title,body) VALUES ('blank-title','  ','B')",
      ),
      (error) => error.code === "23514",
    );
    assert.equal(
      (
        await db.query(
          "SELECT title FROM public.blog_posts WHERE slug='public-post'",
        )
      ).rows[0].title,
      "PUBLIC",
    );
  } finally {
    await db.close();
  }
});
