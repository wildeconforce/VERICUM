"use client";

import { type ReactNode } from "react";
import {
  motion,
  type Variants,
  type HTMLMotionProps,
  useReducedMotion,
} from "framer-motion";

/* ─── Fade-in on scroll ─── */
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  direction?: "up" | "none" | "scale";
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: FadeInProps) {
  const prefersReduced = useReducedMotion();

  const variants =
    direction === "scale"
      ? scaleInVariants
      : direction === "up"
        ? fadeUpVariants
        : fadeInVariants;

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger children ─── */
const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Floating / Pulse decorative element ─── */
export function FloatingOrb({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className} />;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -12, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Counter animation ─── */
export function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {value}
      {suffix}
    </motion.span>
  );
}
