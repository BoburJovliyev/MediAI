// Shared validation for chat & media album uploads.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"];
export const ALLOWED_FILE_EXT = [
  ...ALLOWED_IMAGE_EXT,
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
  "mp3", "wav", "ogg", "webm", "mp4", "mov", "zip", "rar", "dcm",
];

const getExt = (name: string) => (name.split(".").pop() || "").toLowerCase();

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateUpload(file: File, type: "image" | "file"): ValidationResult {
  const ext = getExt(file.name);
  const allowed = type === "image" ? ALLOWED_IMAGE_EXT : ALLOWED_FILE_EXT;
  const maxBytes = type === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;

  if (type === "image" && !file.type.startsWith("image/") && !ALLOWED_IMAGE_EXT.includes(ext)) {
    return { ok: false, error: "Faqat rasm fayllarini yuklash mumkin" };
  }
  if (!allowed.includes(ext)) {
    return { ok: false, error: `Bu format qo'llab-quvvatlanmaydi (.${ext || "?"})` };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `Fayl hajmi ${Math.round(maxBytes / 1024 / 1024)} MB dan oshmasligi kerak` };
  }
  return { ok: true };
}
