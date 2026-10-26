import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

const PACES = {
  normal: { easing: "cubic-bezier(0.19, 1, 0.22, 1)", duration: "0.9s", stepMs: 90, risePx: 18 },
  slow: { easing: "var(--site-ease)", duration: "1.2s", stepMs: 300, risePx: 12 },
} as const;

type RevealVariant = "rise" | "fade";
type RevealPace = keyof typeof PACES;

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  order?: number;
  variant?: RevealVariant;
  pace?: RevealPace;
}

export function Reveal({
  children,
  as = "div",
  className,
  order = 0,
  variant = "fade",
  pace = "normal",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [fired, setFired] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const observe = useCallback(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setFired(true);
            observerRef.current?.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    observerRef.current.observe(node);
  }, [reducedMotion]);

  useEffect(() => {
    observe();
    return () => observerRef.current?.disconnect();
  }, [observe]);

  if (reducedMotion) {
    return createElement(as, { className, ref }, children);
  }

  const hidden = !fired;
  const { easing, duration, stepMs, risePx } = PACES[pace];
  const style: CSSProperties = {
    opacity: hidden ? 0 : 1,
    transform:
      variant === "rise" && hidden ? `translateY(${risePx}px)` : "translateY(0)",
    transitionProperty: "opacity, transform",
    transitionDuration: duration,
    transitionTimingFunction: easing,
    transitionDelay: `${order * stepMs}ms`,
    willChange: "opacity, transform",
  };

  return createElement(as, { className, ref, style }, children);
}
