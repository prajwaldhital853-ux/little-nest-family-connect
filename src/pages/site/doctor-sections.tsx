import type { ComponentType, CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, MapPin, Menu, Phone, Quote, X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SitePhoto } from "./media";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function useInView<T extends HTMLElement>( threshold = 0.25 ) {
  const ref = useRef<T>( null );
  const [ inView, setInView ] = useState( false );
  useEffect( () => {
    const node = ref.current;
    if ( !node ) return;
    if ( window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches ) {
      setInView( true );
      return;
    }
    const io = new IntersectionObserver( ( [ entry ] ) => {
      if ( entry.isIntersecting ) {
        setInView( true );
        io.disconnect();
      }
    }, { threshold } );
    io.observe( node );
    return () => io.disconnect();
  }, [ threshold ] );
  return { ref, inView };
}

function SmartLink( { href, className, children, onClick }: { href: string; className?: string; children: ReactNode; onClick?: () => void } ) {
  if ( href.startsWith( "/" ) ) {
    return <Link to={ href } className={ className } onClick={ onClick }>{ children }</Link>;
  }
  return <a href={ href } className={ className } onClick={ onClick } target={ href.startsWith( "http" ) ? "_blank" : undefined } rel={ href.startsWith( "http" ) ? "noreferrer" : undefined }>{ children }</a>;
}

export function DrButton( { href, children, tone = "yellow", className }: { href: string; children: ReactNode; tone?: "yellow" | "black" | "ghost"; className?: string } ) {
  return (
    <SmartLink href={ href } className={ cn( "dr-btn text-small", `dr-btn-${ tone }`, className ) }>
      <span>{ children }</span>
      { tone === "ghost" ? <ArrowRight aria-hidden className="dr-btn-icon" /> : <ArrowUpRight aria-hidden className="dr-btn-icon" /> }
    </SmartLink>
  );
}

/* ------------------------------------------------------------------ */
/* Header (SS3) with top strip (SS1)                                   */
/* ------------------------------------------------------------------ */

export interface DrHeaderLink { label: string; href: string }

