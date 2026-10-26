import {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

const DURATION = "0.9s";
const EASING = "cubic-bezier(0.19, 1, 0.22, 1)";
const STAGGER_MS = 20;

interface SegmentedTextProps {
  children: string;
  as?: ElementType;
  className?: string;
  baseDelayMs?: number;
}

export function SegmentedText({
  children,
  as = "span",
  className,
  baseDelayMs = 0,
}: SegmentedTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [fired, setFired] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const words = useMemo(
    () => children.trim().split(/\s+/).filter(Boolean),
    [children],
  );

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
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
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

  const maskStyle: CSSProperties = {
    display: "inline-block",
    overflow: "hidden",
    verticalAlign: "top",
    paddingBottom: "0.12em",
    marginBottom: "-0.12em",
  };

  const interiorStyle = (index: number): CSSProperties => ({
    display: "inline-block",
    transform: fired ? "translateY(0)" : "translateY(115%)",
    transitionProperty: "transform",
    transitionDuration: DURATION,
    transitionTimingFunction: EASING,
    transitionDelay: `${baseDelayMs + index * STAGGER_MS}ms`,
    willChange: "transform",
  });

  const space = " ";
  const content: ReactNode = words.map((word, i) => (
    <Fragment key={i}>
      <span style={maskStyle}>
        <span style={interiorStyle(i)}>{word}</span>
      </span>
      {i < words.length - 1 ? space : null}
    </Fragment>
  ));

  return createElement(as, { className, ref }, content);
}
