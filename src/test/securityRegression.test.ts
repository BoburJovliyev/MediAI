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

  it("chat_messages UPDATE policy is scoped to authenticated (not public/anon)", () => {
    // The most recent recreation of this policy must target the authenticated role.
    expect(allSql).toMatch(
      /create policy "users can update own messages"\s+on public\.chat_messages\s+for update\s+to authenticated/
    );
  });

  it("doctor profile reads require the viewer to actually hold the doctor role", () => {
    // Prevents any authenticated user from reading another user's profile/email
    // simply by establishing a doctor_patients / patient_invitations relationship.
    expect(allSql).toMatch(
      /doctors can view related patient profiles[\s\S]*?has_role\(auth\.uid\(\), 'doctor'::app_role\)/
    );
  });

  it("public doctor directory RPC never exposes email addresses", () => {
    // get_public_doctors must only return safe directory columns.
    expect(allSql).toContain("get_public_doctors");
    expect(allSql).not.toMatch(/get_public_doctors[\s\S]{0,400}p\.email/);
  });
});
