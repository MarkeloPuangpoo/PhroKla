"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, SpringOptions } from "framer-motion";

/**
 * Props for the AnimatedNumber component.
 */
type AnimatedNumberProps = {
  /** The target number to animate to. */
  value: number;
  /**
   * Optional function to format the number for display.
   * Defaults to formatting with commas for thousands.
   * @example (value) => `${value.toFixed(2)}%`
   */
  formatter?: (value: number) => string;
  /**
   * Optional spring configuration for the animation.
   * @see https://www.framer.com/motion/use-spring/
   */
  springConfig?: SpringOptions;
  /** Optional className to apply to the motion.span element. */
  className?: string;
};

const defaultFormatter = (value: number) => Math.round(value).toLocaleString();

/**
 * A component that animates a number from a previous value to a new one.
 * It's configurable, performant, and looks great.
 */
export function AnimatedNumber({
  value,
  formatter = defaultFormatter,
  springConfig = { stiffness: 100, damping: 20, mass: 1 },
  className,
}: AnimatedNumberProps) {

  // Create a spring that will animate the number
  const spring = useSpring(value, springConfig);

  // Update the spring's "to" value whenever the `value` prop changes.
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  // Transform the spring value into a formatted string.
  // `useTransform` is more performant than re-rendering on every frame.
  const displayValue = useTransform(spring, (latest) => formatter(latest));

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}