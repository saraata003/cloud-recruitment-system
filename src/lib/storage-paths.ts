import path from "node:path";

/**
 * Root directory for uploaded photos/CVs. Lives outside `public/` on
 * purpose: Next.js's production server (`next start`) only serves files
 * that existed under `public/` at build time, so anything saved there at
 * runtime would silently 404 once deployed. Uploaded files are instead
 * streamed back by a dynamic route handler (see `app/uploads/[...path]`),
 * which reads the filesystem live on every request.
 *
 * Defaults to `./data/uploads`, next to the SQLite database. Set
 * STORAGE_DIR to relocate both onto a persistent volume in production
 * (e.g. a mounted disk on a host like Railway).
 */
export function getUploadsDir(): string {
  const base = process.env.STORAGE_DIR || path.join(process.cwd(), "data");
  return path.join(base, "uploads");
}
