import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/storage-paths";

// Uploaded photos/CVs are served dynamically here rather than from the
// public/ folder — Next.js's production server only serves files that
// existed under public/ at build time, which would make every runtime
// upload 404 once deployed.

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".pdf": "application/pdf",
};

const SAFE_SEGMENT = /^[a-zA-Z0-9_.-]+$/;

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.length === 0 || segments.some((s) => s === ".." || s === "." || !SAFE_SEGMENT.test(s))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const uploadsRoot = path.resolve(getUploadsDir());
  const filePath = path.resolve(uploadsRoot, ...segments);

  if (filePath !== uploadsRoot && !filePath.startsWith(uploadsRoot + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
