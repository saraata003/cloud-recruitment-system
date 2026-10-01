export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <div dir="ltr" className="inline-flex flex-col leading-none select-none">
      <span className={`font-extrabold tracking-tight text-brand ${big ? "text-4xl" : "text-2xl"}`}>DRINKAT</span>
      <span className={`font-extrabold italic text-accent -mt-1 ${big ? "text-3xl ps-8" : "text-lg ps-5"}`}>Pickup</span>
    </div>
  );
}
