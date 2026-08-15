import { createDatabase } from "./db-adapter.js";

const db = await createDatabase("foodbite.db");

db.exec(`
CREATE TABLE IF NOT EXISTS franchises(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  address TEXT,
  phone TEXT,
  commission_percent REAL DEFAULT 10,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS areas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  franchise_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  FOREIGN KEY(franchise_id) REFERENCES franchises(id)
);

CREATE TABLE IF NOT EXISTS commissions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  franchise_id INTEGER,
  shop_id INTEGER,
  amount REAL DEFAULT 0,
  percent REAL DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE shops ADD COLUMN franchise_id INTEGER;
ALTER TABLE shops ADD COLUMN area_id INTEGER;

ALTER TABLE users ADD COLUMN franchise_id INTEGER;
ALTER TABLE users ADD COLUMN area_id INTEGER;

ALTER TABLE orders ADD COLUMN franchise_id INTEGER;
ALTER TABLE orders ADD COLUMN commission_amount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0;
`);

console.log("Business v1 database migration completed.");
