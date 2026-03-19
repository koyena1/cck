"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselItem = {
  id: number;
  url: string;
  title: string;
};

const items: CarouselItem[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1400&h=900&fit=crop",
    title: "Corporate security control center",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&h=900&fit=crop",
    title: "Modern glass building facade",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=1400&h=900&fit=crop",
    title: "Office tower at dusk",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1400&h=900&fit=crop",
    title: "Business district skyline",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=900&fit=crop",
    title: "Retail and monitoring zone",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1400&h=900&fit=crop",
    title: "Night city security coverage",
  },
];

export default function ThumbnailCarousel() {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (isDragging || !containerRef.current) {
      return;
    }

    const containerWidth = containerRef.current.offsetWidth || 1;
    const targetX = -index * containerWidth;

    animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  }, [index, x, isDragging]);

  return (
    <div className="w-full h-[68vh] p-0 sm:h-[72vh] lg:h-[76vh]">
      <div className="h-full border-y border-sky-300/20 bg-slate-950/85 p-4 shadow-[0_20px_80px_rgba(2,132,199,0.25)] backdrop-blur-sm lg:p-6">
        <div className="relative h-full overflow-hidden bg-slate-900" ref={containerRef}>
          <motion.div
            className="flex"
            drag="x"
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              const containerWidth = containerRef.current?.offsetWidth || 1;
              const offset = info.offset.x;
              const velocity = info.velocity.x;

              let newIndex = index;
              if (Math.abs(velocity) > 500) {
                newIndex = velocity > 0 ? index - 1 : index + 1;
              } else if (Math.abs(offset) > containerWidth * 0.3) {
                newIndex = offset > 0 ? index - 1 : index + 1;
              }

              setIndex(Math.max(0, Math.min(items.length - 1, newIndex)));
            }}
            style={{ x }}
          >
            {items.map((item) => (
              <div key={item.id} className="relative h-full w-full shrink-0">
                <Image
                  src={item.url}
                  alt={item.title}
                  fill
                  priority={item.id === 1}
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className="pointer-events-none select-none rounded-2xl object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center sm:px-8">
            <p className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-lg sm:text-5xl">
              Complete
            </p>
            <p className="text-3xl font-black uppercase tracking-wide text-sky-200 drop-shadow-lg sm:text-5xl">
              Security Solutions
            </p>
          </div>

          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-black shadow-lg transition-transform ${
              index === 0
                ? "cursor-not-allowed bg-white/50 opacity-40"
                : "bg-white/90 opacity-80 hover:scale-110 hover:opacity-100"
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled={index === items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className={`absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-black shadow-lg transition-transform ${
              index === items.length - 1
                ? "cursor-not-allowed bg-white/50 opacity-40"
                : "bg-white/90 opacity-80 hover:scale-110 hover:opacity-100"
            }`}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {index + 1} / {items.length}
          </div>
        </div>
      </div>
    </div>
  );
}
