import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, ChevronsLeft, MapPin, Menu, Phone, Play, Plus, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type { SitePhoto } from "./media";
import { home } from "./media";
import { fill } from "./copy";
import { Paras, Rich } from "./rich";
import type { Publication, PublicationGroup } from "./publications";
import { orcidUrl, publicationKindHeading, scholarProfileUrl } from "./publications";
import type { CopyIcon } from "./icons";

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

/* The header is built once in `site.tsx` and handed to `SiteTemplate`, so its shape lives here alone. */
export interface DoctorHeaderData {
  name: string;
  role: string;
  strip: string;
  place: string;
  links: DrHeaderLink[];
  phone: { label: string; href: string };
  cta: DrHeaderLink;
  collaborate?: DrHeaderLink;
  photo?: SitePhoto;
  aria?: { primary?: string; drawer?: string; open?: string; close?: string };
}

export function DoctorHeader( { name, role, strip, place, links, phone, cta, collaborate, photo = home.portrait, aria = {} }: DoctorHeaderData ) {
  const [ open, setOpen ] = useState( false );
  const [ scrolled, setScrolled ] = useState( false );
  const drawer = useRef<HTMLDivElement>( null );
  const menuButton = useRef<HTMLButtonElement>( null );

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

  useEffect( () => {
    if ( !open ) return;
    const linksIn = () => Array.from( drawer.current?.querySelectorAll<HTMLElement>( "a[href],button:not([disabled])" ) ?? [] );
    linksIn()[ 0 ]?.focus();
    const onKey = ( event: KeyboardEvent ) => {
      if ( event.key === "Escape" ) {
        setOpen( false );
        menuButton.current?.focus();
        return;
      }
      if ( event.key !== "Tab" ) return;
      const items = linksIn();
      if ( items.length === 0 ) return;
      const first = items[ 0 ];
      const last = items[ items.length - 1 ];
      if ( event.shiftKey && document.activeElement === first ) { event.preventDefault(); last.focus(); }
      else if ( !event.shiftKey && document.activeElement === last ) { event.preventDefault(); first.focus(); }
      else if ( !drawer.current?.contains( document.activeElement ) ) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener( "keydown", onKey );
    return () => document.removeEventListener( "keydown", onKey );
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
            <span className="dr-brand-photo" aria-hidden>
              <img src={ photo.src } alt="" width={ photo.width } height={ photo.height } />
            </span>
            <span className="dr-brand-text">
              <span className="dr-brand-name">{ name }</span>
              <span className="dr-brand-role text-small">{ role }</span>
            </span>
          </Link>
          <nav aria-label={ aria.primary ?? "Primary" } className="dr-nav">
            { links.map( link => (
              <NavLink key={ link.href } to={ link.href } className="dr-nav-link dr-meta text-small">{ link.label }</NavLink>
            ) ) }
          </nav>
          <div className="dr-actions">
            { collaborate && (
              <SmartLink href={ collaborate.href } className="dr-collab dr-meta text-small">{ collaborate.label }</SmartLink>
            ) }
            <a href={ phone.href } className="dr-call dr-meta text-small"><Phone aria-hidden className="size-4" /><span>{ phone.label }</span></a>
            <SmartLink href={ cta.href } className="dr-pill text-small">{ cta.label }<ArrowUpRight aria-hidden className="dr-btn-icon" /></SmartLink>
            <button type="button" ref={ menuButton } className="dr-menu-btn" aria-label={ open ? ( aria.close ?? "Close menu" ) : ( aria.open ?? "Open menu" ) } aria-expanded={ open } aria-controls="dr-drawer" onClick={ () => setOpen( v => !v ) }>
              { open ? <X aria-hidden /> : <Menu aria-hidden /> }
            </button>
          </div>
        </div>
        <div id="dr-drawer" ref={ drawer } className={ cn( "dr-drawer", open && "is-open" ) } aria-hidden={ !open }>
          <nav aria-label={ aria.drawer ?? "Menu" } className="flex flex-col gap-1">
            { [ ...links, ...( collaborate ? [ collaborate ] : [] ), cta ].map( ( link, i ) => (
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
  bandItems: { icon: CopyIcon; label: string }[];
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
          { /* React 18 drops the camelCase prop, so the attribute is handed over in its DOM spelling. */ }
          <img src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } { ...{ fetchpriority: "high" } } />
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

export function NamasteIntro( { eyebrow, title, body, name, credentials, marks, marksLabel }: {
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  name: string;
  credentials: string;
  marks?: string[];
  marksLabel?: string;
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
        <ul className="dr-marks dr-meta text-small" aria-label={ marksLabel ?? "Trained and trusted at" }>
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
  icon: CopyIcon;
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
        <img className="dr-why-photo" src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } loading="lazy" decoding="async" />
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
  source?: string;
  poster?: SitePhoto;
}

function youtubeId( url: string ) {
  const match = url.match( /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i );
  return match?.[1];
}

/* YouTube answers missing thumbs with a 200/404 grey placeholder image, so both load outcomes must advance the chain */
function nextThumb( id: string, img: HTMLImageElement, poster?: string ) {
  const step = Number( img.dataset.fallback ?? 0 );
  if ( step === 0 ) {
    img.dataset.fallback = "1";
    img.src = `https://i.ytimg.com/vi/${ id }/sddefault.jpg`;
  } else if ( step === 1 ) {
    img.dataset.fallback = "2";
    img.src = `https://i.ytimg.com/vi/${ id }/hqdefault.jpg`;
  } else if ( step === 2 && poster ) {
    img.dataset.fallback = "3";
    img.src = poster;
  }
}

function MediaCard( { item, index, onPlay, playLabel }: { item: DrMediaItem; index: number; onPlay: ( item: DrMediaItem ) => void; playLabel?: string } ) {
  const id = youtubeId( item.url );
  const thumb = id ? `https://i.ytimg.com/vi/${ id }/maxresdefault.jpg` : item.poster?.src;
  const thumbRef = useRef<HTMLImageElement>( null );
  useEffect( () => {
    const img = thumbRef.current;
    if ( id && img && img.complete && img.naturalWidth <= 120 ) nextThumb( id, img, item.poster?.src );
  }, [ id, item.poster ] );
  return (
    <article className="dr-media-card" style={ { "--i": index } as CSSProperties }>
      <div className="dr-media-frame">
        { thumb && (
          <img
            ref={ thumbRef }
            className="dr-media-thumb"
            src={ thumb }
            alt={ item.title }
            loading="lazy"
            decoding="async"
            onError={ event => {
              if ( id ) nextThumb( id, event.currentTarget, item.poster?.src );
            } }
            onLoad={ event => {
              if ( id && event.currentTarget.naturalWidth <= 120 ) nextThumb( id, event.currentTarget, item.poster?.src );
            } }
          />
        ) }
        <span className="dr-media-play" aria-hidden>
          <Play className="dr-media-play-icon" />
        </span>
      </div>
      <div className="dr-media-body">
        <h3 className="dr-media-title text-large">{ item.title }</h3>
        <p className="dr-media-date text-small">{ item.kind }{ item.source ? `, ${ item.source }` : "" }</p>
      </div>
      { item.url && (
        <button
          type="button"
          className="dr-media-open"
          onClick={ () => onPlay( item ) }
          aria-label={ fill( playLabel ?? "Play {kind}: {title}", { kind: item.kind, title: item.title } ) }
        />
      ) }
    </article>
  );
}

export function MediaGallery( { kicker, title, items, allHref, allLabel, playLabel, page }: {
  kicker: string;
  title: string;
  items: DrMediaItem[];
  allHref?: string;
  allLabel?: string;
  playLabel?: string;
  page?: FeedControl;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.12 );
  const [ playing, setPlaying ] = useState<DrMediaItem | null>( null );
  const playingId = playing ? youtubeId( playing.url ) : undefined;
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-media", inView && "is-in" ) }>
      <p className="dr-kicker text-small">{ kicker }</p>
      <h2 className="dr-media-heading text-h2">{ title }</h2>
      <div className="dr-media-grid">
        { items.map( ( item, index ) => (
          <MediaCard key={ `${ item.title }-${ index }` } item={ item } index={ index } onPlay={ setPlaying } playLabel={ playLabel } />
        ) ) }
      </div>
      { allHref && (
        <div className="dr-media-more">
          <SmartLink href={ allHref } className="dr-home-blog-all text-small">
            { allLabel ?? "All videos" }
            <ArrowUpRight aria-hidden className="size-4" />
          </SmartLink>
        </div>
      ) }
      { page?.hasMore && (
        <div className="dr-media-more">
          <button type="button" className="dr-blog-more-btn text-meta" disabled={ page.loading } onClick={ page.more }>
            { page.label ?? "More clips" }
          </button>
        </div>
      ) }
      <Dialog open={ playing !== null } onOpenChange={ open => { if ( !open ) setPlaying( null ); } }>
        <DialogContent className="border-0 bg-white p-0 gap-0 sm:max-w-3xl" aria-describedby={ undefined }>
          { playing && (
            <>
              <DialogTitle className="dr-media-dialog-title text-large">{ playing.title }</DialogTitle>
              <div className="dr-media-player">
                { playingId ? (
                  <iframe
                    src={ `https://www.youtube-nocookie.com/embed/${ playingId }?autoplay=1&rel=0` }
                    title={ playing.title }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <video className="dr-media-video" src={ playing.url } controls autoPlay playsInline />
                ) }
              </div>
            </>
          ) }
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Press articles shown as blog-style cards                            */
/* ------------------------------------------------------------------ */

export interface PressItem {
  href: string;
  photo: SitePhoto;
  topic: string;
  title: string;
  source: string;
  blurb: string;
}

export function PressSection( { kicker, title, lede, items, readLabel }: {
  kicker: string;
  title: string;
  lede: string;
  items: PressItem[];
  readLabel?: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.1 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-press", inView && "is-in" ) }>
      <div className="dr-press-intro">
        <p className="dr-kicker text-small">{ kicker }</p>
        <h2 className="dr-press-heading text-h2">{ title }</h2>
        <p className="dr-press-lede text-small">{ lede }</p>
      </div>
      <div className="dr-press-grid">
        { items.map( ( item, index ) => (
          <article key={ item.href } className="dr-blog-card" style={ { "--i": index } as CSSProperties }>
            <a className="dr-blog-card-img-wrap" href={ item.href } target="_blank" rel="noreferrer">
              <img src={ item.photo.src } alt={ item.photo.alt } className="dr-blog-card-img" width={ item.photo.width } height={ item.photo.height } loading="lazy" decoding="async" />
            </a>
            <div className="dr-blog-card-body">
              <div className="dr-blog-card-top">
                <span className="dr-blog-card-topic text-meta">{ item.topic }</span>
                <span className="dr-blog-card-date text-small">{ item.source }</span>
              </div>
              <h3 className="dr-blog-card-title text-large m-0"><a href={ item.href } target="_blank" rel="noreferrer">{ item.title }</a></h3>
              <p className="dr-blog-card-excerpt text-small m-0">{ item.blurb }</p>
              <div className="dr-blog-card-foot">
                <a href={ item.href } target="_blank" rel="noreferrer" className="dr-blog-card-link text-small">
                  { readLabel ?? "Read article" }
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
              </div>
            </div>
          </article>
        ) ) }
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cinematic work section — full-bleed photo bg + slide-in cards       */
/* ------------------------------------------------------------------ */

export function CinematicWork( { id, kicker, title, caption, photo, areas, introTitle, learnMore }: {
  id?: string;
  kicker: string;
  title: ReactNode;
  caption?: string;
  photo: SitePhoto;
  areas: { id: string; title: string; text: string; href: string }[];
  introTitle?: string;
  learnMore?: string;
} ) {
  const { ref: headRef, inView: headIn } = useInView<HTMLDivElement>( 0.3 );
  return (
    <section className="dr-cinematic" data-header="solid">
      {/* Parallax full-screen frame — image as CSS fixed background */}
      <div
        className="dr-cinematic-frame"
        style={ { "--cinematic-img": `url(${ photo.src })` } as CSSProperties }
        role="img"
        aria-label={ photo.alt }
      >
        {/* headline centred inside the frame */}
        <div ref={ headRef } className={ cn( "dr-cinematic-head", headIn && "is-in" ) }>
          <h2 className="dr-cinematic-title">{ title }</h2>
          { caption && <p className="dr-cinematic-caption">{ caption }</p> }
        </div>
      </div>

      {/* 'My areas of work' heading — sits directly above the yellow cards */}
      <div id={ id } className="dr-cinematic-intro">
        <p className="dr-kicker text-small">{ kicker }</p>
        <h2 className="dr-cinematic-intro-title text-h1">{ introTitle ?? "Where I focus my energy." }</h2>
      </div>

      {/* cards that appear below the parallax frame */}
      <ul className="dr-cinematic-cards">
        { areas.map( ( area, i ) => <CinematicCard key={ area.id } area={ area } index={ i } learnMore={ learnMore } /> ) }
      </ul>
    </section>
  );
}

function CinematicCard( { area, index, learnMore }: { area: { id: string; title: string; text: string; href: string }; index: number; learnMore?: string } ) {
  const { ref, inView } = useInView<HTMLLIElement>( 0.2 );
  return (
    <li ref={ ref } className={ cn( "dr-cinematic-card", inView && "is-in" ) } style={ { "--ci": index } as CSSProperties }>
      <span className="dr-cinematic-num" aria-hidden>{ String( index + 1 ).padStart( 2, "0" ) }</span>
      <h3 className="dr-cinematic-card-title">{ area.title }</h3>
      <p className="dr-cinematic-card-text">{ area.text }</p>
      <SmartLink href={ area.href } className="dr-why-link text-small">{ learnMore ?? "Learn more" }<ArrowRight aria-hidden className="size-4" /></SmartLink>
    </li>
  );
}


/* ------------------------------------------------------------------ */
/* FAQ accordion (SS-FAQ)                                              */
/* ------------------------------------------------------------------ */

export interface FaqItem { q: string; a: string; }

export function DrFaq( { eyebrow, title, lede, link, items }: {
  eyebrow?: string;
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
          { eyebrow && <p className="dr-faq-eyebrow"><span className="dr-dot" aria-hidden />{ eyebrow }</p> }
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
                  <div className="dr-faq-answer-inner"><p>{ item.a }</p></div>
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

export function ClosingCta( { id, kicker, title, lede, primary, secondary, note }: { id?: string; kicker: string; title: ReactNode; lede: ReactNode; primary: DrHeaderLink; secondary: DrHeaderLink; note?: string } ) {
  const { ref, inView } = useInView<HTMLElement>( 0.3 );
  return (
    <section id={ id } ref={ ref } data-header="solid" className={ cn( "dr-cta", inView && "is-in" ) }>
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
        <img src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } />
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

/* One paragraph per string, the shape the CMS body field arrives in     */

export function Paragraphs( { lines }: { lines: string[] } ) {
  return <>{ lines.map( ( line, i ) => <p key={ i }>{ line }</p> ) }</>;
}

/* One thing the doctor typed in the blog editor, named by what it is    */

export interface ArticleBlock {
  type: "h2" | "h3" | "p" | "ul" | "ol" | "quote";
  text?: string;
  items?: string[];
}

/**
 * An article written as blocks keeps its headings, lists and its quote. An article written before
 * there were blocks has only the plain paragraphs, and those still read.
 */
export function ArticleBody( { blocks, lines }: { blocks?: ArticleBlock[]; lines: string[] } ): ReactNode {
  if ( !blocks || !blocks.length ) return <Paras lines={ lines } />;
  return (
    <>
      { blocks.map( ( block, i ) => {
        if ( block.type === "h2" ) return <h2 key={ i } className="dr-prose-h2"><Rich text={ block.text } /></h2>;
        if ( block.type === "h3" ) return <h3 key={ i } className="dr-prose-h3"><Rich text={ block.text } /></h3>;
        if ( block.type === "ul" || block.type === "ol" ) {
          const List = block.type;
          return (
            <List key={ i } className="dr-prose-list">
              { ( block.items ?? [] ).map( ( item, at ) => <li key={ at }><Rich text={ item } /></li> ) }
            </List>
          );
        }
        if ( block.type === "quote" ) return <blockquote key={ i } className="dr-prose-quote"><Rich text={ block.text } /></blockquote>;
        return <p key={ i }><Rich text={ block.text } /></p>;
      } ) }
    </>
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
      <img className="dr-bleed-photo" src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } />
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
            <img className="dr-story-photo" src={ lead.src } alt={ lead.alt } loading="lazy" decoding="async" />
          </div>
          { rest.map( ( photo ) => (
            <img key={ photo.src } className="dr-story-photo dr-story-photo-sub" src={ photo.src } alt={ photo.alt } loading="lazy" decoding="async" />
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
      <h2 className="dr-kicker text-small">{ kicker }</h2>
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
  minutes?: number;
  photo: SitePhoto;
  body: string[];
  blocks?: ArticleBlock[];
}

export interface BlogCardLabels { read?: string; minutes?: string }

/* Blog card used in the 3-col grid */
function BlogCard( { post, index, labels }: { post: DrPost; index: number; labels?: BlogCardLabels } ) {
  const href = `/blog/${ post.slug }`;
  const read = labels?.read ?? "Read article";
  const minutes = fill( labels?.minutes ?? "{minutes} min read", { minutes: post.minutes ?? 0 } );
  return (
    <article className="dr-blog-card" style={ { "--i": index } as CSSProperties }>
      <SmartLink href={ href } className="dr-blog-card-img-wrap">
        <img src={ post.photo.src } alt={ post.photo.alt } className="dr-blog-card-img" width={ post.photo.width } height={ post.photo.height } loading="lazy" decoding="async" />
      </SmartLink>
      <div className="dr-blog-card-body">
        <div className="dr-blog-card-top">
          <span className="dr-blog-card-topic text-meta">{ post.topic }</span>
          { post.date && <span className="dr-blog-card-date text-small">{ post.date }</span> }
        </div>
        <h3 className="dr-blog-card-title text-large m-0"><SmartLink href={ href }>{ post.title }</SmartLink></h3>
        <p className="dr-blog-card-excerpt text-small m-0">{ post.excerpt }</p>
        <div className="dr-blog-card-foot">
          { post.minutes && <span className="dr-blog-card-read text-small">{ minutes }</span> }
          <SmartLink href={ href } className="dr-blog-card-link text-small">
            { read }
            <ArrowRight aria-hidden className="size-4" />
          </SmartLink>
        </div>
      </div>
    </article>
  );
}

/* the reference index shows a hero plus three rows of three */
const PAGE_FIRST = 10;
const PAGE_MORE = 9;

/** What a section needs to keep asking the CMS for the next page, one cursor at a time. */
export interface FeedControl {
  hasMore: boolean;
  loading: boolean;
  more: () => void;
  label?: string;
}

export function PostList( { posts, author, avatar, labels, page, heading }: {
  posts: DrPost[];
  author: string;
  avatar: SitePhoto;
  labels?: BlogCardLabels & { continue?: string; by?: string; older?: string };
  page?: FeedControl;
  heading?: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.08 );
  const [ shown, setShown ] = useState( PAGE_FIRST );
  const featured = posts[ 0 ];
  /* With a feed in charge the rows arriving are the rows to show; the local counter only
     applies when this list is paging through the bundle by itself. */
  const rest = page ? posts.slice( 1 ) : posts.slice( 1, shown );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-blog-page", inView && "is-in" ) }>
      { heading && <h1 className="sr-only">{ heading }</h1> }
      { featured && (
        <article className="dr-blog-featured">
          <img className="dr-blog-featured-photo" src={ featured.photo.src } alt={ featured.photo.alt } width={ featured.photo.width } height={ featured.photo.height } loading="lazy" decoding="async" />
          <div className="dr-blog-featured-copy">
            <h2 className="dr-blog-featured-title text-h1 m-0">{ featured.title }</h2>
            <div className="dr-blog-featured-meta">
              <SmartLink href={ `/blog/${ featured.slug }` } className="dr-blog-featured-cta text-meta">{ labels?.continue ?? "Continue reading" }</SmartLink>
              <p className="dr-blog-featured-topic text-meta m-0">{ featured.topic }</p>
              <p className="dr-blog-featured-by text-meta m-0">
                <img className="dr-blog-featured-avatar" src={ avatar.src } alt="" />
                <span className="dr-blog-featured-byword">{ labels?.by ?? "by" }</span>{ author }
              </p>
            </div>
          </div>
        </article>
      ) }
      <div className="dr-blog-grid-wrap">
        <div className="dr-blog-grid">
          { rest.map( ( post, i ) => <BlogCard key={ post.slug } post={ post } index={ i } labels={ labels } /> ) }
        </div>
        { ( page ? page.hasMore : posts.length > shown ) && (
          <div className="dr-blog-more">
            <button
              type="button"
              className="dr-blog-more-btn text-meta"
              disabled={ page?.loading }
              onClick={ page ? page.more : () => setShown( s => s + PAGE_MORE ) }
            >
              <ChevronsLeft aria-hidden className="dr-blog-more-icon" />
              { page?.label ?? labels?.older ?? "Older articles" }
            </button>
          </div>
        ) }
      </div>
    </section>
  );
}

/* Home-page blog preview section */
export function HomeBlogSection( { kicker, title, lede, posts, allHref, allLabel, labels }: {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  posts: DrPost[];
  allHref: string;
  allLabel?: string;
  labels?: BlogCardLabels;
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
          { allLabel ?? "All articles" }
          <ArrowUpRight aria-hidden className="size-4" />
        </SmartLink>
      </div>
      <div className="dr-blog-grid">
        { preview.map( ( post, i ) => (
          <BlogCard key={ post.slug } post={ post } index={ i } labels={ labels } />
        ) ) }
      </div>
    </section>
  );
}

export function DoctorFooter( { name, note, links, email, phone, cvHref, social, copyright, cta = { label: "Get in touch", href: "/contact" }, cvLabel, navLabel }: {
  name: string;
  note: string;
  links: DrHeaderLink[];
  email: string;
  phone: string;
  cvHref: string;
  social: { label: string; href: string }[];
  copyright: string;
  cta?: DrHeaderLink;
  cvLabel?: string;
  navLabel?: string;
} ) {
  return (
    <footer className="dr-footer">
      <div className="dr-footer-top">
        <div>
          <p className="dr-brand-name">{ name }</p>
          <p className="dr-footer-note text-large">{ note }</p>
          <div className="dr-hero-actions mt-6">
            <DrButton href={ cta.href } tone="black">{ cta.label }</DrButton>
            <DrButton href={ cvHref } tone="ghost">{ cvLabel ?? "Download my CV" }</DrButton>
          </div>
        </div>
        <nav aria-label={ navLabel ?? "Footer" } className="dr-footer-nav">
          { links.map( link => <SmartLink key={ link.href } href={ link.href } className="dr-meta text-small">{ link.label }</SmartLink> ) }
        </nav>
        <div className="dr-footer-contact">
          <a href={ `mailto:${ email }` }>{ email }</a>
          <a href={ `tel:${ phone.replace( /[^\d+]/g, "" ) }` }>{ phone }</a>
          <div className="dr-footer-social">
            { social.map( item => <a key={ item.href } href={ item.href } target="_blank" rel="noreferrer">{ item.label }</a> ) }
          </div>
        </div>
      </div>
      <p className="dr-footer-copy text-small">{ copyright }</p>
    </footer>
  );
}
/* ------------------------------------------------------------------ */
/* How it works: reference-cloned blocks                               */
/* ------------------------------------------------------------------ */

type HiwIcon = CopyIcon;

export function HiwPill( { href, children, tone = "white" }: {
  href: string;
  children: ReactNode;
  tone?: "white" | "outline" | "teal" | "blue" | "gold";
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
          <img src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } />
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
          <img src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } loading="lazy" decoding="async" />
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
          <img className="dr-hiw-card-photo" src={ photo.src } alt={ photo.alt } width={ photo.width } height={ photo.height } loading="lazy" decoding="async" />
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

export interface HiwChartBand { label: string; range: string; color: string; from: number; to: number }
export interface HiwChartPoint { month: string; year: string; value: number; color: string }

/* Bands and points share one linear scale, so the stacked column and the plotted trend line up */
export function HiwChart( { name, metric, unit, bands, points, domain, riskLabel }: {
  name: string;
  metric: string;
  unit: string;
  bands: HiwChartBand[];
  points: HiwChartPoint[];
  domain: [ number, number ];
  riskLabel?: string;
} ) {
  const [ high, low ] = domain;
  const yOf = ( value: number ) => ( ( high - value ) / ( high - low ) ) * 100;
  const xOf = ( index: number ) => 12 + index * ( 76 / ( points.length - 1 ) );
  const coords = points.map( ( point, index ) => ( { x: xOf( index ), y: yOf( point.value ) } ) );
  return (
    <figure className="dr-hiw-chart">
      <figcaption className="dr-hiw-chart-head">
        <span className="dr-hiw-chart-name text-h4">{ name }</span>
        <span className="dr-hiw-chart-metric text-large">{ metric }</span>
      </figcaption>
      <div className="dr-hiw-chart-scale text-meta">
        <span>{ riskLabel ?? "Risk ranges" }</span>
        <span>{ unit }</span>
      </div>
      <div className="dr-hiw-chart-body">
        <ul className="dr-hiw-chart-bands text-small">
          { bands.map( band => (
            <li key={ band.label } style={ { height: `${ ( ( band.from - band.to ) / ( high - low ) ) * 100 }%`, "--c": band.color } as CSSProperties }>
              <span>{ band.label }</span>
              <span>{ band.range }</span>
            </li>
          ) ) }
        </ul>
        <div className="dr-hiw-chart-plot">
          { bands.map( band => <span key={ band.label } aria-hidden className="dr-hiw-chart-grid" style={ { top: `${ yOf( band.from ) }%` } as CSSProperties } /> ) }
          <svg className="dr-hiw-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            { coords.slice( 0, -1 ).map( ( from, index ) => (
              <line
                key={ points[index].month }
                x1={ from.x }
                y1={ from.y }
                x2={ coords[index + 1].x }
                y2={ coords[index + 1].y }
                stroke={ points[index].color }
                strokeWidth={ 3 }
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) ) }
          </svg>
          { points.map( ( point, index ) => (
            <span
              key={ point.month }
              className="dr-hiw-chart-point text-small"
              style={ { left: `${ coords[index].x }%`, top: `${ coords[index].y }%`, "--c": point.color } as CSSProperties }
            >
              { point.value }
            </span>
          ) ) }
        </div>
        <div className="dr-hiw-chart-axis text-meta">
          { points.map( ( point, index ) => (
            <span key={ point.month } style={ { left: `${ xOf( index ) }%` } as CSSProperties }>
              <span>{ point.month }</span>
              <span>{ point.year }</span>
            </span>
          ) ) }
        </div>
      </div>
    </figure>
  );
}

export function HiwTrack( { kicker, title, children, media }: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  media: ReactNode;
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
          { media }
        </div>
      </div>
    </section>
  );
}

export function HiwFaq( { title, items }: {
  title: ReactNode;
  items: { q: string; a: string }[];
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
            <div className="dr-hiw-faq-a text-large"><p>{ a }</p></div>
          </details>
        ) ) }
      </div>
    </section>
  );
}

export function HiwCta( { kicker, title, accent, children, action, note, variant }: {
  kicker: string;
  title: ReactNode;
  accent: string;
  children: ReactNode;
  action?: ReactNode;
  note?: string;
  variant?: "doctor";
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.2 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-hiw-cta", variant === "doctor" && "is-doctor", inView && "is-in" ) }>
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

export function PublicationList( { groups, kicker, title, lede, allHref, allLabel }: {
  groups: PublicationGroup[];
  kicker?: string;
  title?: string;
  lede?: ReactNode;
  allHref?: string;
  allLabel?: string;
} ) {
  const { ref, inView } = useInView<HTMLElement>( 0.05 );
  return (
    <section ref={ ref } data-header="solid" className={ cn( "dr-pubs", inView && "is-in" ) }>
      <header className="dr-pubs-head">
        <p className="dr-pubs-kicker text-meta">{ kicker ?? "Full publication list" }</p>
        <h2 className="dr-pubs-title text-h3">{ title ?? "Every paper, chapter and report, with links." }</h2>
        <p className="dr-pubs-lede text-large">
          { lede ?? (
            <>
              Compiled from <a href={ scholarProfileUrl } target="_blank" rel="noreferrer">Google Scholar</a>,{" "}
              <a href={ orcidUrl } target="_blank" rel="noreferrer">ORCID</a> and the curriculum vitae annexure.
            </>
          ) }
        </p>
      </header>
      { groups.map( ( group ) => (
        <div key={ group.kind } className={ cn( "dr-pubs-group", `is-${ group.kind }` ) }>
          <h3 className="dr-pubs-group-label text-small">
            <span>{ publicationKindHeading[ group.kind ] }</span>
            <span className="dr-pubs-group-count">{ group.items.length }</span>
          </h3>
          <PublicationRows group={ group } />
        </div>
      ) ) }
      { allHref && (
        <div className="dr-pubs-more">
          <SmartLink href={ allHref } className="dr-home-blog-all text-small">
            { allLabel ?? "More research" }
            <ArrowUpRight aria-hidden className="size-4" />
          </SmartLink>
        </div>
      ) }
    </section>
  );
}

function PublicationLink( { item }: { item: Publication } ) {
  return (
    <a className="dr-pub-title text-large" href={ item.href } target="_blank" rel="noreferrer">
      { item.title }
      <ArrowUpRight className="dr-pub-arrow" aria-hidden />
    </a>
  );
}

/* Each kind of written work is drawn its own way, so a reader can see the difference between a
   paper, a chapter, a case and an abstract before reading a word of it. */
function PublicationRows( { group }: { group: PublicationGroup } ) {
  if ( group.kind === "review" ) {
    return (
      <ol className="dr-pubs-items">
        { group.items.map( ( item ) => (
          <li key={ item.href + item.title } className="dr-pub-chapter">
            <p className="dr-pub-in text-small">In <em>{ item.venue }</em></p>
            <PublicationLink item={ item } />
            <p className="dr-pub-meta text-small">{ item.authors }, { item.year }</p>
          </li>
        ) ) }
      </ol>
    );
  }
  if ( group.kind === "case" ) {
    return (
      <ol className="dr-pubs-items">
        { group.items.map( ( item ) => (
          <li key={ item.href + item.title } className="dr-pub-case">
            <PublicationLink item={ item } />
            <p className="dr-pub-meta text-small">
              <em>{ item.venue }</em> · { item.year }
            </p>
          </li>
        ) ) }
      </ol>
    );
  }
  if ( group.kind === "abstract" ) {
    return (
      <ol className="dr-pubs-items">
        { group.items.map( ( item ) => (
          <li key={ item.href + item.title } className="dr-pub-abstract">
            <span className="dr-pub-year text-meta">{ item.year }</span>
            <div className="dr-pub-body">
              <PublicationLink item={ item } />
              <p className="dr-pub-meta text-small">{ item.venue }</p>
            </div>
          </li>
        ) ) }
      </ol>
    );
  }
  return (
    <ol className="dr-pubs-items">
      { group.items.map( ( item ) => (
        <li key={ item.href + item.title } className="dr-pub-paper">
          <span className="dr-pub-year text-meta">{ item.year }</span>
          <div className="dr-pub-body">
            <PublicationLink item={ item } />
            <p className="dr-pub-meta text-small">{ item.authors }</p>
            <p className="dr-pub-meta text-small"><em>{ item.venue }</em></p>
          </div>
        </li>
      ) ) }
    </ol>
  );
}
