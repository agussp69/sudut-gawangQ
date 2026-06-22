import { Star } from "lucide-react";

export function RatingStars({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  const interactive = !!onChange;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const Cmp = interactive ? "button" : "span";
        return (
          <Cmp
            key={i}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange!(i) : undefined}
            className={interactive ? "cursor-pointer p-0.5" : "p-0.5"}
            aria-label={`${i} star`}
          >
            <Star
              width={size}
              height={size}
              className={filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
            />
          </Cmp>
        );
      })}
    </div>
  );
}
