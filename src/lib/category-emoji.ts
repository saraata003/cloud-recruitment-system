import type { Category } from "./types";

/** Category `image` can be a photo URL or an emoji. */
export const isImageUrl = (s: string) => s.startsWith("/") || s.startsWith("http");
export const categoryEmoji = (categories: Category[], id: string) => {
  const img = categories.find((c) => c.id === id)?.image || "";
  return isImageUrl(img) ? "🍽️" : img;
};
