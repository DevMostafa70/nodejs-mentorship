require("dotenv").config();
const db = require("./knex");

async function migrate() {
  const exists = await db.schema.hasTable("news");
  if (!exists) {
    await db.schema.createTable("news", (t) => {
      t.increments("id").primary();
      t.string("title").notNullable();
      t.string("date_text").notNullable();
      t.string("url").notNullable().unique();
      t.integer("likes").notNullable().defaultTo(0);
      t.timestamp("created_at").defaultTo(db.fn.now());
    });
    console.log("✅ Created table: news");
  } else {
    console.log("ℹ️ Table already exists: news");
  }
  process.exit(0);
}

migrate().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
