// Shared validation for chat, group & avatar uploads.
// Client-side mirror of the server-side bucket constraints (MIME + size).

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB (chat images)
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB (chat files) — matches chat-media bucket
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB — matches chat-files bucket
export const MAX_AVATAR_DIMENSION = 2048; // px, square-ish profile pictures
export const MAX_IMAGE_DIMENSION = 8000; // px, sane upper bound for chat images

export const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"];
export const ALLOWED_AVATAR_EXT = ["jpg", "jpeg", "png", "gif", "webp"];
export const ALLOWED_FILE_EXT = [
  ...ALLOWED_IMAGE_EXT,
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
  "mp3", "wav", "ogg", "webm", "mp4", "mov", "zip", "rar", "dcm",
];

// MIME allow-list (mirrors storage bucket allowed_mime_types).
export const ALLOWED_IMAGE_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/heic",
];
export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_FILE_MIME = [
  ...ALLOWED_IMAGE_MIME,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  "audio/webm", "audio/mpeg", "audio/wav", "audio/ogg",
  "video/mp4", "video/webm", "video/quicktime",
  "application/zip", "application/x-rar-compressed", "application/dicom",
];

const getExt = (name: string) => (name.split(".").pop() || "").toLowerCase();

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export type UploadKind = "image" | "file" | "avatar";

export function validateUpload(file: File, type: UploadKind): ValidationResult {
  const ext = getExt(file.name);

  const config = {
    image: { ext: ALLOWED_IMAGE_EXT, mime: ALLOWED_IMAGE_MIME, max: MAX_IMAGE_BYTES, imageOnly: true },
    avatar: { ext: ALLOWED_AVATAR_EXT, mime: ALLOWED_AVATAR_MIME, max: MAX_AVATAR_BYTES, imageOnly: true },
    file: { ext: ALLOWED_FILE_EXT, mime: ALLOWED_FILE_MIME, max: MAX_FILE_BYTES, imageOnly: false },
  }[type];

  if (config.imageOnly && file.type && !file.type.startsWith("image/")) {
    return { ok: false, error: "Faqat rasm fayllarini yuklash mumkin" };
  }
  if (!config.ext.includes(ext)) {
    return { ok: false, error: `Bu format qo'llab-quvvatlanmaydi (.${ext || "?"})` };
  }
  // Trust the browser-reported MIME when present; reject anything not allow-listed.
  if (file.type && !config.mime.includes(file.type)) {
    return { ok: false, error: `Bu fayl turi ruxsat etilmagan (${file.type})` };
  }
  if (file.size > config.max) {
    return { ok: false, error: `Fayl hajmi ${Math.round(config.max / 1024 / 1024)} MB dan oshmasligi kerak` };
  }
  if (file.size === 0) {
    return { ok: false, error: "Bo'sh fayllarni yuklab bo'lmaydi" };
  }
  return { ok: true };
}

/** Async image-dimension guard. Resolves ok=true for non-images. */
export async function validateImageDimensions(
  file: File,
  maxDimension: number
): Promise<ValidationResult> {
  if (!file.type.startsWith("image/")) return { ok: true };
  // HEIC can't be decoded in most browsers — skip dimension check.
  if (file.type === "image/heic") return { ok: true };
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth > maxDimension || img.naturalHeight > maxDimension) {
        resolve({ ok: false, error: `Rasm o'lchami ${maxDimension}px dan oshmasligi kerak` });
      } else {
        resolve({ ok: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "Rasmni o'qib bo'lmadi" });
    };
    img.src = url;
  });
}
