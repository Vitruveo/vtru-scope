// Creates the bridge receipt tables in the Neon database at DATABASE_URL.
// Usage: node --env-file=.env scripts/bridge-db-migrate.mjs
import { neon } from "@neondatabase/serverless";
import { SCHEMA } from "../src/lib/bridge/db.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const sql = neon(process.env.DATABASE_URL);
for (const stmt of SCHEMA) await sql.query(stmt);
console.log(`Applied ${SCHEMA.length} statements`);
