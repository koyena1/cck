"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselItem = {
  id: number;
  url: string;
  layout: "center" | "split";
  plainBackground?: boolean;
  heading: string;
  subheading?: string;
  description?: string;
};

const items: CarouselItem[] = [
  {
    id: 0,
    url: "/car.png",
    layout: "center",
    heading: "PROTECT YOUR BUSINESS & HOME NOW",
    subheading: "We guarantee you total safety and happiness",
  },
  {
    id: 1,
    url: "/car1.png",
    layout: "center",
    heading: "SAFETY & SECURITY",
    subheading: "AT YOUR FINGERTIPS",
    description:
      "Comprehensive security systems including intrusion detection, access control, video surveillance, fire detection, and 24/7 monitoring.",
  },
  {
    id: 2,
    url: "/car2.png",
    layout: "center",
    heading: "PROTECT YOUR BUSINESS & HOME NOW",
    subheading: "We guarantee you total safety and happiness",
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

  useEffect(() => {
    if (isDragging || items.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isDragging]);

  return (
    <div className="w-full h-[68vh] p-0 sm:h-[72vh] lg:h-[76vh]">
      <div className="h-full border-y border-slate-300/30 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.14)] lg:p-6">
        <div className="relative h-full overflow-hidden" ref={containerRef}>
          <motion.div
            className="flex h-full"
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
              <div
                key={item.id}
                className={`relative h-full w-full shrink-0 overflow-hidden rounded-2xl ${
                  item.plainBackground
                    ? "bg-white"
                    : item.layout === "center"
                    ? "bg-slate-900"
                    : "bg-slate-900"
                }`}
              >
                {!item.plainBackground && (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_45%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
                    <div className="absolute inset-0 backdrop-blur-[1px]" />
                  </>
                )}

                {item.layout === "center" ? (
                  <div
                    className={`absolute inset-0 ${
                      "bg-linear-to-r from-black/55 via-black/30 to-black/10"
                    }`}
                  />
                ) : null}

                {/* Heading layer removed as requested */}

                <Image
                  src={item.url}
                  alt={item.heading}
                  fill
                  priority={item.id === 0 || item.id === 1}
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className={`pointer-events-none select-none ${
                    item.layout === "center"
                      ? "object-cover object-center"
                      : "object-cover object-center"
                  }`}
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>

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
