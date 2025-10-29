/**
 * Animation and Micro-interaction Utilities
 * Provides smooth transitions and visual feedback for status changes
 */

export const animationPresets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" },
  },

  // Slide animations
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3 },
  },

  // Scale animations
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2 },
  },

  // Pulse animation (for attention)
  pulse: {
    animate: {
      opacity: [1, 0.5, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },

  // Bounce animation (for loading)
  bounce: {
    animate: {
      y: [0, -10, 0],
    },
    transition: {
      duration: 1,
      repeat: Infinity,
    },
  },
};

/**
 * CSS class utilities for animations
 */
export const animationClasses = {
  // Status transition classes
  statusChange: "transition-all duration-300 ease-out",
  cardHover: "hover:shadow-md hover:-translate-y-1 transition-all duration-200",
  buttonPress: "active:scale-95 transition-transform duration-150",

  // Loading states
  loadingPulse: "animate-pulse",
  loadingSpinner: "animate-spin",

  // Attention grabbers
  highlight: "animate-pulse shadow-lg",
  bounce: "animate-bounce",
};

/**
 * Calculate delay for staggered animations
 */
export function getStaggerDelay(index: number, baseDelay: number = 0.05): number {
  return index * baseDelay;
}

/**
 * Generate CSS animation keyframes for status transitions
 */
export function generateStatusTransitionKeyframes(from: string, to: string): string {
  const transitions: Record<string, string> = {
    "pending->generating_lyrics": `
      0% { background-color: rgb(241, 245, 249); }
      50% { background-color: rgb(191, 219, 254); }
      100% { background-color: rgb(219, 234, 254); }
    `,
    "generating_lyrics->ready": `
      0% { background-color: rgb(219, 234, 254); }
      50% { background-color: rgb(209, 250, 229); }
      100% { background-color: rgb(209, 250, 229); }
    `,
    "ready->complete": `
      0% { background-color: rgb(209, 250, 229); }
      100% { background-color: rgb(240, 253, 244); }
    `,
    "error->retrying": `
      0% { background-color: rgb(254, 226, 226); }
      100% { background-color: rgb(254, 240, 242); }
    `,
  };

  const key = `${from}->${to}`;
  return transitions[key] || "";
}

/**
 * Get color for status with animation
 */
export function getStatusColorWithAnimation(status: string): {
  bg: string;
  border: string;
  text: string;
  animation?: string;
} {
  switch (status) {
    case "action_required":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        animation: "animate-pulse",
      };
    case "generating_lyrics":
    case "generating_music":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        animation: "animate-pulse",
      };
    case "ready":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
      };
    case "complete":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
      };
    case "failed":
      return {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        animation: "animate-pulse",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-700",
      };
  }
}

/**
 * Transition timing functions for smooth animations
 */
export const timingFunctions = {
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
};
