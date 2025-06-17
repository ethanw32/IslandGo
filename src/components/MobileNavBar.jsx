import React, { useRef, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "../lib/utils";

export const MobileNavBar = ({ items }) => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemRefs = useRef([]);
  const x = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 300 };
  const smoothX = useSpring(x, springConfig);

  useEffect(() => {
    const currentPath = location.pathname;
    const foundIndex = items.findIndex(item => item.href === currentPath);
    setActiveIndex(foundIndex);
  }, [location.pathname, items]);

  useEffect(() => {
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      const activeItem = itemRefs.current[activeIndex];
      const itemCenter = activeItem.offsetLeft + activeItem.offsetWidth / 2;
      x.set(itemCenter);
    }
  }, [activeIndex, x]);

  const pathData = useTransform(smoothX, (currentX) => {
    const waveWidth = 60;
    const waveHeight = 20;
    const waveOffsetY = 45; // Adjusted to bring the wave up and make it visible

    const startX = currentX - waveWidth / 2;
    const endX = currentX + waveWidth / 2;

    const cp1x = startX + waveWidth * 0.2;
    const cp1y = waveOffsetY;
    const cp2x = startX + waveWidth * 0.8;
    const cp2y = waveOffsetY - waveHeight; // Adjusted to make the wave curve upwards

    return `M 0 ${waveOffsetY} L ${startX} ${waveOffsetY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${waveOffsetY} L 500 ${waveOffsetY} L 500 64 L 0 64 Z`; // Updated ending Y coordinate to 64
  });

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around bg-black text-white z-50 md:hidden overflow-hidden")}> {/* Ensures nav bar background is black and default text is white */}
      {/* Removed motion.svg for the wave */}
      {items.map((item, idx) => (
        <motion.a
          ref={el => itemRefs.current[idx] = el}
          href={item.href}
          key={item.title}
          className={cn(
            "relative flex flex-col items-center justify-center h-full w-full z-10",
            { "text-black": idx === activeIndex, "text-neutral-400": idx !== activeIndex } // Active text black, inactive text neutral-400
          )}
          initial={false}
          animate={{ scale: idx === activeIndex ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            className={cn("relative h-10 w-10 rounded-full flex items-center justify-center",
              { "bg-black": idx === activeIndex }
            )}
            initial={false}
            animate={{ y: idx === activeIndex ? 0 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={cn("h-6 w-6 relative z-20", { "text-white": idx === activeIndex, "text-neutral-400": idx !== activeIndex })}>{item.icon}</div>
            {/* <span className="text-xs mt-1 relative z-20">{item.title}</span> */}
          </motion.div>
        </motion.a>
      ))}
    </div>
  );
}; 