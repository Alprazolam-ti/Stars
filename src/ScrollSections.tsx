import React, { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: 1, text: "Start scrolling" },
  { id: 2, text: "Cosmos Info Block 1" },
  { id: 3, text: "Cosmos Info Block 2" },
];

const FADE = 400;
const HOLD = 800;
const GAP = 200; 
const SMOOTHNESS = 0.08;

const SEGMENT = FADE + HOLD + FADE; 

export const ScrollSections: React.FC = () => {
  const smoothScroll = useRef(0);
  const scrollY = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    let raf: number;
    const animate = () => {
      smoothScroll.current +=
        (scrollY.current - smoothScroll.current) * SMOOTHNESS;

      setTick((t) => t + 1);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const totalHeight =
    SECTIONS.length * (SEGMENT + GAP) + SEGMENT;

  const computeStyle = (index: number) => {
    const scroll = smoothScroll.current;

    const start = index * (SEGMENT + GAP);
    const fadeInStart = start;
    const fadeInEnd = start + FADE;

    const holdStart = fadeInEnd;
    const holdEnd = holdStart + HOLD;

    const fadeOutStart = holdEnd;
    const fadeOutEnd = fadeOutStart + FADE;

    let opacity = 0;
    let scale = 0.2;

    if (scroll < fadeInStart) {
      opacity = 0;
      scale = 0.2;
    } else if (scroll < fadeInEnd) {
      // FADE-IN
      const t = (scroll - fadeInStart) / FADE;
      opacity = t;
      scale = 0.2 + t * 0.8;
    } else if (scroll < holdEnd) {
      // HOLD
      opacity = 1;
      scale = 1;
    } else if (scroll < fadeOutEnd) {
      // FADE-OUT
      const t = 1 - (scroll - fadeOutStart) / FADE;
      opacity = t;
      scale = 0.2 + t * 0.8;
    } else {
      opacity = 0;
      scale = 0.2;
    }

    return {
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      zIndex: SECTIONS.length - index,
    };
  };

  return (
    <div style={{ position: "relative", background: "black" }}>
      {SECTIONS.map((section, index) => {
        const style = computeStyle(index);
        return (
          <div
            key={section.id}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: style.transform,
              opacity: style.opacity,
              color: "white",
              fontSize: "3rem",
              textAlign: "center",
              pointerEvents: "none",
              zIndex: style.zIndex,
              transition: "transform 0.1s linear, opacity 0.1s linear",
            }}
          >
            {section.text}
          </div>
        );
      })}

      {/* скролл-контейнер */}
      <div style={{ height: `${totalHeight}px` }} />
    </div>
  );
};
