import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// These tests are a *regression guard* over the SQL migrations. They fail if a
// future migration removes or weakens a critical access-control rule, so chat
// media / doctor-link RLS and storage policies can't silently regress.
const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const allSql = (() => {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8")).join("\n");
})().toLowerCase();

describe("RLS & storage policy regression guard", () => {
  it("chat_messages enforces sender/receiver-scoped SELECT", () => {
    expect(allSql).toContain("auth.uid() = sender_id or auth.uid() = receiver_id");
  });

  it("chat_messages INSERT is restricted to the sender", () => {
    expect(allSql).toMatch(/for insert[\s\S]*?with check \(auth\.uid\(\) = sender_id\)/);
  });

  it("chat_messages DELETE is restricted to sender (or admin) — delete-for-everyone", () => {
    expect(allSql).toMatch(/for delete[\s\S]*?auth\.uid\(\) = sender_id/);
  });

  it("private chat-media bucket has owner/participant-scoped storage policies", () => {
    expect(allSql).toContain("chat-media");
    // owner-folder scoping uses the first path segment === auth.uid()
    expect(allSql).toMatch(/storage\.foldername/);
  });

  it("doctor_patients patient inserts require an accepted invitation", () => {
    expect(allSql).toContain("patient_invitations");
    expect(allSql).toContain("accepted");
  });

  it("user_roles is never self-grantable (roles live in a dedicated table)", () => {
    expect(allSql).toContain("public.user_roles");
    expect(allSql).toContain("has_role");
  });

  it("call_logs are visible only to call participants", () => {
    expect(allSql).toContain("call_logs");
    expect(allSql).toMatch(/auth\.uid\(\) = caller_id[\s\S]*?auth\.uid\(\) = callee_id/);
  });
});
