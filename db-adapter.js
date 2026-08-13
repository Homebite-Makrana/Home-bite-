import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createDatabase(filename = "foodbite.db") {
  const DB_FILE = path.join(__dirname, filename);

  const SQL = await initSqlJs({
    locateFile: file =>
      path.join(__dirname, "node_modules", "sql.js", "dist", file)
  });

  const nativeDb = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();

  function save() {
    fs.writeFileSync(DB_FILE, Buffer.from(nativeDb.export()));
  }

  return {
    exec(sql) {
      nativeDb.run(sql);
      save();
    },

    prepare(sql) {
      return {
        get(...params) {
          const stmt = nativeDb.prepare(sql);
          try {
            stmt.bind(params);
            if (!stmt.step()) return undefined;
            return stmt.getAsObject();
          } finally {
            stmt.free();
          }
        },

        all(...params) {
          const stmt = nativeDb.prepare(sql);
          try {
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            return rows;
          } finally {
            stmt.free();
          }
        },

        run(...params) {
          const stmt = nativeDb.prepare(sql);
          try {
            stmt.bind(params);
            stmt.step();
          } finally {
            stmt.free();
          }

          const result = nativeDb.exec(
            "SELECT last_insert_rowid() AS id"
          );

          const lastInsertRowid =
            result.length && result[0].values.length
              ? Number(result[0].values[0][0])
              : 0;

          save();

          return { lastInsertRowid };
        }
      };
    }
  };
}
