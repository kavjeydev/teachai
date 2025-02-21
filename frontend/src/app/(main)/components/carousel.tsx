"use client";

import React, { useRef, useState } from "react";

interface SlideItem {
  id: number | string;
  title: string;
  description: string;
  imageUrl: string;
}

interface FullScreenCarouselProps {
  items: SlideItem[];
}

const FullScreenCarousel: React.FC<FullScreenCarouselProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Update currentIndex on scroll
   */
  const handleScroll = () => {
    if (!containerRef.current) return;

    const newIndex = Math.round(
      containerRef.current.scrollLeft / containerRef.current.clientWidth,
    );
    setCurrentIndex(newIndex);
  };

  /**
   * Scroll to the slide that corresponds to the dot clicked
   */
  const handleDotClick = (index: number) => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      left: index * containerRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-screen h-screen">
      {/* Scrolling container */}
      <div
        ref={containerRef}
        className="
          w-full h-full
        overflow-x-auto
        whitespace-nowrap
        scroll-smooth
        snap-x snap-mandatory
        hide-scrollbar
        "
        onScroll={handleScroll}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="
              inline-flex
              items-center justify-center
              w-screen h-screen
              snap-center
              flex-shrink-0
              relative
            "
          >
            {/* Background image covering the screen */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="object-cover bg-center w-full h-full"
            />
            {/* Overlay text (optional) */}
            <div className="absolute bottom-20 left-0 right-0 text-center text-white drop-shadow-md">
              <h2 className="text-3xl font-bold">{item.title}</h2>
              <p className="mt-2 text-xl">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dots (pagination) */}
      <div className="absolute flex justify-center gap-2 bottom-5 left-0 right-0">
        {items.map((_, index) => (
          <div
            key={index}
            onClick={() => handleDotClick(index)}
            className={`
              cursor-pointer
              h-3 w-3
              rounded-full
              border border-white
              ${index === currentIndex ? "bg-white" : "bg-transparent"}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default FullScreenCarousel;
