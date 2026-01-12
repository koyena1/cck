"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const slides = [
  {
    url: "/v2.mp4",
    type: "video",
    alt: "CCTV Security Camera Installation"
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    // Only set up the timer if there is more than one slide
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* Background Media Container */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide.type === "video" ? (
              <video
                src={slide.url}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={slide.url}
                alt={slide.alt}
                fill
                className="object-cover"
                priority={index === 0}
              />
            )}
          </div>
        ))}
      </div>

      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dots Indicator - Only show if there's more than one slide */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-purple-600 w-8"
                  : "bg-gray-400 w-2.5 hover:bg-gray-600"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </>
  )
}