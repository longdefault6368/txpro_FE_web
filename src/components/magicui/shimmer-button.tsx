import React, { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#3b82f6",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "12px",
      background = "#136DEC",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] border border-blue-400/20",
          "transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(19,109,236,0.35)] active:scale-98",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* spark container */}
        <div className="absolute inset-0 z-0 overflow-hidden [border-radius:var(--radius)]">
          {/* spark */}
          <div className="absolute inset-[-100%] animate-[shimmer_var(--speed)_infinite_linear] [background:conic-gradient(from_calc(270deg-(var(--speed-multiplier,1)*90deg)),transparent,var(--shimmer-color),transparent_60%)]" />
        </div>

        {/* backdrop */}
        <div className="absolute inset-[1px] z-10 rounded-[calc(var(--radius)-1px)] bg-[var(--bg)] transition-colors duration-300 group-hover:bg-blue-700/80" />

        <div className="relative z-20 flex items-center justify-center gap-2 font-semibold">
          {children}
        </div>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
