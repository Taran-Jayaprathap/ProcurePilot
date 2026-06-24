"use client";

import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(count, value, {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1]
    });

    const unsubscribe = rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest}${suffix}`;
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, decimals, isInView, prefix, rounded, suffix, value]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}
