import "dotenv/config";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HELPER = path.join(__dirname, "pg-query.js");

function query(mode, sql, params = []) {
  const r = spawnSync(
    process.execPath,
    [HELPER, JSON.stringify({mode, sql, params})],
    {
      encoding: "utf8",
      env: process.env,
      maxBuffer: 10 * 1024 * 1024
    }
  );

  if (r.error) throw r.error;

  if (r.status !== 0) {
    throw new Error(
      (r.stderr || r.stdout || "PostgreSQL query failed").trim()
    );
  }

  return JSON.parse(r.stdout || '{"rows":[],"rowCount":0}');
}

export async function createDatabase() {
  if (!(process.env.DATABASE_URL || "").startsWith("postgres")) {
    throw new Error("DATABASE_URL is missing or invalid");
  }

  return {
    // The production PostgreSQL schema was already created and migrated
    // in Phase 4. The old server.js contains SQLite CREATE TABLE syntax,
    // so do not execute that legacy startup schema against PostgreSQL.
    exec(sql) {
      return undefined;
    },

    prepare(sql) {
      return {
        get(...params) {
          return query("get", sql, params).rows[0];
        },

        all(...params) {
          return query("all", sql, params).rows;
        },

        run(...params) {
          const r = query("run", sql, params);
          return {
            lastInsertRowid: r.rows?.[0]?.id
              ? Number(r.rows[0].id)
              : 0,
            rowCount: r.rowCount || 0
          };
        }
      };
    }
  };
}
