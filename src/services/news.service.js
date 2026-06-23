const db = require("../db/knex");

async function insertIgnoreDuplicates(items) {
  let inserted = 0;

  for (const it of items) {
    try {
      await db("news").insert(it);
      inserted++;
    } catch (e) {
      const msg = String(e.message || "").toLowerCase();
      if (!msg.includes("unique")) throw e;
    }
  }

  return { inserted };
}

async function listNews({ page = 1, limit = 10 }) {
  page = Number(page);
  limit = Number(limit);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1 || limit > 50) limit = 10;

  const offset = (page - 1) * limit;

  const [{ count }] = await db("news").count({ count: "*" });
  const total = Number(count);

  const rows = await db("news")
    .select("id", "title", "date_text", "url", "likes", "created_at")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function likeNews(id) {
  const updated = await db("news").where({ id }).increment("likes", 1);
  if (updated === 0) return null;
  return db("news").where({ id }).first();
}

module.exports = { insertIgnoreDuplicates, listNews, likeNews };
