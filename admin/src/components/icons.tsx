import type { ReactNode } from "react";

/* One stroke weight, one grid, currentColor throughout, so an icon takes the colour of the
   text beside it instead of needing its own rule. */
const SHAPES: Record<string, ReactNode> = {
  mark: <path d="M8 19V5h4.8a3.9 3.9 0 010 7.8H8.9M13 12.8L17 19" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  chevron: <path d="M9.5 5.5L16 12l-6.5 6.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  search: <path d="M11 4.8a6.2 6.2 0 010 12.4A6.2 6.2 0 0111 4.8zM15.5 15.5L20 20" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  check: <path d="M5 12.6l4.6 4.6L19 7.4" />,
  alert: <path d="M12 4.4l8.4 15H3.6l8.4-15zM12 9.8v4.2M12 16.6h.01" />,
  info: <path d="M12 3.6a8.4 8.4 0 110 16.8 8.4 8.4 0 010-16.8zM12 11v5.2M12 7.9h.01" />,
  up: <path d="M12 18.5V6M7 11l5-5 5 5" />,
  down: <path d="M12 5.5V18M7 13l5 5 5-5" />,
  dots: (
    <>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  today: <path d="M8 3v4M16 3v4M3.5 10.5h17M4.5 5.5h15a1.5 1.5 0 011.5 1.5v13a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V7a1.5 1.5 0 011.5-1.5zM12 14.5v3" />,
  appointments: <path d="M8 3v4M16 3v4M3.5 10.5h17M4.5 5.5h15a1.5 1.5 0 011.5 1.5v13a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V7a1.5 1.5 0 011.5-1.5zM9 15l2 2 4-4.2" />,
  posts: <path d="M4 20l4.6-1.1L20 7.4 16.6 4 5.1 15.4 4 20zM14.4 6.2l3.4 3.4" />,
  media: <path d="M4.5 5.5h15a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17V7a1.5 1.5 0 011.5-1.5zM9 11.2a1.4 1.4 0 010 2.6 1.4 1.4 0 010-2.6zM4.6 16.8l4.6-4 3.8 3.2 2.7-2.2 3.6 3" />,
  home: <path d="M4 10.6L12 4l8 6.6M6.2 9.4V20h11.6V9.4M10 20v-5.4h4V20" />,
  image: <path d="M4.5 5.5h15a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17V7a1.5 1.5 0 011.5-1.5zM8.4 11.1a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4.8 16.6l4.4-3.8 3.6 3 2.6-2.1 3.5 2.9" />,
  upload: <path d="M12 16.5V4.8M7.6 9.2L12 4.8l4.4 4.4M4.5 15v3.5A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5V15" />,
  trash: <path d="M5 7.5h14M9.5 7.5V5.2h5v2.3M6.6 7.5l.8 12a1.4 1.4 0 001.4 1.3h8.4a1.4 1.4 0 001.4-1.3l.8-12M10.4 11v6M13.6 11v6" />,
  press: <path d="M4 6.5h13.5a1.5 1.5 0 011.5 1.5v11.5a1.5 1.5 0 01-1.5 1.5H5.5A1.5 1.5 0 014 19.5zM19 10h1.5A1.5 1.5 0 0122 11.5V19a1.5 1.5 0 01-1.5 1.5M7 10h7M7 13.3h7M7 16.6h4.5" />,
  publications: <path d="M6.5 4.5H18a1.5 1.5 0 011.5 1.5v13.5H6.5A2.5 2.5 0 014 17V7a2.5 2.5 0 012.5-2.5zM4 16h15.5" />,
  faqs: <path d="M12 3.5a8.5 8.5 0 010 17 8.5 8.5 0 010-17zM9.6 9.5a2.5 2.5 0 014.9.7c0 1.6-2.5 1.8-2.5 3.5M12 17h.01" />,
  pages: <path d="M6.5 3.5H13l6 6v11H6.5zM13 3.5v6h6M9 13.5h6M9 17h4" />,
  analytics: <path d="M4 20.2h16M7.6 20v-6.4M12.2 20V6.6M16.8 20v-9.2" />,
  audit: <path d="M4.2 12A7.9 7.9 0 1112 20a7.9 7.9 0 01-5.6-2.3M4 8.2V4.4h3.8M12 7.8V12l3 1.9" />,
  staff: <path d="M9.5 5.3a3.2 3.2 0 110 6.4 3.2 3.2 0 010-6.4zM3.8 19.6c0-3.1 2.6-5.2 5.7-5.2s5.7 2.1 5.7 5.2M16.4 6.4a3 3 0 010 5.5M18.2 14.9c1.7.7 2.9 2.3 2.9 4.3" />,
  account: <path d="M12 5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM5 19.8c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6" />,
  logout: <path d="M14.5 4.5h-9A1.5 1.5 0 004 6v12a1.5 1.5 0 001.5 1.5h9M16 8.5L19.5 12 16 15.5M19.5 12H10" />,
  sun: <path d="M12 8.2a3.8 3.8 0 110 7.6 3.8 3.8 0 010-7.6zM12 2.6v2.2M12 19.2v2.2M4.3 12H2.1M21.9 12h-2.2M6.5 6.5L5 5M19 19l-1.5-1.5M17.5 6.5L19 5M5 19l1.5-1.5" />,
  moon: <path d="M19 14.8A7.8 7.8 0 019.2 5a7.9 7.9 0 109.8 9.8z" />,
};

export function Icon( { name, size = 20 }: { name: string; size?: number } ) {
  return (
    <svg
      className="ico"
      width={ size }
      height={ size }
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ 1.7 }
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      { SHAPES[ name ] ?? null }
    </svg>
  );
}

export function Brand( { label = "Clinic panel" }: { label?: string } ) {
  return (
    <p className="brand">
      <span className="brand-mark">
        <Icon name="mark" size={ 17 } />
      </span>
      <span className="brand-name">{ label }</span>
    </p>
  );
}
