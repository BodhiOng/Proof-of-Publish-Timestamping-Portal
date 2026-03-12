"use client";

import { useEffect, useState } from "react";

const DEFAULT_MOBILE_BREAKPOINT = 768;

export function useIsMobile(breakpoint = DEFAULT_MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [breakpoint]);

  return isMobile;
}