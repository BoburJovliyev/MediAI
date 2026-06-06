import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase client BEFORE importing the module under test.
const createSignedUrl = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrl }),
    },
  },
}));

import {
  isStoragePath,
  getSignedUrl,
  resolveMediaUrl,
  resolveMessageMedia,
  invalidateSignedUrl,
} from "@/lib/signedUrl";

beforeEach(() => {
  createSignedUrl.mockReset();
});

describe("isStoragePath", () => {
  it("treats scheme-less values as private storage paths", () => {
    expect(isStoragePath("user-123/photo.jpg")).toBe(true);
    expect(isStoragePath("abc/def/ghi.png")).toBe(true);
  });

  it("rejects absolute/public URLs and local blobs", () => {
    expect(isStoragePath("https://cdn.example.com/a.png")).toBe(false);
    expect(isStoragePath("http://x/y.png")).toBe(false);
    expect(isStoragePath("blob:abc")).toBe(false);
    expect(isStoragePath("data:image/png;base64,xxx")).toBe(false);
    expect(isStoragePath(null)).toBe(false);
    expect(isStoragePath(undefined)).toBe(false);
    expect(isStoragePath("")).toBe(false);
  });
});

describe("getSignedUrl", () => {
  it("signs a private path and caches the result (single network call)", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/one" }, error: null });

    const a = await getSignedUrl("u1/a.jpg");
    const b = await getSignedUrl("u1/a.jpg");

    expect(a).toBe("https://signed/one");
    expect(b).toBe("https://signed/one");
    // Cached: only one underlying request despite two calls.
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent inflight requests for the same path", async () => {
    let resolveFn: (v: any) => void = () => {};
    createSignedUrl.mockReturnValue(new Promise((r) => { resolveFn = r; }));

    const p1 = getSignedUrl("u2/b.jpg");
    const p2 = getSignedUrl("u2/b.jpg");
    resolveFn({ data: { signedUrl: "https://signed/two" }, error: null });

    expect(await p1).toBe("https://signed/two");
    expect(await p2).toBe("https://signed/two");
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("returns empty string when signing fails (unauthorized access)", async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: { message: "not allowed" } });
    const res = await getSignedUrl("u3/secret.jpg");
    expect(res).toBe("");
  });

  it("re-signs after invalidation", async () => {
    createSignedUrl
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed/v1" }, error: null })
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed/v2" }, error: null });

    const first = await getSignedUrl("u4/c.jpg");
    invalidateSignedUrl("u4/c.jpg");
    const second = await getSignedUrl("u4/c.jpg");

    expect(first).toBe("https://signed/v1");
    expect(second).toBe("https://signed/v2");
    expect(createSignedUrl).toHaveBeenCalledTimes(2);
  });
});

describe("resolveMediaUrl", () => {
  it("passes through legacy public URLs untouched (no signing)", async () => {
    const res = await resolveMediaUrl("https://public/avatar.png");
    expect(res).toBe("https://public/avatar.png");
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("signs private paths", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/x" }, error: null });
    const res = await resolveMediaUrl("uX/private.jpg");
    expect(res).toBe("https://signed/x");
  });

  it("returns null for empty values", async () => {
    expect(await resolveMediaUrl(null)).toBeNull();
    expect(await resolveMediaUrl(undefined)).toBeNull();
  });
});

describe("resolveMessageMedia", () => {
  it("signs private image/file paths but leaves public URLs alone", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/media" }, error: null });

    const rows = [
      { id: "1", image_url: "owner/img.jpg", file_url: null },
      { id: "2", image_url: null, file_url: "https://public/doc.pdf" },
    ];
    const out = await resolveMessageMedia(rows as any);

    expect(out[0].image_url).toBe("https://signed/media");
    expect(out[1].file_url).toBe("https://public/doc.pdf");
  });
});
