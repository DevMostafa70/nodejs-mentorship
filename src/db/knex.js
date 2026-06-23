const knex = require("knex");
const path = require("path");

const dbFile = process.env.DATABASE_FILE || "./data.sqlite";

module.exports = knex({
  client: "sqlite3",
  connection: {
    filename: path.resolve(dbFile),
  },
  useNullAsDefault: true,
});
