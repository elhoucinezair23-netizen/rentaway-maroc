"use client";

import { Star } from "lucide-react";
import { clsx } from "clsx";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };

export function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;

        return (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange?.(i + 1) : undefined}
            className={clsx(
              "relative",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
          >
            <Star
              className={clsx(
                sizeMap[size],
                filled || partial ? "text-amber-400 fill-amber-400" : "text-gray-300"
              )}
            />
            {partial && (
              <Star
                className={clsx(sizeMap[size], "absolute inset-0 text-amber-400 fill-amber-400")}
                style={{ clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
