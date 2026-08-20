import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const {Pool}=pg;
const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:{rejectUnauthorized:false}
});

const users=await pool.query(
  "SELECT id,name,phone,role,password FROM users ORDER BY id"
);

function askHidden(question){
  return new Promise(resolve=>{
    process.stdout.write(question);
    let value="";
    process.stdin.setRawMode?.(true);
    process.stdin.resume();

    const onData=buf=>{
      const ch=buf.toString();
      if(ch==="\n" || ch==="\r"){
        process.stdin.setRawMode?.(false);
        process.stdin.off("data",onData);
        process.stdout.write("\n");
        resolve(value);
      }else if(ch==="\u0003"){
        process.stdin.setRawMode?.(false);
        process.stdin.off("data",onData);
        process.stdout.write("\n");
        process.exit(1);
      }else if(ch==="\u007f"){
        value=value.slice(0,-1);
      }else{
        value+=ch;
      }
    };

    process.stdin.on("data",onData);
  });
}

console.log("========== HOME BITE LOGIN VERIFICATION ==========");
console.log("Passwords are checked only. Nothing will be changed.");
console.log("");

let success=0;
let failed=0;

for(const u of users.rows){
  const p=await askHidden(
    `${u.name} (${u.phone}) password: `
  );

  const ok=bcrypt.compareSync(p,u.password);

  if(ok){
    console.log(`LOGIN VERIFY = SUCCESS — ${u.name} [${u.role}]`);
    success++;
  }else{
    console.log(`LOGIN VERIFY = FAILED — ${u.name} [${u.role}]`);
    failed++;
  }
  console.log("");
}

console.log("========== LOGIN VERIFICATION RESULT ==========");
console.log(`SUCCESS = ${success}`);
console.log(`FAILED  = ${failed}`);
console.log("===============================================");

await pool.end();
process.exit(failed===0 ? 0 : 1);
