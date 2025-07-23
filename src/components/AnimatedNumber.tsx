"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import React from "react";

export function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 20 });
  const rounded = useTransform(spring, latest => Math.round(latest));
  React.useEffect(() => { spring.set(value); }, [value]);
  return <motion.span>{rounded}</motion.span>;
} 