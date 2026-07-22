const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
}

export interface ValidationResult {
  ext: string;
  sanitized: string;
}

export function validateImageUpload(file: File): ValidationResult {
  if (!file.size || file.size <= 0) {
    throw new UploadError("Fichier vide.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(`Le fichier ne doit pas dépasser ${MAX_FILE_SIZE / 1024 / 1024} Mo.`);
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new UploadError("Type de fichier image non autorisé. Formats acceptés : JPEG, PNG, WebP, AVIF.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new UploadError("Extension de fichier image non autorisée.");
  }
  return { ext, sanitized: sanitizeFilename(file.name) };
}

export function validateDocumentUpload(file: File): ValidationResult {
  if (!file.size || file.size <= 0) {
    throw new UploadError("Fichier vide.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(`Le fichier ne doit pas dépasser ${MAX_FILE_SIZE / 1024 / 1024} Mo.`);
  }
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    throw new UploadError("Type de fichier document non autorisé. Formats acceptés : JPEG, PNG, WebP, PDF.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    throw new UploadError("Extension de fichier document non autorisée.");
  }
  return { ext, sanitized: sanitizeFilename(file.name) };
}
