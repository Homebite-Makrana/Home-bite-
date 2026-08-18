import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const input = JSON.parse(process.argv[2] || "{}");
const url = process.env.DATABASE_URL || "";

if (!url.startsWith("postgres")) {
  throw new Error("DATABASE_URL missing or invalid");
}

function qmarks(sql) {
  let n = 0, out = "", quote = null, esc = false;

  for (const c of sql) {
    if (quote) {
      out += c;
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === quote) quote = null;
      continue;
    }

    if (c === "'" || c === '"' || c === "`") {
      quote = c;
      out += c;
    } else if (c === "?") {
      out += `$${++n}`;
    } else {
      out += c;
    }
  }

  return out;
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 15000
});

try {
  let sql = qmarks(input.sql || "");
  const params = input.params || [];

  if (input.mode === "run" &&
      /^\s*INSERT\s+INTO/i.test(sql) &&
      !/\bRETURNING\b/i.test(sql)) {
    sql += " RETURNING id";
  }

  const result = await pool.query(sql, params);

  console.log(JSON.stringify({
    rows: result.rows,
    rowCount: result.rowCount
  }));
} finally {
  await pool.end();
}
