import fs from "node:fs/promises";
import path from "node:path";

const MAX_CHARS = 6000;

/**
 * Best-effort text extraction from an uploaded PDF CV, used to enrich the AI
 * prompts. Returns null for non-PDF uploads (e.g. a photographed CV) or on
 * any parsing failure — callers always have the structured form fields to
 * fall back on, so this is purely additive.
 */
export async function extractCvText(cvUrl: string | null | undefined): Promise<string | null> {
  if (!cvUrl || !cvUrl.toLowerCase().endsWith(".pdf")) return null;

  let parser: { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } | null = null;
  try {
    const filePath = path.join(process.cwd(), "public", cvUrl);
    const buffer = await fs.readFile(filePath);
    const { PDFParse } = await import("pdf-parse");
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) return null;
    return text.slice(0, MAX_CHARS);
  } catch (err) {
    console.error("CV text extraction failed:", err);
    return null;
  } finally {
    await parser?.destroy().catch(() => {});
  }
}