export function DoctorHeader( { name, role, strip, place, links, phone, cta }: {
  name: string;
  role: string;
  strip: string;
  place: string;
  links: DrHeaderLink[];
  phone: { label: string; href: string };
  cta: DrHeaderLink;
} ) {
  const [ open, setOpen ] = useState( false );
  const [ scrolled, setScrolled ] = useState( false );

  useEffect( () => {
    const onScroll = () => setScrolled( window.scrollY > 12 );
    onScroll();
    window.addEventListener( "scroll", onScroll, { passive: true } );
    return () => window.removeEventListener( "scroll", onScroll );
  }, [] );

  useEffect( () => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [ open ] );

  return (
    <header className={ cn( "dr-header", scrolled && "is-scrolled" ) }>
      <div className="dr-strip text-small">
        <span>{ strip }</span>
        <span className="dr-strip-place"><MapPin aria-hidden className="size-3.5" />{ place }</span>
      </div>
      <div className="dr-bar">
        <nav aria-label="Primary" className="dr-nav">
          { links.map( link => (
            <SmartLink key={ link.href } href={ link.href } className="dr-nav-link dr-meta text-small">{ link.label }</SmartLink>
          ) ) }
        </nav>
        <Link to="/" className="dr-brand">
          <span className="dr-brand-name">{ name }</span>
          <span className="dr-brand-role dr-meta text-small">{ role }</span>
        </Link>
        <div className="dr-actions">
          <a href={ phone.href } className="dr-call dr-meta text-small"><Phone aria-hidden className="size-4" /><span>{ phone.label }</span></a>
          <SmartLink href={ cta.href } className="dr-pill dr-meta text-small">{ cta.label }</SmartLink>
          <button type="button" className="dr-menu-btn" aria-label={ open ? "Close menu" : "Open menu" } aria-expanded={ open } onClick={ () => setOpen( v => !v ) }>
            { open ? <X aria-hidden /> : <Menu aria-hidden /> }
          </button>
        </div>
      </div>
      <div className={ cn( "dr-drawer", open && "is-open" ) } aria-hidden={ !open }>
        <nav aria-label="Menu" className="flex flex-col gap-1">
          { [ ...links, cta ].map( ( link, i ) => (
            <SmartLink key={ link.href + i } href={ link.href } onClick={ () => setOpen( false ) } className="dr-drawer-link text-h3" >
              { link.label }
            </SmartLink>
          ) ) }
        </nav>
        <a href={ phone.href } className="dr-call dr-meta text-small"><Phone aria-hidden className="size-4" />{ phone.label }</a>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero (SS1)                                                          */
/* ------------------------------------------------------------------ */

export function DoctorHero( { eyebrow, title, lede, primary, secondary, ticks, photo, bandTitle, bandItems }: {
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  primary: DrHeaderLink;
  secondary: DrHeaderLink;
  ticks: string[];
  photo: SitePhoto;
  bandTitle: ReactNode;
  bandItems: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string }[];
} ) {
  return (
    <section className="dr-hero" data-header="solid">
      <div className="dr-hero-inner">
        <div className="dr-hero-copy">
          <p className="dr-eyebrow text-small dr-in" style={ { "--d": "0ms" } as CSSProperties }><span className="dr-dot" aria-hidden />{ eyebrow }</p>
          <h1 className="dr-hero-title text-h1 dr-in" style={ { "--d": "120ms" } as CSSProperties }>{ title }</h1>
          <p className="dr-hero-lede text-large dr-in" style={ { "--d": "260ms" } as CSSProperties }>{ lede }</p>
          <div className="dr-hero-actions dr-in" style={ { "--d": "380ms" } as CSSProperties }>
            <DrButton href={ primary.href }>{ primary.label }</DrButton>
            <DrButton href={ secondary.href } tone="ghost">{ secondary.label }</DrButton>
          </div>
          <ul className="dr-ticks text-small dr-in" style={ { "--d": "500ms" } as CSSProperties }>
            { ticks.map( t => <li key={ t }><Check aria-hidden className="size-4" />{ t }</li> ) }
          </ul>
        </div>
        <div className="dr-hero-photo" aria-hidden={ false }>
          <div className="dr-hero-sun" aria-hidden />
          <img src={ photo.src } alt={ photo.alt } fetchPriority="high" />
        </div>
      </div>
      <div className="dr-band">
        <p className="dr-band-title text-large">{ bandTitle }</p>
        <ul className="dr-band-list">
          { bandItems.map( ( { icon: Icon, label }, i ) => (
            <li key={ label } className="text-small" style={ { "--d": `${ 700 + i * 120 }ms` } as CSSProperties }>
              <Icon aria-hidden className="size-6" />{ label }
            </li>
          ) ) }
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Centred intro with signature (SS2)                                  */
/* ------------------------------------------------------------------ */

export function NamasteIntro( { eyebrow, title, body, name, credentials, marks }: {
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  name: string;
  credentials: string;
  marks?: string[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-namaste", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ eyebrow }</p>
      <h2 className="dr-namaste-title text-h1">{ title }</h2>
      <div className="dr-namaste-body text-h4">{ body }</div>
      <span className="dr-sign-line" aria-hidden />
      <p className="dr-sign-name dr-meta text-large">{ name }</p>
      <p className="dr-sign-cred text-small">{ credentials }</p>
      { marks && (
        <ul className="dr-marks dr-meta text-small" aria-label="Trained and trusted at">
          { marks.map( m => <li key={ m }>{ m }</li> ) }
        </ul>
      ) }
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Journey with icons and dots (SS4)                                   */
/* ------------------------------------------------------------------ */

export interface JourneyStep {
  id: string;
  title: string;
  text: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  tone: "yellow" | "black" | "red";
}

export function CareJourney( { kicker, title, lede, steps }: { kicker: string; title: ReactNode; lede?: ReactNode; steps: JourneyStep[] } ) {
  const { ref, inView } = useInView<HTMLElement>( 0.3 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-journey", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="m-0 text-h2">{ title }</h2>
      { lede && <p className="dr-journey-lede text-large">{ lede }</p> }
      <ol className="dr-journey-list" style={ { "--n": steps.length } as CSSProperties }>
        <span className="dr-journey-track" aria-hidden />
        { steps.map( ( { id, title: stepTitle, text, icon: Icon, tone }, i ) => (
          <li key={ id } className={ cn( "dr-journey-step", `tone-${ tone }` ) } style={ { "--i": i } as CSSProperties }>
            <span className="dr-journey-icon"><Icon aria-hidden strokeWidth={ 1.3 } className="size-16" /></span>
            <span className="dr-journey-dot" aria-hidden />
            <h3 className="dr-journey-title text-large">{ stepTitle }</h3>
            <p className="dr-journey-text text-small">{ text }</p>
          </li>
        ) ) }
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Split: why it matters + quote card + portrait (SS5)                 */
/* ------------------------------------------------------------------ */

export function WhyItMatters( { kicker, title, body, items, quote, quoteName, quotePlace, quoteRole, quoteLink, photo }: {
  kicker: string;
  title: ReactNode;
  body: ReactNode;
  items: { icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>; label: string }[];
  quote: ReactNode;
  quoteName: string;
  quotePlace: string;
  quoteRole: string;
  quoteLink: DrHeaderLink;
  photo: SitePhoto;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-why", inView && "is-in" ) }>
      <div className="dr-why-copy">
        <p className="dr-kicker text-small">{ kicker }</p>
        <h2 className="m-0 text-h2">{ title }</h2>
        <div className="dr-why-body text-large">{ body }</div>
        <ul className="dr-why-items">
          { items.map( ( { icon: Icon, label }, i ) => (
            <li key={ label } style={ { "--i": i } as CSSProperties }>
              <Icon aria-hidden strokeWidth={ 1.2 } className="size-14" />
              <span className="dr-meta text-small">{ label }</span>
            </li>
          ) ) }
        </ul>
      </div>
      <div className="dr-why-panel">
        <figure className="dr-why-card">
          <Quote aria-hidden className="dr-why-quote-mark" />
          <blockquote className="m-0 text-large">{ quote }</blockquote>
          <figcaption>
            <span className="dr-why-name text-h4">{ quoteName }</span>
            <span className="text-small">{ quotePlace }</span>
            <span className="text-small dr-why-role">{ quoteRole }</span>
          </figcaption>
          <SmartLink href={ quoteLink.href } className="dr-why-link text-small">{ quoteLink.label }<ArrowRight aria-hidden className="size-4" /></SmartLink>
        </figure>
        <img className="dr-why-photo" src={ photo.src } alt={ photo.alt } loading="lazy" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Numbered feature list with visuals (value section)                  */
/* ------------------------------------------------------------------ */

export function FeatureRows( { kicker, title, features }: {
  kicker: string;
  title: ReactNode;
  features: { id: string; title: string; text: string; benefit: string; photo: SitePhoto; href: string }[];
} ) {
  return (
    <section data-header="solid" className="dr-features">
      <div className="dr-features-head">
        <p className="dr-kicker text-small">{ kicker }</p>
        <h2 className="m-0 text-h2">{ title }</h2>
      </div>
      <ol className="dr-features-list">
        { features.map( ( f, i ) => <FeatureRow key={ f.id } index={ i } { ...f } /> ) }
      </ol>
    </section>
  );
}

function FeatureRow( { index, title, text, benefit, photo, href }: { index: number; title: string; text: string; benefit: string; photo: SitePhoto; href: string } ) {
  const { ref, inView } = useInView<HTMLLIElement>( 0.25 );
  return (
    <li ref={ ref } className={ cn( "dr-feature", index % 2 === 1 && "is-flipped", inView && "is-in" ) }>
      <div className="dr-feature-media"><img src={ photo.src } alt={ photo.alt } loading="lazy" /></div>
      <div className="dr-feature-copy">
        <span className="dr-feature-num text-h2" aria-hidden>{ String( index + 1 ).padStart( 2, "0" ) }</span>
        <h3 className="m-0 text-h3">{ title }</h3>
        <p className="m-0 text-large">{ text }</p>
        <p className="dr-feature-benefit text-small"><span className="dr-meta">Why it helps</span>{ benefit }</p>
        <SmartLink href={ href } className="dr-why-link text-small">Learn more<ArrowRight aria-hidden className="size-4" /></SmartLink>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Closing call to action                                              */
/* ------------------------------------------------------------------ */

export function ClosingCta( { kicker, title, lede, primary, secondary }: { kicker: string; title: ReactNode; lede: ReactNode; primary: DrHeaderLink; secondary: DrHeaderLink } ) {
  const { ref, inView } = useInView<HTMLElement>( 0.3 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-cta", inView && "is-in" ) }>
      <span className="dr-cta-stripe" aria-hidden />
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-cta-title text-h1">{ title }</h2>
      <p className="dr-cta-lede text-large">{ lede }</p>
      <div className="dr-hero-actions justify-center">
        <DrButton href={ primary.href } tone="black">{ primary.label }</DrButton>
        <DrButton href={ secondary.href } tone="ghost">{ secondary.label }</DrButton>
      </div>
    </section>
  );
}
