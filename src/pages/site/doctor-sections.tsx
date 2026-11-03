import type { ComponentType, CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, ChevronsLeft, MapPin, Menu, Phone, Play, Plus, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

function isInternalPath( href: string ) {
  if ( !href.startsWith( "/" ) || href.startsWith( "//" ) ) return false;
  const path = href.split( "?" )[0].split( "#" )[0];
  return !/\.[a-z0-9]+$/i.test( path );
}

function SmartLink( { href, className, children, onClick }: { href: string; className?: string; children: ReactNode; onClick?: () => void } ) {
  if ( isInternalPath( href ) ) {
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
    const onScroll = () => setScrolled( window.scrollY > 80 );
    onScroll();
    window.addEventListener( "scroll", onScroll, { passive: true } );
    return () => window.removeEventListener( "scroll", onScroll );
  }, [] );

  useEffect( () => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [ open ] );

  return (
    <>
      <div className="dr-strip text-small">
        <span>{ strip }</span>
        <span className="dr-strip-place"><MapPin aria-hidden className="size-3.5" />{ place }</span>
      </div>
      <header className={ cn( "dr-header", scrolled && "is-scrolled" ) }>
        <div className="dr-bar">
          <Link to="/" className="dr-brand">
            <span className="dr-brand-text">
              <span className="dr-brand-name">{ name }</span>
              <span className="dr-brand-role text-small">{ role }</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="dr-nav">
            { links.map( link => (
              <NavLink key={ link.href } to={ link.href } className="dr-nav-link dr-meta text-small">{ link.label }</NavLink>
            ) ) }
          </nav>
          <div className="dr-actions">
            <a href={ phone.href } className="dr-call dr-meta text-small"><Phone aria-hidden className="size-4" /><span>{ phone.label }</span></a>
            <SmartLink href={ cta.href } className="dr-pill text-small">{ cta.label }<ArrowUpRight aria-hidden className="dr-btn-icon" /></SmartLink>
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
    </>
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
          { eyebrow && <p className="dr-eyebrow dr-in" style={ { "--d": "0ms" } as CSSProperties }><span className="dr-dot" aria-hidden />{ eyebrow }</p> }
          <h1 className="dr-hero-title dr-in" style={ { "--d": "120ms" } as CSSProperties }>{ title }</h1>
          <p className="dr-hero-lede dr-in" style={ { "--d": "260ms" } as CSSProperties }>{ lede }</p>
          <div className="dr-hero-actions dr-in" style={ { "--d": "380ms" } as CSSProperties }>
            <DrButton href={ primary.href }>{ primary.label }</DrButton>
            <DrButton href={ secondary.href } tone="ghost">{ secondary.label }</DrButton>
          </div>
          <ul className="dr-ticks dr-in" style={ { "--d": "500ms" } as CSSProperties }>
            { ticks.map( t => <li key={ t }><Check aria-hidden className="size-4" />{ t }</li> ) }
          </ul>
        </div>
        <div className="dr-hero-photo">
          <img src={ photo.src } alt={ photo.alt } fetchPriority="high" />
        </div>
      </div>
      <div className="dr-band">
        <p className="dr-band-title">{ bandTitle }</p>
        <ul className="dr-band-list" style={ { "--band-n": bandItems.length } as CSSProperties }>
          { bandItems.map( ( { icon: Icon, label }, i ) => (
            <li key={ label } style={ { "--d": `${ 700 + i * 120 }ms` } as CSSProperties }>
              <span className="dr-band-icon-wrap" aria-hidden><Icon className="size-4" /></span>{ label }
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
  items: { label: string }[];
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
        <p className="dr-why-areas text-small">{ items.map( ( { label } ) => label ).join( ", " ) }.</p>
      </div>
      <div className="dr-why-panel">
        <img className="dr-why-photo" src={ photo.src } alt={ photo.alt } loading="lazy" />
        <div className="dr-why-voice">
          <figure className="dr-why-quote">
            <blockquote className="m-0 dr-why-quote-text text-large">{ quote }</blockquote>
            <figcaption className="dr-why-attr">
              <span className="dr-meta text-small">{ quoteName }</span>
              <span className="dr-why-role text-small">{ quoteRole }, { quotePlace }</span>
            </figcaption>
            <SmartLink href={ quoteLink.href } className="dr-why-quote-link text-small">{ quoteLink.label }</SmartLink>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Media gallery — video cards that open a player                      */
/* ------------------------------------------------------------------ */

export interface DrMediaItem {
  url: string;
  kind: string;
  title: string;
  date?: string;
  poster?: SitePhoto;
}

function youtubeId( url: string ) {
  const match = url.match( /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i );
  return match?.[1];
}

function MediaCard( { item, index, onPlay }: { item: DrMediaItem; index: number; onPlay: ( item: DrMediaItem ) => void } ) {
  const id = youtubeId( item.url );
  const thumb = id ? `https://i.ytimg.com/vi/${ id }/maxresdefault.jpg` : item.poster?.src;
  return (
    <article className="dr-media-card" style={ { "--i": index } as CSSProperties }>
      <div className="dr-media-frame">
        { thumb && (
          <img
            className="dr-media-thumb"
            src={ thumb }
            alt={ item.title }
            loading="lazy"
            onError={ event => {
              if ( id && !event.currentTarget.dataset.fallback ) {
                event.currentTarget.dataset.fallback = "1";
                event.currentTarget.src = `https://i.ytimg.com/vi/${ id }/sddefault.jpg`;
              }
            } }
          />
        ) }
        <span className="dr-media-play" aria-hidden>
          <Play className="dr-media-play-icon" />
        </span>
      </div>
      <div className="dr-media-body">
        <span className="dr-media-tag text-meta">{ item.kind }</span>
        <h3 className="dr-media-title text-large">{ item.title }</h3>
        { item.date && <p className="dr-media-date text-small">{ item.date }</p> }
      </div>
      { id && (
        <button
          type="button"
          className="dr-media-open"
          onClick={ () => onPlay( item ) }
          aria-label={ `Play ${ item.kind }: ${ item.title }` }
        />
      ) }
    </article>
  );
}

export function MediaGallery( { kicker, title, items }: { kicker: string; title: string; items: DrMediaItem[] } ) {
  const { ref, inView } = useInView<HTMLElement>( 0.12 );
  const [ playing, setPlaying ] = useState<DrMediaItem | null>( null );
  const playingId = playing ? youtubeId( playing.url ) : undefined;
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-media", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-media-heading text-h2">{ title }</h2>
      <div className="dr-media-grid">
        { items.map( ( item, index ) => (
          <MediaCard key={ `${ item.title }-${ index }` } item={ item } index={ index } onPlay={ setPlaying } />
        ) ) }
      </div>
      <Dialog open={ playing !== null } onOpenChange={ open => { if ( !open ) setPlaying( null ); } }>
        <DialogContent className="border-0 bg-white p-0 gap-0 sm:max-w-4xl" aria-describedby={ undefined }>
          { playing && playingId && (
            <>
              <DialogTitle className="dr-media-dialog-title text-large">{ playing.title }</DialogTitle>
              <div className="dr-media-player">
                <iframe
                  src={ `https://www.youtube-nocookie.com/embed/${ playingId }?autoplay=1&rel=0` }
                  title={ playing.title }
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </>
          ) }
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Cinematic work section — full-bleed photo bg + slide-in cards       */
/* ------------------------------------------------------------------ */

export function CinematicWork( { kicker, title, caption, photo, areas }: {
  kicker: string;
  title: ReactNode;
  caption?: string;
  photo: SitePhoto;
  areas: { id: string; title: string; text: string; href: string }[];
} ) {
  const { ref: headRef, inView: headIn } = useInView<HTMLDivElement>( 0.3 );
  return (
    <section className="dr-cinematic" data-header="solid">
      {/* Parallax full-screen frame — image as CSS fixed background */}
      <div
        className="dr-cinematic-frame"
        style={ { "--cinematic-img": `url(${ photo.src })` } as CSSProperties }
        aria-hidden={ false }
      >
        {/* headline centred inside the frame */}
        <div ref={ headRef } className={ cn( "dr-cinematic-head", headIn && "is-in" ) }>
          <h2 className="dr-cinematic-title">{ title }</h2>
          { caption && <p className="dr-cinematic-caption">{ caption }</p> }
        </div>
      </div>

      {/* 'My areas of work' heading — sits directly above the yellow cards */}
      <div className="dr-cinematic-intro">
        <p className="dr-kicker text-small">{ kicker }</p>
        <h2 className="dr-cinematic-intro-title text-h1">Where I focus my energy.</h2>
      </div>

      {/* cards that appear below the parallax frame */}
      <ul className="dr-cinematic-cards">
        { areas.map( ( area, i ) => <CinematicCard key={ area.id } area={ area } index={ i } /> ) }
      </ul>
    </section>
  );
}

function CinematicCard( { area, index }: { area: { id: string; title: string; text: string; href: string }; index: number } ) {
  const { ref, inView } = useInView<HTMLLIElement>( 0.2 );
  return (
    <li ref={ ref } className={ cn( "dr-cinematic-card", inView && "is-in" ) } style={ { "--ci": index } as CSSProperties }>
      <span className="dr-cinematic-num" aria-hidden>{ String( index + 1 ).padStart( 2, "0" ) }</span>
      <h3 className="dr-cinematic-card-title">{ area.title }</h3>
      <p className="dr-cinematic-card-text">{ area.text }</p>
      <SmartLink href={ area.href } className="dr-why-link text-small">Learn more<ArrowRight aria-hidden className="size-4" /></SmartLink>
    </li>
  );
}


/* ------------------------------------------------------------------ */
/* FAQ accordion (SS-FAQ)                                              */
/* ------------------------------------------------------------------ */

export interface FaqItem { q: string; a: ReactNode; }

export function DrFaq( { eyebrow, title, lede, link, items }: {
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  link: DrHeaderLink;
  items: FaqItem[];
} ) {
  const [ open, setOpen ] = useState<number | null>( null );
  const { ref } = useInView<HTMLElement>( 0.15 );

  return (
    <section ref={ ref } data-header="solid" className="dr-faq">
      <div className="dr-faq-layout">
        <div>
          <p className="dr-faq-eyebrow"><span className="dr-dot" aria-hidden />{ eyebrow }</p>
          <h2 className="dr-faq-title">{ title }</h2>
          <p className="dr-faq-lede">{ lede }</p>
          <SmartLink href={ link.href } className="dr-faq-link text-small">
            { link.label }
            <ArrowUpRight aria-hidden className="size-4" />
          </SmartLink>
        </div>
        <ul className="dr-faq-list" role="list">
          { items.map( ( item, i ) => {
            const isOpen = open === i;
            return (
              <li key={ i } className="dr-faq-item" data-open={ isOpen || undefined }>
                <button
                  type="button"
                  id={ `faq-btn-${ i }` }
                  aria-expanded={ isOpen }
                  aria-controls={ `faq-ans-${ i }` }
                  className="dr-faq-btn text-large"
                  onClick={ () => setOpen( isOpen ? null : i ) }
                >
                  <span>{ item.q }</span>
                  <span className="dr-faq-icon" aria-hidden>
                    { isOpen ? <X className="size-3.5" /> : <Plus className="size-3.5" /> }
                  </span>
                </button>
                <div
                  id={ `faq-ans-${ i }` }
                  role="region"
                  aria-labelledby={ `faq-btn-${ i }` }
                  className="dr-faq-answer"
                  style={ { maxHeight: isOpen ? "24rem" : undefined } }
                >
                  <div className="dr-faq-answer-inner">{ item.a }</div>
                </div>
              </li>
            );
          } ) }
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing call to action                                              */
/* ------------------------------------------------------------------ */

export function ClosingCta( { kicker, title, lede, primary, secondary, note }: { kicker: string; title: ReactNode; lede: ReactNode; primary: DrHeaderLink; secondary: DrHeaderLink; note?: string } ) {
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
      { note && <p className="dr-cta-note text-small">{ note }</p> }
    </section>
  );
}

export function PageHero( { kicker, title, lede, photo, actions }: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  photo: SitePhoto;
  actions?: ReactNode;
} ) {
  return (
    <section className="dr-page-hero" data-header="solid">
      <div className="dr-page-hero-copy">
        <p className="dr-kicker text-small">{ kicker }</p>
        <h1 className="m-0 text-h1">{ title }</h1>
        <div className="dr-page-lede text-large">{ lede }</div>
        { actions && <div className="dr-hero-actions">{ actions }</div> }
      </div>
      <div className="dr-page-hero-media">
        <img src={ photo.src } alt={ photo.alt } />
      </div>
    </section>
  );
}

export function ProseSection( { kicker, title, children, ground = "ivory" }: {
  kicker?: string;
  title?: ReactNode;
  children: ReactNode;
  ground?: "ivory" | "paper" | "cream";
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-prose-sec", `ground-${ ground }`, inView && "is-in" ) }>
      { ( kicker || title ) && (
        <div className="dr-prose-head">
          { kicker && <p className="dr-kicker text-small">{ kicker }</p> }
          { title && <h2 className="m-0 text-h2">{ title }</h2> }
        </div>
      ) }
      <div className="dr-prose text-large">{ children }</div>
    </section>
  );
}

/* Full-bleed photo hero: scrim, centred pill, name, lede               */

export function FullBleedHero( { kicker, title, lede, photo }: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  photo: SitePhoto;
} ) {
  return (
    <section className="dr-bleed" data-header="solid">
      <img className="dr-bleed-photo" src={ photo.src } alt={ photo.alt } />
      <div className="dr-bleed-copy">
        <p className="dr-bleed-pill text-small">{ kicker }</p>
        <h1 className="dr-bleed-title text-h1">{ title }</h1>
        <div className="dr-bleed-lede text-large">{ lede }</div>
      </div>
    </section>
  );
}

/* About page: question lead, story, statement band, credentials       */

export function LeadQuestions( { kicker, title, questions, cta }: {
  kicker: string;
  title: ReactNode;
  questions: ReactNode[];
  cta: DrHeaderLink;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-lead", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-lead-title text-h2">{ title }</h2>
      <svg className="dr-lead-arrow" aria-hidden viewBox="0 0 110 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9 C 26 34, 60 44, 98 33" />
        <path d="M85 24 L99 32 L87 42" />
      </svg>
      <ul className="dr-lead-list">
        { questions.map( ( question, i ) => (
          <li key={ i } className="dr-lead-item text-large" style={ { "--i": i } as CSSProperties }>{ question }</li>
        ) ) }
      </ul>
      <DrButton href={ cta.href } tone="black">{ cta.label }</DrButton>
    </section>
  );
}

export function StoryProse( { kicker, photos, signature, children }: {
  kicker: string;
  photos: SitePhoto[];
  signature: string;
  children: ReactNode;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  const [ lead, ...rest ] = photos;
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-story", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <div className="dr-story-body">
        <div className="dr-story-media">
          <div className="dr-story-panel">
            <img className="dr-story-photo" src={ lead.src } alt={ lead.alt } loading="lazy" />
          </div>
          { rest.map( ( photo ) => (
            <img key={ photo.src } className="dr-story-photo dr-story-photo-sub" src={ photo.src } alt={ photo.alt } loading="lazy" />
          ) ) }
        </div>
        <div className="dr-story-text text-large">
          { children }
          <p className="dr-story-sign text-h3">{ signature }</p>
        </div>
      </div>
    </section>
  );
}

export function StatementBand( { kicker, children, cta, note }: {
  kicker: string;
  children: ReactNode;
  cta: DrHeaderLink;
  note: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-statement", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <div className="dr-statement-body text-h3">{ children }</div>
      <DrButton href={ cta.href } tone="black">{ cta.label }</DrButton>
      <p className="dr-statement-note text-small">{ note }</p>
    </section>
  );
}

interface CredBlock { title: string; entries: { id: string; label: ReactNode; meta?: string }[] }

export function CredentialColumns( { columns }: { columns: CredBlock[][] } ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-credentials", inView && "is-in" ) }>
      <div className="dr-credentials-cols">
        { columns.map( ( column, i ) => (
          <div key={ i } className="dr-credentials-col">
            { column.map( ( block ) => (
              <div key={ block.title } className="dr-credentials-block">
                <h2 className="dr-credentials-title text-h4">{ block.title }</h2>
                <ul className="dr-credentials-list">
                  { block.entries.map( ( entry ) => (
                    <li key={ entry.id }>
                      <span className="dr-credentials-label text-large">{ entry.label }</span>
                      { entry.meta && <span className="dr-credentials-meta text-meta">{ entry.meta }</span> }
                    </li>
                  ) ) }
                </ul>
              </div>
            ) ) }
          </div>
        ) ) }
      </div>
    </section>
  );
}

export function TopicGrid( { kicker, title, items }: {
  kicker: string;
  title: ReactNode;
  items: { id: string; title: string; text: string }[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-topics", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="m-0 text-h2">{ title }</h2>
      <ul className="dr-topics-list">
        { items.map( ( item, i ) => (
          <li key={ item.id } style={ { "--i": i } as CSSProperties }>
            <h3 className="m-0 text-h4">{ item.title }</h3>
            <p className="m-0 text-large">{ item.text }</p>
          </li>
        ) ) }
      </ul>
    </section>
  );
}

export interface DrPost {
  slug: string;
  title: string;
  date?: string;
  topic: string;
  excerpt: string;
  photo: SitePhoto;
  body: ReactNode;
}

/* Blog card used in the 3-col grid */
function BlogCard( { post, index }: { post: DrPost; index: number } ) {
  const href = `/blog/${ post.slug }`;
  return (
    <article className="dr-blog-card" style={ { "--i": index } as CSSProperties }>
      <SmartLink href={ href } className="dr-blog-card-img-wrap">
        <img src={ post.photo.src } alt={ post.photo.alt } className="dr-blog-card-img" loading="lazy" />
      </SmartLink>
      <div className="dr-blog-card-body">
        <h3 className="dr-blog-card-title text-h4 m-0"><SmartLink href={ href }>{ post.title }</SmartLink></h3>
        <p className="dr-blog-card-excerpt text-large m-0">{ post.excerpt }</p>
        <SmartLink href={ href } className="dr-blog-card-link text-meta">Continue reading</SmartLink>
      </div>
    </article>
  );
}

/* the reference index shows a hero plus three rows of three */
const PAGE_FIRST = 10;
const PAGE_MORE = 9;

export function PostList( { posts, author, avatar }: {
  posts: DrPost[];
  author: string;
  avatar: SitePhoto;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.08 );
  const [ shown, setShown ] = useState( PAGE_FIRST );
  const featured = posts[ 0 ];
  const rest = posts.slice( 1, shown );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-blog-page", inView && "is-in" ) }>
      { featured && (
        <article className="dr-blog-featured">
          <img className="dr-blog-featured-photo" src={ featured.photo.src } alt={ featured.photo.alt } />
          <div className="dr-blog-featured-copy">
            <h1 className="dr-blog-featured-title text-h1 m-0">{ featured.title }</h1>
            <div className="dr-blog-featured-meta">
              <SmartLink href={ `/blog/${ featured.slug }` } className="dr-blog-featured-cta text-meta">Continue reading</SmartLink>
              <p className="dr-blog-featured-topic text-meta m-0">{ featured.topic }</p>
              <p className="dr-blog-featured-by text-meta m-0">
                <img className="dr-blog-featured-avatar" src={ avatar.src } alt="" />
                <span className="dr-blog-featured-byword">by</span>{ author }
              </p>
            </div>
          </div>
        </article>
      ) }
      <div className="dr-blog-grid-wrap">
        <div className="dr-blog-grid">
          { rest.map( ( post, i ) => <BlogCard key={ post.slug } post={ post } index={ i } /> ) }
        </div>
        { posts.length > shown && (
          <div className="dr-blog-more">
            <button type="button" className="dr-blog-more-btn text-meta" onClick={ () => setShown( s => s + PAGE_MORE ) }>
              <ChevronsLeft aria-hidden className="dr-blog-more-icon" />
              Older articles
            </button>
          </div>
        ) }
      </div>
    </section>
  );
}

/* Home-page blog preview section */
export function HomeBlogSection( { kicker, title, lede, posts, allHref }: {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  posts: DrPost[];
  allHref: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.1 );
  const preview = posts.slice( 0, 3 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-home-blog", inView && "is-in" ) }>
      <div className="dr-home-blog-head">
        <div>
          <p className="dr-kicker text-small">{ kicker }</p>
          <h2 className="dr-home-blog-title text-h2">{ title }</h2>
          { lede && <div className="dr-home-blog-lede text-large">{ lede }</div> }
        </div>
        <SmartLink href={ allHref } className="dr-home-blog-all text-small">
          All articles
          <ArrowUpRight aria-hidden className="size-4" />
        </SmartLink>
      </div>
      <div className="dr-blog-grid">
        { preview.map( ( post, i ) => (
          <BlogCard key={ post.slug } post={ post } index={ i } />
        ) ) }
      </div>
    </section>
  );
}

export function DoctorFooter( { name, note, links, email, phone, cvHref, copyright }: {
  name: string;
  note: string;
  links: DrHeaderLink[];
  email: string;
  phone: string;
  cvHref: string;
  copyright: string;
} ) {
  return (
    <footer className="dr-footer">
      <div className="dr-footer-top">
        <div>
          <p className="dr-brand-name">{ name }</p>
          <p className="dr-footer-note text-large">{ note }</p>
          <div className="dr-hero-actions mt-6">
            <DrButton href="/contact" tone="black">Get in touch</DrButton>
            <DrButton href={ cvHref } tone="ghost">Download my CV</DrButton>
          </div>
        </div>
        <nav aria-label="Footer" className="dr-footer-nav">
          { links.map( link => <SmartLink key={ link.href } href={ link.href } className="dr-meta text-small">{ link.label }</SmartLink> ) }
        </nav>
        <div className="dr-footer-contact">
          <a href={ `mailto:${ email }` }>{ email }</a>
          <a href={ `tel:${ phone.replace( /[^\d+]/g, "" ) }` }>{ phone }</a>
        </div>
      </div>
      <p className="dr-footer-copy text-small">{ copyright }</p>
    </footer>
  );
}
/* ------------------------------------------------------------------ */
/* How it works: reference-cloned blocks                               */
/* ------------------------------------------------------------------ */

type HiwIcon = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;

export function HiwPill( { href, children, tone = "white" }: {
  href: string;
  children: ReactNode;
  tone?: "white" | "outline" | "teal" | "blue";
} ) {
  return (
    <SmartLink href={ href } className={ cn( "dr-hiw-pill text-small", `dr-hiw-pill-${ tone }` ) }>
      { children }
    </SmartLink>
  );
}

export function HiwHero( { title, lede, action, note, photo }: {
  title: ReactNode;
  lede: ReactNode;
  action?: ReactNode;
  note?: string;
  photo: SitePhoto;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-hero", inView && "is-in" ) }>
      <div className="dr-hiw-hero-body">
        <div>
          <h1 className="dr-hiw-hero-title text-h2">{ title }</h1>
          <p className="dr-hiw-hero-lede text-large">{ lede }</p>
          { action && <div className="dr-hiw-hero-actions">{ action }</div> }
          { note && <p className="dr-hiw-hero-note text-small">{ note }</p> }
        </div>
        <div className="dr-hiw-hero-photo">
          <img src={ photo.src } alt={ photo.alt } />
        </div>
      </div>
    </section>
  );
}

export function HiwSplit( { kicker, title, photo, children, action, note, checks }: {
  kicker: string;
  title: ReactNode;
  photo: SitePhoto;
  children: ReactNode;
  action?: ReactNode;
  note?: string;
  checks?: string[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-split", inView && "is-in" ) }>
      <div className="dr-hiw-split-body">
        <div className="dr-hiw-split-media">
          <img src={ photo.src } alt={ photo.alt } loading="lazy" />
        </div>
        <div>
          <p className="dr-kicker text-small">{ kicker }</p>
          <h2 className="dr-hiw-split-title text-h3">{ title }</h2>
          <div className="dr-hiw-split-text text-large">{ children }</div>
          { action && <div className="dr-hiw-split-actions">{ action }</div> }
          { note && <p className="dr-hiw-split-note text-small">{ note }</p> }
          { checks && (
            <ul className="dr-hiw-checks text-large">
              { checks.map( ( check ) => <li key={ check }>{ check }</li> ) }
            </ul>
          ) }
        </div>
      </div>
    </section>
  );
}

export function HiwProcess( { kicker, title, steps }: {
  kicker: string;
  title: ReactNode;
  steps: { id: string; label: string; icon: HiwIcon; color: string }[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-process", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-hiw-center-title text-h3">{ title }</h2>
      <ol className="dr-hiw-process-list">
        { steps.map( ( { id, label, icon: Icon, color }, i ) => (
          <li key={ id } className="dr-hiw-process-step" style={ { "--i": i, "--c": color } as CSSProperties }>
            <Icon aria-hidden strokeWidth={ 1.5 } className="dr-hiw-process-icon" />
            <span className="dr-hiw-process-dot" aria-hidden />
            <span className="dr-hiw-process-label text-small">{ label }</span>
          </li>
        ) ) }
      </ol>
    </section>
  );
}

export function HiwAssess( { kicker, title, rows }: {
  kicker: string;
  title: ReactNode;
  rows: {
    id: string;
    icon: HiwIcon;
    color: string;
    left: { title: string; text: string };
    right: { title: string; text: string };
  }[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.1 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-assess", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-hiw-center-title text-h3">{ title }</h2>
      <div className="dr-hiw-assess-grid">
        { rows.map( ( { id, icon: Icon, color, left, right }, i ) => (
          <div key={ id } className="dr-hiw-assess-row" style={ { "--i": i, "--c": color } as CSSProperties }>
            <div className="dr-hiw-assess-cell dr-hiw-assess-left">
              <h3 className="dr-hiw-assess-title text-large">{ left.title }</h3>
              <p className="dr-hiw-assess-text text-small">{ left.text }</p>
            </div>
            <div className="dr-hiw-assess-mid" aria-hidden>
              <Icon strokeWidth={ 1.5 } className="dr-hiw-assess-icon" />
            </div>
            <div className="dr-hiw-assess-cell">
              <h3 className="dr-hiw-assess-title text-large">{ right.title }</h3>
              <p className="dr-hiw-assess-text text-small">{ right.text }</p>
            </div>
          </div>
        ) ) }
        <span className="dr-hiw-assess-end" aria-hidden />
      </div>
    </section>
  );
}

export function HiwConsult( { kicker, title, children, icon: Icon, photo, cardTitle, cardText, cardName, cardMeta }: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  icon: HiwIcon;
  photo: SitePhoto;
  cardTitle: string;
  cardText: string;
  cardName: string;
  cardMeta: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-consult", inView && "is-in" ) }>
      <div className="dr-hiw-consult-body">
        <div>
          <p className="dr-kicker text-small">{ kicker }</p>
          <h2 className="dr-hiw-split-title text-h3">{ title }</h2>
          <div className="dr-hiw-split-text text-large">{ children }</div>
          <div className="dr-hiw-consult-iconwrap">
            <Icon aria-hidden strokeWidth={ 1.5 } className="dr-hiw-consult-icon" />
          </div>
        </div>
        <div className="dr-hiw-card">
          <img className="dr-hiw-card-photo" src={ photo.src } alt={ photo.alt } loading="lazy" />
          <h3 className="dr-hiw-card-title text-h3">{ cardTitle }</h3>
          <p className="dr-hiw-card-text text-large">{ cardText }</p>
          <p className="dr-hiw-card-name text-large">{ cardName }</p>
          <p className="dr-hiw-card-meta text-meta">{ cardMeta }</p>
        </div>
      </div>
    </section>
  );
}

export function HiwPlan( { kicker, title, children, action }: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-plan", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-hiw-plan-title text-h3">{ title }</h2>
      <div className="dr-hiw-plan-text text-large">{ children }</div>
      { action && <div className="dr-hiw-plan-actions">{ action }</div> }
    </section>
  );
}

export function HiwBenefits( { items }: {
  items: { id: string; icon: HiwIcon; title: string; paragraphs: string[] }[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-benefits", inView && "is-in" ) }>
      <ul className="dr-hiw-benefits-list">
        { items.map( ( { id, icon: Icon, title, paragraphs }, i ) => (
          <li key={ id } className="dr-hiw-benefit" style={ { "--i": i } as CSSProperties }>
            <Icon aria-hidden strokeWidth={ 1.5 } className="dr-hiw-benefit-icon" />
            <h3 className="dr-hiw-benefit-title text-h4">{ title }</h3>
            { paragraphs.map( ( paragraph ) => <p key={ paragraph } className="text-large">{ paragraph }</p> ) }
          </li>
        ) ) }
      </ul>
    </section>
  );
}

export function HiwTrack( { kicker, title, children, photo }: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  photo: SitePhoto;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.15 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-track", inView && "is-in" ) }>
      <div className="dr-hiw-track-band">
        <div>
          <p className="dr-kicker text-small">{ kicker }</p>
          <h2 className="dr-hiw-split-title text-h3">{ title }</h2>
          <div className="dr-hiw-split-text text-large">{ children }</div>
        </div>
        <div className="dr-hiw-track-media">
          <img src={ photo.src } alt={ photo.alt } loading="lazy" />
        </div>
      </div>
    </section>
  );
}

export function HiwFaq( { title, items }: {
  title: ReactNode;
  items: { q: string; a: ReactNode }[];
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.1 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-faq", inView && "is-in" ) }>
      <h2 className="dr-hiw-faq-title text-h3">{ title }</h2>
      <div className="dr-hiw-faq-list">
        { items.map( ( { q, a } ) => (
          <details key={ q } className="dr-hiw-faq-item">
            <summary className="dr-hiw-faq-q text-large">
              <span>{ q }</span>
              <span className="dr-hiw-faq-plus" aria-hidden />
            </summary>
            <div className="dr-hiw-faq-a text-large">{ a }</div>
          </details>
        ) ) }
      </div>
    </section>
  );
}

export function HiwCta( { kicker, title, accent, children, action, note }: {
  kicker: string;
  title: ReactNode;
  accent: string;
  children: ReactNode;
  action?: ReactNode;
  note?: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-cta", inView && "is-in" ) }>
      <p className="dr-hiw-cta-kicker text-small">{ kicker }</p>
      <h2 className="dr-hiw-cta-title text-h2">
        { title } <em className="dr-hiw-cta-accent">{ accent }.</em>
      </h2>
      <div className="dr-hiw-cta-body text-h4">{ children }</div>
      { action && <div className="dr-hiw-cta-actions">{ action }</div> }
      { note && <p className="dr-hiw-cta-note text-small">{ note }</p> }
    </section>
  );
}
