import fs from "node:fs/promises";
import path from "node:path";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 8);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const CV_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

export class UploadError extends Error {}

async function saveFile(file: File, kind: "photos" | "cvs", allowedTypes: Set<string>): Promise<{ url: string; fileName: string }> {
  if (file.size === 0) {
    throw new UploadError("File is empty");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`File is too large (max ${MAX_UPLOAD_MB}MB)`);
  }
  if (!allowedTypes.has(file.type)) {
    throw new UploadError(`Unsupported file type: ${file.type || "unknown"}`);
  }

  const ext = EXT_BY_TYPE[file.type] || "bin";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", kind);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, uniqueName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return { url: `/uploads/${kind}/${uniqueName}`, fileName: file.name || uniqueName };
}

export function savePhoto(file: File) {
  return saveFile(file, "photos", PHOTO_TYPES);
}

export function saveCv(file: File) {
  return saveFile(file, "cvs", CV_TYPES);
}
