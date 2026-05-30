"use client";

export default function ThumbnailCarousel() {
  return (
    <div className="w-full h-[78vh] p-0 sm:h-[84vh] lg:h-[90vh]">
      <div className="h-full border-y border-slate-300/30 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.14)] lg:p-6">
        <div className="relative h-full overflow-hidden rounded-2xl">
          <video
            src="/Herosectionvid.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </div>
    </div>
  );
}
