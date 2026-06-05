import { supabase } from "@/integrations/supabase/client";

// Bucket holding private chat attachments (files, voice, group media).
export const CHAT_MEDIA_BUCKET = "chat-media";

// Sign for 1 hour, but refresh from cache a little earlier to avoid edge expiry.
const SIGN_SECONDS = 60 * 60;
const CACHE_TTL_MS = 55 * 60 * 1000;

interface CacheEntry {
  url: string;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();

/**
 * A value is a private storage path (vs. a legacy/public absolute URL or a
 * local blob/data URL) when it has no scheme.
 */
export const isStoragePath = (value?: string | null): value is string =>
  !!value && !/^(https?:|blob:|data:)/i.test(value);

/** Get a cached, short-lived signed URL for a private storage object path. */
export async function getSignedUrl(path: string): Promise<string> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expires > now) return hit.url;

  const existing = inflight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(CHAT_MEDIA_BUCKET)
        .createSignedUrl(path, SIGN_SECONDS);
      if (error || !data?.signedUrl) return "";
      cache.set(path, { url: data.signedUrl, expires: now + CACHE_TTL_MS });
      return data.signedUrl;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, promise);
  return promise;
}

/** Resolve any stored media value to a usable URL (signs private paths). */
export async function resolveMediaUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (isStoragePath(value)) return (await getSignedUrl(value)) || null;
  return value;
}

/** Force a refresh of a single path's signed URL (e.g. on image load error). */
export function invalidateSignedUrl(path: string) {
  cache.delete(path);
}

/**
 * Resolve image_url / file_url for a batch of message-like rows in place,
 * replacing private storage paths with fresh signed URLs. Legacy public URLs
 * pass through untouched.
 */
export async function resolveMessageMedia<
  T extends { image_url?: string | null; file_url?: string | null }
>(rows: T[]): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => {
      const next = { ...row };
      if (isStoragePath(row.image_url)) next.image_url = await getSignedUrl(row.image_url!);
      if (isStoragePath(row.file_url)) next.file_url = await getSignedUrl(row.file_url!);
      return next;
    })
  );
}
