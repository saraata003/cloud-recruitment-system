/* eslint-disable @next/next/no-img-element */

/** Product photo, or a clean emoji tile until a real photo is uploaded from /admin. */
export function ProductImage({
  src, emoji, alt, className = "", emojiSize = "text-5xl",
}: { src?: string; emoji?: string; alt: string; className?: string; emojiSize?: string }) {
  if (src) return <img src={src} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
  return (
    <div
      aria-label={alt}
      className={`flex items-center justify-center bg-gradient-to-br from-brand-light via-white to-accent-light ${className}`}
    >
      <span className={emojiSize}>{emoji || "🍽️"}</span>
    </div>
  );
}
