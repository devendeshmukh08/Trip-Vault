import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const sql = neon(process.env.DATABASE_URL);
for (const stmt of readFileSync("schema.sql", "utf8").split(";").map(s => s.trim()).filter(Boolean)) await sql.query(stmt);
console.log("Schema ready ✔");
