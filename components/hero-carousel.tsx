"use client"

export function HeroCarousel() {
  return (
    <>
      {/* Background Media Container */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          src="/Herosectionvid.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
    </>
  )
}