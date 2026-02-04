"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A future-proof, accessible Slider component 
 * compatible with Turbopack and Next.js 16.
 */

interface SliderProps {
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}

const Slider = ({ 
  value, 
  min = 0, 
  max = 100, 
  step = 1, 
  onValueChange, 
  className 
}: SliderProps) => {
  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange([parseInt(e.target.value)])}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary transition-all hover:accent-primary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
    </div>
  );
};

export { Slider };