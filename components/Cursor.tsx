"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function Cursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth cursor tracking
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Spring animations for smooth following
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Disable on touch devices
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0;

    if (isTouchDevice) {
      return;
    }

    // Track mouse position
    const updateMousePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    // Check if element is interactive
    const isInteractiveElement = (element: Element | null): boolean => {
      if (!element) return false;

      const interactiveTags = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];
      const interactiveClasses = ["card", "link", "hover:"];
      const interactiveRoles = ["button", "link"];

      // Check tag name
      if (interactiveTags.includes(element.tagName)) return true;

      // Check classes
      const classList = Array.from(element.classList);
      if (interactiveClasses.some((cls) => classList.some((c) => c.includes(cls)))) {
        return true;
      }

      // Check role
      const role = element.getAttribute("role");
      if (role && interactiveRoles.includes(role)) return true;

      // Check cursor style
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.cursor === "pointer") return true;

      return false;
    };

    // Handle hover state
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isInteractiveElement(target)) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    // Handle click animation
    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    // Hide cursor when leaving window
    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Add event listeners
    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  // Don't render on touch devices
  if (typeof window !== "undefined") {
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0;

    if (isTouchDevice) {
      return null;
    }
  }

  return (
    <>
      {/* Main cursor container */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          opacity: { duration: 0.2 },
        }}
      >
        {/* Cursor ring with gradient border */}
        <motion.div
          className="relative -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-[1.5px] transition-colors duration-200"
          style={{
            borderColor: isHovering ? "rgba(37, 99, 235, 0.8)" : "rgba(156, 163, 175, 0.6)",
            boxShadow: isHovering
              ? "0 0 12px rgba(37, 99, 235, 0.4)"
              : "0 0 6px rgba(156, 163, 175, 0.2)",
            background: isHovering
              ? "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)"
              : "transparent",
          }}
          animate={{
            scale: isHovering ? 1.2 : 1,
          }}
          transition={{
            scale: { duration: 0.2, ease: "easeOut" },
          }}
        >
          {/* Animated ball inside bubble */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{
              background: "linear-gradient(135deg, #facc15 0%, #2563eb 100%)",
              boxShadow: "0 0 6px rgba(37, 99, 235, 0.6)",
            }}
            animate={{
              x: isHovering 
                ? [0, 6, -6, 0] 
                : isClicking 
                ? [0, 4, -4, 0]
                : [0, 3, -3, 0],
              y: isHovering
                ? [0, -6, 6, 0]
                : isClicking
                ? [0, -4, 4, 0]
                : [0, -3, 3, 0],
              scale: isClicking ? [1, 1.3, 1] : 1,
            }}
            transition={{
              x: {
                duration: isHovering ? 2 : isClicking ? 0.6 : 3,
                ease: "easeInOut",
                repeat: Infinity,
              },
              y: {
                duration: isHovering ? 2 : isClicking ? 0.6 : 3,
                ease: "easeInOut",
                repeat: Infinity,
              },
              scale: {
                duration: 0.15,
                ease: "easeOut",
              },
            }}
          />
        </motion.div>
      </motion.div>

      {/* Click ripple animation */}
      {isClicking && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9998]"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
          }}
        >
          <motion.div
            className="relative -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2"
            style={{
              borderColor: "rgba(37, 99, 235, 0.6)",
            }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{
              scale: 2.5,
              opacity: 0,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          />
        </motion.div>
      )}
    </>
  );
}
