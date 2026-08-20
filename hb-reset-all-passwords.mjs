import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import readline from "readline";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const users = [
  ["Food Bite Admin", "9999999999", "admin"],
  ["Marble Cafe Owner", "9000000001", "restaurant"],
  ["Food Bite Delivery", "9000000003", "delivery"],
  ["Heena", "9000000002", "restaurant"],
  ["Umar", "7240347696", "restaurant"],
  ["Arman", "8619362254", "customer"],
  ["HOME BITE Fresh Test", "9846095926", "customer"]
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hidden(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    let value = "";

    const onData = data => {
      const ch = data.toString();

      if (ch === "\n" || ch === "\r") {
        process.stdin.setRawMode?.(false);
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.exit(1);
      } else if (ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };

    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

try {
  console.log("========== HOME BITE ALL PASSWORD RESET ==========");
  console.log("Users, roles, shops, menus and orders will NOT be changed.");
  console.log("");

  for (const [name, phone, role] of users) {
    const found = await pool.query(
      "SELECT id FROM users WHERE phone=$1 AND role=$2",
      [phone, role]
    );

    if (found.rows.length !== 1) {
      console.log(`SKIPPED: ${name} (${phone}) — account not found`);
      continue;
    }

    let p1, p2;

    while (true) {
      p1 = await hidden(
        `New password for ${name} (${phone}) [min 6]: `
      );

      if (p1.length < 6) {
        console.log("Password must be at least 6 characters.");
        continue;
      }

      p2 = await hidden(`Confirm password for ${phone}: `);

      if (p1 === p2) break;

      console.log("Passwords do not match. Enter them again.");
    }

    const hash = bcrypt.hashSync(p1, 10);

    await pool.query(
      "UPDATE users SET password=$1 WHERE phone=$2 AND role=$3",
      [hash, phone, role]
    );

    console.log(`PASSWORD RESET = SUCCESS — ${name}`);
    console.log("");
  }

  console.log("========== ALL PASSWORD RESETS COMPLETE ==========");
} catch (e) {
  console.error("PASSWORD RESET ERROR:", e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
