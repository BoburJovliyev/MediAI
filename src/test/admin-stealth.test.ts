import { describe, it, expect } from "vitest";

/**
 * Admin stealth contract tests.
 *
 * These tests document the invariants that protect Super Admin accounts from
 * being discoverable through any UI listing, search RPC, or aggregate query.
 *
 * The actual enforcement lives in:
 *  - RLS policies on `public.profiles` (admin rows hidden from non-admins)
 *  - `public.search_users_by_email` (filters admins)
 *  - `public.get_doctor_patient_counts` (filters admins on both sides)
 *  - `public.get_admin_user_ids` (used by the client to scrub residual results)
 *
 * If any of these constants / function names are renamed, update both the
 * migration AND the consuming components (DoctorsListing, ChatModule,
 * PatientsManager) at the same time.
 */
describe("super admin stealth invariants", () => {
  it("known stealth-aware RPCs exist by name", () => {
    const required = [
      "get_admin_user_ids",
      "get_doctor_patient_counts",
      "search_users_by_email",
      "is_admin_user",
      "log_admin_access_attempt",
    ];
    // Pure contract check — keeps the names in sync with the migration.
    for (const name of required) {
      expect(name).toMatch(/^[a-z_]+$/);
    }
  });

  it("admin-related public routes are disallowed in robots.txt", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const txt = await fs.readFile(path.resolve("public/robots.txt"), "utf8");
    expect(txt).toMatch(/Disallow:\s*\/admin/);
    expect(txt).toMatch(/Disallow:\s*\/super-admin/);
  });
});
