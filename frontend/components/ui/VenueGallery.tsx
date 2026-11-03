/* eslint-disable @next/next/no-img-element -- developer-owned static venue photos */
"use client";

import { useRef, useState } from "react";
import type { VenuePhoto } from "@/lib/venue-public";

/** Scroll-snap handles touch/swipe natively; arrows enhance mouse and keyboard use. */
export function VenueGallery({ photos }: { photos: VenuePhoto[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  if (!photos.length) return null;
  const show = (index: number) => {
    const target = Math.min(Math.max(index, 0), photos.length - 1);
    const element = track.current?.children[target] as HTMLElement | undefined;
    if (element && track.current) {
      track.current.scrollTo({ left: element.offsetLeft - track.current.offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    setCurrent(target);
  };
  function sync() {
    const node = track.current;
    if (!node) return;
    const at = Array.from(node.children).reduce((nearest, child, i) =>
      Math.abs((child as HTMLElement).offsetLeft - node.offsetLeft - node.scrollLeft) <
      Math.abs((node.children[nearest] as HTMLElement).offsetLeft - node.offsetLeft - node.scrollLeft)
        ? i : nearest, 0);
    setCurrent(at);
  }
  return <section className="venue-gallery" aria-label="Court photo gallery">
    <div className="venue-gallery-track" ref={track} onScroll={sync} tabIndex={0}
      aria-label="Swipe through photos of this venue" role="region">
      {photos.map((photo, i) => <figure key={photo.src} className="venue-gallery-slide">
        <img src={photo.src} alt={photo.alt} width={960} height={680}
          loading={i === 0 ? "eager" : "lazy"} decoding="async" />
        <figcaption>{photo.alt}</figcaption>
      </figure>)}
    </div>
    {photos.length > 1 && <div className="venue-gallery-controls">
      <span className="venue-gallery-count" role="status" aria-live="polite">
        {current + 1} / {photos.length} · Our courts
      </span>
      <div className="venue-gallery-arrows">
        <button type="button" aria-label="Previous court photo" disabled={current === 0}
          onClick={() => show(current - 1)}>←</button>
        <button type="button" aria-label="Next court photo" disabled={current === photos.length - 1}
          onClick={() => show(current + 1)}>→</button>
      </div>
    </div>}
  </section>;
}
