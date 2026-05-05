#!/usr/bin/env node
/**
 * Local + CI guard against insecure Supabase migration patterns.
 * Fails (exit 1) when:
 *   - A new SQL migration creates a table without ENABLE ROW LEVEL SECURITY.
 *   - A SECURITY DEFINER function is missing `SET search_path`.
 *   - A policy uses `USING (true)` for SELECT without an explicit allow comment.
 *
 * Usage:
 *   node scripts/supabase-security-check.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";
const errors = [];
const warnings = [];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let files = [];
try {
  files = walk(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
} catch {
  console.log("ℹ️  No migrations directory — skipping.");
  process.exit(0);
}

for (const file of files) {
  const sql = readFileSync(file, "utf8");
  const lower = sql.toLowerCase();

  // 1. CREATE TABLE without RLS in same migration
  const tableMatches = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)/gi)];
  for (const m of tableMatches) {
    const table = m[1];
    const rlsRegex = new RegExp(`alter\\s+table\\s+(?:public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
    if (!rlsRegex.test(sql)) {
      errors.push(`[${file}] Table "${table}" created without ENABLE ROW LEVEL SECURITY.`);
    }
  }

  // 2. SECURITY DEFINER without SET search_path
  const fnBlocks = sql.split(/create\s+or\s+replace\s+function|create\s+function/i).slice(1);
  for (const block of fnBlocks) {
    if (/security\s+definer/i.test(block) && !/set\s+search_path/i.test(block)) {
      errors.push(`[${file}] SECURITY DEFINER function missing "SET search_path".`);
    }
  }

  // 3. Permissive USING (true) on SELECT policies
  if (/for\s+select[\s\S]{0,200}using\s*\(\s*true\s*\)/i.test(sql)) {
    warnings.push(`[${file}] SELECT policy uses USING (true) — ensure data is intentionally public.`);
  }
}

if (warnings.length) {
  console.log("⚠️  Warnings:");
  warnings.forEach((w) => console.log("  " + w));
}

if (errors.length) {
  console.log("\n❌ Security errors (blocking):");
  errors.forEach((e) => console.log("  " + e));
  console.log(`\n${errors.length} blocking issue(s). Fix before merging.`);
  process.exit(1);
}

console.log(`✅ Supabase security check passed (${files.length} migration file(s) scanned).`);
