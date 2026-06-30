"use client";

import type React from "react";
import { MotionConfig } from "framer-motion";

/**
 * Respects the user's "reduce motion" OS/browser setting: when set, framer-motion
 * skips transform/opacity animations. Improves accessibility and makes the UI
 * render deterministically for users who prefer less motion.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
