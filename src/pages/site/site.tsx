import type { ReactNode } from "react";
import { Stethoscope } from "lucide-react";

import { ContactDetails } from "@/components/contact-details/contact-details";
import { ContactDetailsForm, type EnquiryField } from "@/components/contact-details/contact-details-form";
import { TextLink } from "@/components/base/text-link";
import { hazelHouse } from "@/style-packs/hazel-house";

import {
  ArticleBody,
  CareJourney,
  CinematicWork,
  ClosingCta,
  CredentialColumns,
  DoctorFooter,
  DoctorHero,
  DrFaq,
  FullBleedHero,
  HiwAssess,
  HiwBenefits,
  HiwChart,
  HiwConsult,
  HiwCta,
  HiwFaq,
  HiwHero,
  HiwPill,
  HiwPlan,
  HiwProcess,
  HiwSplit,
  HiwTrack,
  HomeBlogSection,
  LeadQuestions,
  MediaGallery,
  NamasteIntro,
  PressSection,
  ProseSection,
  PublicationList,
  StatementBand,
  StoryProse,
  TopicGrid,
  WhyItMatters,
  type JourneyStep,
} from "./doctor-sections";
import { faqsIn, type FaqGroup } from "./content";
import { mediaUrl } from "./api";
import { hiw, home } from "./media";
import type { SitePhoto } from "./media";
import type { PublicationGroup } from "./publications";
import { iconOf } from "./icons";
import { sendConsultationRequest } from "./enquiry";
import { Img } from "./parts";
import { PagedMedia, PagedPosts } from "./paged";
import { mergeCopy } from "./copy";
import { Paras, Rich } from "./rich";
import type { SiteData } from "./site-data";
import type { SiteContent, SiteEntry } from "./types";

/* Copy names an image by key, so the panel can move a photo between sections without a redeploy.
   An uploaded picture arrives as a link instead, and a name the panel got wrong still shows a
   bundled photo rather than a hole. */
const photos: Record<string, SitePhoto> = { ...home, ...hiw };
/* A page that stores its picture as one word holds either a bundled name or an uploaded link, so a
   link in the name's place resolves as a link instead of falling through to the standby photo. */
const looksLikeLink = ( value: string ) => value.startsWith( "/" ) || /^([a-z][a-z0-9+.-]*:)?\/\//i.test( value );

const photoOf = ( key?: string, url?: string, alt?: string ): SitePhoto => {
  const bundled = key ? photos[ key ] : undefined;
  if ( bundled ) return bundled;
  const link = mediaUrl( key && looksLikeLink( key ) ? key : url );
  return link ? { src: link, alt: alt ?? "" } : home.ageingCouple;
};

/* One icon covers every list: a name the panel gets wrong still shows a picture rather than a hole. */
const FALLBACK_ICON = Stethoscope;

const pillTone = ( tone?: string ) => ( tone === "outline" || tone === "teal" || tone === "blue" || tone === "gold" ? tone : "white" );

function Pills( { items }: { items?: { label: string; href: string; tone?: string }[] } ): ReactNode {
  if ( !items || items.length === 0 ) return null;
  return items.map( ( item, i ) => (
    <HiwPill key={ i } href={ item.href } tone={ pillTone( item.tone ) }>{ item.label }</HiwPill>
  ) );
}

/* A line in a credentials block: plain words, an underlined link, or a bare anchor. */
interface CopyEntry {
  id: string;
  text: string;
  meta?: string;
  href?: string;
  via?: string;
  newTab?: boolean;
}

function entryLabel( entry: CopyEntry ): ReactNode {
  if ( !entry.href ) return <Rich text={ entry.text } />;
  if ( entry.via === "text" ) {
    return <TextLink href={ entry.href } target={ entry.newTab ? "_blank" : undefined }>{ entry.text }</TextLink>;
  }
  return (
    <a href={ entry.href } target={ entry.newTab ? "_blank" : undefined } rel={ entry.newTab ? "noreferrer" : undefined }>
      { entry.text }
    </a>
  );
}

const credBlocks = ( columns: { title: string; entries: CopyEntry[] }[][] ) => columns.map(
  column => column.map( block => ( {
    title: block.title,
    entries: block.entries.map( entry => ( { id: entry.id, label: entryLabel( entry ), meta: entry.meta } ) ),
  } ) ),
);

const stepsIn = ( steps: { id: string; label: string; color: string; icon?: string }[] ) => steps.map(
  step => ( { ...step, icon: iconOf( step.icon, FALLBACK_ICON ) } ),
);

const rowsIn = ( rows: { id: string; color: string; icon?: string; left: { title: string; text: string }; right: { title: string; text: string } }[] ) => rows.map(
  row => ( { ...row, icon: iconOf( row.icon, FALLBACK_ICON ) } ),
);

const benefitsIn = ( items: { id: string; title: string; paragraphs: string[]; icon?: string }[] ) => items.map(
  item => ( { ...item, icon: iconOf( item.icon, FALLBACK_ICON ) } ),
);

const tones: Record<string, JourneyStep[ "tone" ] > = { yellow: "yellow", black: "black", red: "red" };

const journeyIn = ( steps: { id: string; title: string; text: string; icon?: string; tone?: string }[] ): JourneyStep[] => steps.map(
  step => ( { ...step, tone: tones[ step.tone || "" ] || "yellow", icon: iconOf( step.icon, FALLBACK_ICON ) } ),
);

/* The home page shows a handful of papers in date order; the research page shows the whole record. */
const takePublications = ( groups: PublicationGroup[], limit: number ): PublicationGroup[] => {
  const out: PublicationGroup[] = [];
  let left = Math.max( 0, limit );
  for ( const group of groups ) {
    if ( left === 0 ) break;
    const items = group.items.slice( 0, left );
    left -= items.length;
    if ( items.length > 0 ) out.push( { ...group, items } );
  }
  return out;
};

/* A contact page line: a link, one of the social accounts, or a paragraph of its own. */
interface CopyItem {
  text?: string;
  href?: string;
  socials?: boolean;
}

/* The enquiry form is just another contact line, so its whole model lives in the copy. */
interface ContactFormCopy {
  submitLabel: string;
  thanks?: string;
  received?: string;
  offline?: string;
  invalid?: string;
  fields: Record<string, unknown>[];
}

interface ContactRowCopy {
  id: string;
  label: string;
  anchor?: string;
  text?: string | string[];
  items?: CopyItem[];
  form?: ContactFormCopy;
}

function ContactRowItems( { items, social }: { items: CopyItem[]; social: { label: string; href: string }[] } ): ReactNode {
  const out: ReactNode[] = [];
  items.forEach( ( item, i ) => {
    if ( item.socials ) {
      social.forEach( account => out.push(
        <TextLink key={ account.href } href={ account.href } target="_blank" rel="noreferrer">{ account.label }</TextLink>,
      ) );
    } else if ( item.href ) {
      out.push( <TextLink key={ i } href={ item.href }>{ item.text }</TextLink> );
    } else {
      out.push( <p key={ i }><Rich text={ item.text } /></p> );
    }
  } );
  return out;
}

/* The one line a search result or a chat preview shows, read out of the page's own wording. */
const plainText = ( value: unknown, depth = 0 ): string => {
  if ( depth > 3 ) return "";
  if ( typeof value === "string" ) return value.replace( /\[(.+?)\]\([^)]*\)/g, "$1" ).replace( /[*_]/g, "" ).trim();
  if ( Array.isArray( value ) ) return value.map( one => plainText( one, depth + 1 ) ).find( Boolean ) ?? "";
  if ( value && typeof value === "object" ) {
    for ( const key of [ "lede", "text", "body", "note" ] ) {
      const line = plainText( ( value as Record<string, unknown > )[ key ], depth + 1 );
      if ( line ) return line;
    }
  }
  return "";
};

const atPath = ( blob: unknown, path: string ) =>
  path.split( "." ).reduce<unknown>( ( current, key ) => ( ( current ?? {} ) as Record<string, unknown > )[ key ], blob );

const seoLine = ( blob: unknown ): string | undefined => {
  for ( const path of [ "hero.lede", "hero.text", "lede", "story.body", "statement.body", "intro.body", "body" ] ) {
    const line = plainText( atPath( blob, path ) );
    if ( line.length > 60 ) return line.length > 158 ? `${ line.slice( 0, 155 ).replace( /\s+\S*$/, "" ) }…` : line;
  }
  return undefined;
};

interface SeoCopy {
  indexable?: boolean;
  title?: string;
  description?: string;
  keywords?: string;
  og_image?: string;
  og_image_url?: string;
  og_image_alt?: string;
  pages?: Record<string, { title?: string; description?: string }>;
}

/* A preview card is fetched by a crawler on another machine, so it needs the whole address rather
   than a path that only means something on this site. */
const absoluteUrl = ( src: string ): string => {
  if ( !src ) return "";
  try {
    return new URL( src, window.location.origin ).href;
  } catch {
    return src;
  }
};

/* The share picture the doctor chose. With nothing chosen the head keeps the preview card that
   ships in the site's own files, which is drawn to be seen beside a link. */
const seoImage = ( seo: SeoCopy ): { src: string; alt: string } => {
  if ( !seo.og_image && !seo.og_image_url ) return { src: "", alt: seo.og_image_alt ?? "" };
  const photo = photoOf( seo.og_image, seo.og_image_url, seo.og_image_alt );
  return { src: absoluteUrl( photo.src ), alt: photo.alt || seo.og_image_alt || "" };
};

/* Built per render so a CMS edit can replace anything below without a redeploy. */
export function buildSite( data: SiteData ): SiteContent {
  const copy = mergeCopy( data.copy );
  const word = copy.global;
  const seo = ( word.seo ?? {} ) as SeoCopy;
  const front = copy.home;
  const hiwPage = copy[ "how-it-works" ];
  const labels = word.labels;

  const faqsFor = ( group: string ) => faqsIn( data.faqs, group as FaqGroup );

  const site: SiteContent = {
    name: "site",
    title: seo.title || word.titles.home,
    titleSuffix: word.titles.suffix,
    person: {
      name: word.brand.name,
      role: word.brand.role,
      place: word.brand.place,
      topics: word.brand.strip.split( "·" ).map( ( one: string ) => one.trim() ),
      email: word.contact.email,
      phone: word.contact.phone,
      orcid: word.contact.orcid,
      scholar: word.contact.scholar,
      social: word.footer.social.map( ( one: { href: string } ) => one.href ),
    },
    pack: hazelHouse,
    layout: "margin",
    header: {
      name: word.brand.name,
      role: word.brand.role,
      strip: word.brand.strip,
      place: word.brand.place,
      photo: photoOf( word.brand.logo ),
      links: word.nav.links,
      phone: { label: word.nav.phone.label, href: word.contact.phoneHref },
      cta: word.nav.cta,
      collaborate: word.nav.collaborate,
      aria: {
        primary: labels.primaryMenu,
        drawer: labels.drawerMenu,
        open: labels.openMenu,
        close: labels.closeMenu,
      },
    },
    footer: (
      <DoctorFooter
        name={ word.footer.name }
        note={ word.footer.note }
        links={ [ ...word.nav.links, word.nav.pathway, word.nav.contact ].filter(
          ( link, index, all ) => all.findIndex( other => other.href === link.href ) === index
        ) }
        email={ word.contact.email }
        phone={ word.contact.phone }
        cvHref={ word.contact.cv }
        social={ word.footer.social }
        copyright={ word.footer.copyright }
        cta={ word.footer.cta }
        cvLabel={ labels.downloadCv }
        navLabel={ labels.footerMenu }
      />
    ),
    hero: (
      <DoctorHero
        eyebrow={ front.hero.eyebrow }
        title={ <Rich text={ front.hero.title } /> }
        lede={ <Rich text={ front.hero.lede } /> }
        primary={ front.hero.primary }
        secondary={ front.hero.secondary }
        ticks={ front.hero.ticks }
        photo={ photoOf( front.hero.photo, front.hero.photo_url, front.hero.photo_alt ) }
        bandTitle={ front.hero.bandTitle }
        bandItems={ front.hero.bandItems.map( item => ( { icon: iconOf( item.icon, FALLBACK_ICON ), label: item.label } ) ) }
      />
    ),
    after: (
      <>
        { front.namaste.show && (
          <NamasteIntro
            eyebrow={ front.namaste.eyebrow }
            title={ <Rich text={ front.namaste.title } /> }
            body={ <Paras lines={ front.namaste.body } /> }
            name={ front.namaste.name }
            credentials={ front.namaste.credentials }
            marks={ front.namaste.marks }
            marksLabel={ labels.trustedAt }
          />
        ) }
        { front.work.show && (
          <CinematicWork
            id="work"
            kicker={ front.work.kicker }
            title={ <Rich text={ front.work.title } /> }
            caption={ front.work.caption }
            photo={ photoOf( front.work.photo, front.work.photo_url, front.work.photo_alt ) }
            areas={ front.work.areas }
            introTitle={ labels.whereIFocus }
            learnMore={ labels.learnMore }
          />
        ) }
        { front.impact.show && (
          <TopicGrid
            kicker={ front.impact.kicker }
            title={ <Rich text={ front.impact.title } /> }
            items={ front.impact.items }
          />
        ) }
        { front.why.show && (
          <WhyItMatters
            kicker={ front.why.kicker }
            title={ <Rich text={ front.why.title } /> }
            body={ <Paras lines={ front.why.body } /> }
            items={ front.why.items }
            quote={ <Rich text={ front.why.quote } /> }
            quoteName={ front.why.quoteName }
            quotePlace={ front.why.quotePlace }
            quoteRole={ front.why.quoteRole }
            quoteLink={ front.why.quoteLink }
            photo={ photoOf( front.why.photo, front.why.photo_url, front.why.photo_alt ) }
          />
        ) }
        { front.research.show && (
          <PublicationList
            groups={ takePublications( data.publications, front.research.limit ) }
            kicker={ front.research.kicker }
            title={ front.research.title }
            lede={ <Rich text={ front.research.lede } /> }
            allHref={ front.research.allHref }
            allLabel={ labels.moreResearch }
          />
        ) }
        { front.teaching.show && (
          <StatementBand
            kicker={ front.teaching.kicker }
            cta={ front.teaching.cta }
            note={ front.teaching.note }
          >
            <Paras lines={ front.teaching.body } />
          </StatementBand>
        ) }
        { front.journey.show && (
          <CareJourney
            kicker={ front.journey.kicker }
            title={ <Rich text={ front.journey.title } /> }
            lede={ <Rich text={ front.journey.lede } /> }
            steps={ journeyIn( front.journey.steps ) }
          />
        ) }
        { front.media.show && (
          <MediaGallery
            kicker={ front.media.kicker }
            title={ front.media.title }
            items={ data.videos.slice( 0, front.media.limit ) }
            allHref={ front.media.allHref }
            allLabel={ labels.allVideos }
            playLabel={ labels.playVideo }
          />
        ) }
        { front.blog.show && (
          <HomeBlogSection
            kicker={ front.blog.kicker }
            title={ <Rich text={ front.blog.title } /> }
            lede={ <Paras lines={ front.blog.lede } /> }
            posts={ data.posts }
            allHref={ front.blog.allHref }
            allLabel={ labels.allArticles }
            labels={ { read: labels.readArticle, minutes: labels.readMinutes } }
          />
        ) }
        { front.cta.show && (
          <HiwCta
            variant="doctor"
            kicker={ front.cta.kicker }
            title={ <Rich text={ front.cta.title } /> }
            accent={ front.cta.accent }
            action={ <Pills items={ front.cta.pills } /> }
            note={ front.cta.note }
          >
            <Paras lines={ front.cta.body } />
          </HiwCta>
        ) }
        { front.faq.show && (
          <DrFaq
            title={ <span><Rich text={ front.faq.title } /></span> }
            lede={ <Rich text={ front.faq.lede } /> }
            link={ front.faq.link }
            items={ faqsFor( front.faq.group ) }
          />
        ) }
        { front.closing.show && (
          <ClosingCta
            id="collaboration"
            kicker={ front.closing.kicker }
            title={ <Rich text={ front.closing.title } /> }
            lede={ <Rich text={ front.closing.lede } /> }
            primary={ front.closing.primary }
            secondary={ front.closing.secondary }
            note={ front.closing.note }
          />
        ) }
      </>
    ),
    pages: {
      about: {
        title: copy.about.title,
        content: (
          <>
            { copy.about.hero.show && (
              <FullBleedHero
                kicker={ copy.about.hero.kicker }
                title={ <Rich text={ copy.about.hero.title } /> }
                lede={ <Paras lines={ copy.about.hero.lede } /> }
                photo={ photoOf( copy.about.hero.photo ) }
              />
            ) }
            { copy.about.lead.show && (
              <LeadQuestions
                kicker={ copy.about.lead.kicker }
                title={ <Rich text={ copy.about.lead.title } /> }
                questions={ copy.about.lead.questions.map( ( question, i ) => <Rich key={ i } text={ question } /> ) }
                cta={ copy.about.lead.cta }
              />
            ) }
            { copy.about.story.show && (
              <StoryProse
                kicker={ copy.about.story.kicker }
                photos={ copy.about.story.photos.filter( Boolean ).map( ( photo ) => photoOf( photo ) ) }
                signature={ copy.about.story.signature }
              >
                <Paras lines={ copy.about.story.body } />
              </StoryProse>
            ) }
            { copy.about.statement.show && (
              <StatementBand
                kicker={ copy.about.statement.kicker }
                cta={ copy.about.statement.cta }
                note={ copy.about.statement.note }
              >
                <Paras lines={ copy.about.statement.body } />
              </StatementBand>
            ) }
            { copy.about.credentials.show && <CredentialColumns columns={ credBlocks( copy.about.credentials.columns ) } /> }
            { copy.about.closing.show && (
              <ClosingCta
                kicker={ copy.about.closing.kicker }
                title={ <Rich text={ copy.about.closing.title } /> }
                lede={ <Rich text={ copy.about.closing.lede } /> }
                primary={ copy.about.closing.primary }
                secondary={ copy.about.closing.secondary }
                note={ copy.about.closing.note }
              />
            ) }
          </>
        ),
      },
      research: {
        title: copy.research.title,
        content: (
          <>
            { copy.research.hero.show && (
              <FullBleedHero
                kicker={ copy.research.hero.kicker }
                title={ <Rich text={ copy.research.hero.title } /> }
                lede={ <Paras lines={ copy.research.hero.lede } /> }
                photo={ photoOf( copy.research.hero.photo ) }
              />
            ) }
            { copy.research.lead.show && (
              <LeadQuestions
                kicker={ copy.research.lead.kicker }
                title={ <Rich text={ copy.research.lead.title } /> }
                questions={ copy.research.lead.questions.map( ( question, i ) => <Rich key={ i } text={ question } /> ) }
                cta={ copy.research.lead.cta }
              />
            ) }
            { copy.research.story.show && (
              <StoryProse
                kicker={ copy.research.story.kicker }
                photos={ copy.research.story.photos.filter( Boolean ).map( ( photo ) => photoOf( photo ) ) }
                signature={ copy.research.story.signature }
              >
                <Paras lines={ copy.research.story.body } />
              </StoryProse>
            ) }
            { copy.research.statement.show && (
              <StatementBand
                kicker={ copy.research.statement.kicker }
                cta={ copy.research.statement.cta }
                note={ copy.research.statement.note }
              >
                <Paras lines={ copy.research.statement.body } />
              </StatementBand>
            ) }
            { copy.research.credentials.show && <CredentialColumns columns={ credBlocks( copy.research.credentials.columns ) } /> }
            { copy.research.publications.show && (
              <PublicationList
                groups={ data.publications }
                kicker={ copy.research.publications.kicker }
                title={ copy.research.publications.title }
                lede={ <Rich text={ copy.research.publications.lede } /> }
              />
            ) }
            { copy.research.closing.show && (
              <ClosingCta
                kicker={ copy.research.closing.kicker }
                title={ <Rich text={ copy.research.closing.title } /> }
                lede={ <Rich text={ copy.research.closing.lede } /> }
                primary={ copy.research.closing.primary }
                secondary={ copy.research.closing.secondary }
                note={ copy.research.closing.note }
              />
            ) }
          </>
        ),
      },
      /* Parked wording: the panel still edits it, but the route below is handed to the
         consultation walk at the end of this file. Restore by dropping that handover. */
      "healthy-ageing": {
        title: copy[ "healthy-ageing" ].title,
        content: (
          <>
            { copy[ "healthy-ageing" ].hero.show && (
              <FullBleedHero
                kicker={ copy[ "healthy-ageing" ].hero.kicker }
                title={ <Rich text={ copy[ "healthy-ageing" ].hero.title } /> }
                lede={ <Paras lines={ copy[ "healthy-ageing" ].hero.lede } /> }
                photo={ photoOf( copy[ "healthy-ageing" ].hero.photo, copy[ "healthy-ageing" ].hero.photo_url, copy[ "healthy-ageing" ].hero.photo_alt ) }
              />
            ) }
            { copy[ "healthy-ageing" ].lead.show && (
              <LeadQuestions
                kicker={ copy[ "healthy-ageing" ].lead.kicker }
                title={ <Rich text={ copy[ "healthy-ageing" ].lead.title } /> }
                questions={ copy[ "healthy-ageing" ].lead.questions.map( ( question, i ) => <Rich key={ i } text={ question } /> ) }
                cta={ copy[ "healthy-ageing" ].lead.cta }
              />
            ) }
            { copy[ "healthy-ageing" ].story.show && (
              <StoryProse
                kicker={ copy[ "healthy-ageing" ].story.kicker }
                photos={ copy[ "healthy-ageing" ].story.photos.filter( Boolean ).map( key => photoOf( key ) ) }
                signature={ copy[ "healthy-ageing" ].story.signature }
              >
                <Paras lines={ copy[ "healthy-ageing" ].story.body } />
              </StoryProse>
            ) }
            { copy[ "healthy-ageing" ].statement.show && (
              <StatementBand
                kicker={ copy[ "healthy-ageing" ].statement.kicker }
                cta={ copy[ "healthy-ageing" ].statement.cta }
                note={ copy[ "healthy-ageing" ].statement.note }
              >
                <Paras lines={ copy[ "healthy-ageing" ].statement.body } />
              </StatementBand>
            ) }
            { copy[ "healthy-ageing" ].credentials.show && <CredentialColumns columns={ credBlocks( copy[ "healthy-ageing" ].credentials.columns ) } /> }
            { copy[ "healthy-ageing" ].closing.show && (
              <ClosingCta
                kicker={ copy[ "healthy-ageing" ].closing.kicker }
                title={ <Rich text={ copy[ "healthy-ageing" ].closing.title } /> }
                lede={ <Rich text={ copy[ "healthy-ageing" ].closing.lede } /> }
                primary={ copy[ "healthy-ageing" ].closing.primary }
                secondary={ copy[ "healthy-ageing" ].closing.secondary }
                note={ copy[ "healthy-ageing" ].closing.note }
              />
            ) }
          </>
        ),
      },
      "how-it-works": {
        title: hiwPage.title,
        content: (
          <>
            { hiwPage.hero.show && (
              <HiwHero
                title={ <Rich text={ hiwPage.hero.title } /> }
                lede={ <Paras lines={ hiwPage.hero.lede } /> }
                action={ <Pills items={ [ hiwPage.hero.pill ] } /> }
                note={ hiwPage.hero.note }
                photo={ photoOf( hiwPage.hero.photo ) }
              />
            ) }
            { hiwPage.help.show && (
              <HiwSplit
                kicker={ hiwPage.help.kicker }
                title={ <Rich text={ hiwPage.help.title } /> }
                photo={ photoOf( hiwPage.help.photo ) }
                action={ <Pills items={ [ hiwPage.help.pill ] } /> }
                note={ hiwPage.help.note }
              >
                <Paras lines={ hiwPage.help.body } />
              </HiwSplit>
            ) }
            { hiwPage.process.show && (
              <HiwProcess
                kicker={ hiwPage.process.kicker }
                title={ <Rich text={ hiwPage.process.title } /> }
                steps={ stepsIn( hiwPage.process.steps ) }
              />
            ) }
            { hiwPage.first.show && (
              <HiwSplit
                kicker={ hiwPage.first.kicker }
                title={ <Rich text={ hiwPage.first.title } /> }
                photo={ photoOf( hiwPage.first.photo ) }
                checks={ hiwPage.first.checks }
              >
                <Paras lines={ hiwPage.first.body } />
              </HiwSplit>
            ) }
            { hiwPage.assess.show && (
              <HiwAssess
                kicker={ hiwPage.assess.kicker }
                title={ <Rich text={ hiwPage.assess.title } /> }
                rows={ rowsIn( hiwPage.assess.rows ) }
              />
            ) }
            { hiwPage.consult.show && (
              <HiwConsult
                kicker={ hiwPage.consult.kicker }
                title={ <Rich text={ hiwPage.consult.title } /> }
                icon={ iconOf( hiwPage.consult.icon, FALLBACK_ICON ) }
                photo={ photoOf( hiwPage.consult.photo ) }
                cardTitle={ hiwPage.consult.cardTitle }
                cardText={ hiwPage.consult.cardText }
                cardName={ hiwPage.consult.cardName }
                cardMeta={ hiwPage.consult.cardMeta }
              >
                <Paras lines={ hiwPage.consult.body } />
              </HiwConsult>
            ) }
            { hiwPage.plan.show && (
              <HiwPlan
                kicker={ hiwPage.plan.kicker }
                title={ <Rich text={ hiwPage.plan.title } /> }
                action={ <Pills items={ [ hiwPage.plan.pill ] } /> }
              >
                <Paras lines={ hiwPage.plan.body } />
              </HiwPlan>
            ) }
            { hiwPage.benefits.show && <HiwBenefits items={ benefitsIn( hiwPage.benefits.items ) } /> }
            { hiwPage.track.show && (
              <HiwTrack
                kicker={ hiwPage.track.kicker }
                title={ <Rich text={ hiwPage.track.title } /> }
                media={
                  <HiwChart
                    name={ hiwPage.track.chart.name }
                    metric={ hiwPage.track.chart.metric }
                    unit={ hiwPage.track.chart.unit }
                    domain={ hiwPage.track.chart.domain as [ number, number ] }
                    bands={ hiwPage.track.chart.bands }
                    points={ hiwPage.track.chart.points }
                    riskLabel={ labels.riskRanges }
                  />
                }
              >
                <Paras lines={ hiwPage.track.body } />
              </HiwTrack>
            ) }
            { hiwPage.faq.show && (
              <HiwFaq title={ <Rich text={ hiwPage.faq.title } /> } items={ faqsFor( hiwPage.faq.group ) } />
            ) }
            { hiwPage.cta.show && (
              <HiwCta
                kicker={ hiwPage.cta.kicker }
                title={ <Rich text={ hiwPage.cta.title } /> }
                accent={ hiwPage.cta.accent }
                action={ <Pills items={ hiwPage.cta.pills } /> }
                note={ hiwPage.cta.note }
              >
                <Paras lines={ hiwPage.cta.body } />
              </HiwCta>
            ) }
          </>
        ),
      },
      teaching: {
        title: copy.teaching.title,
        content: (
          <div className="dr-teach">
            { copy.teaching.hero.show && (
              <HiwHero
                title={ <Rich text={ copy.teaching.hero.title } /> }
                lede={ <Paras lines={ copy.teaching.hero.lede } /> }
                action={ <Pills items={ [ copy.teaching.hero.pill ] } /> }
                note={ copy.teaching.hero.note }
                photo={ photoOf( copy.teaching.hero.photo ) }
              />
            ) }
            { copy.teaching.why.show && (
              <HiwSplit
                kicker={ copy.teaching.why.kicker }
                title={ <Rich text={ copy.teaching.why.title } /> }
                photo={ photoOf( copy.teaching.why.photo ) }
                action={ <Pills items={ [ copy.teaching.why.pill ] } /> }
              >
                <Paras lines={ copy.teaching.why.body } />
              </HiwSplit>
            ) }
            { copy.teaching.process.show && (
              <HiwProcess
                kicker={ copy.teaching.process.kicker }
                title={ <Rich text={ copy.teaching.process.title } /> }
                steps={ stepsIn( copy.teaching.process.steps ) }
              />
            ) }
            { copy.teaching.topics.show && (
              <HiwAssess
                kicker={ copy.teaching.topics.kicker }
                title={ <Rich text={ copy.teaching.topics.title } /> }
                rows={ rowsIn( copy.teaching.topics.rows ) }
              />
            ) }
            { copy.teaching.leadership.show && (
              <HiwConsult
                kicker={ copy.teaching.leadership.kicker }
                title={ <Rich text={ copy.teaching.leadership.title } /> }
                icon={ iconOf( copy.teaching.leadership.icon, FALLBACK_ICON ) }
                photo={ photoOf( copy.teaching.leadership.photo ) }
                cardTitle={ copy.teaching.leadership.cardTitle }
                cardText={ copy.teaching.leadership.cardText }
                cardName={ copy.teaching.leadership.cardName }
                cardMeta={ copy.teaching.leadership.cardMeta }
              >
                <Paras lines={ copy.teaching.leadership.body } />
              </HiwConsult>
            ) }
            { copy.teaching.benefits.show && <HiwBenefits items={ benefitsIn( copy.teaching.benefits.items ) } /> }
            { copy.teaching.faq.show && (
              <HiwFaq title={ <Rich text={ copy.teaching.faq.title } /> } items={ faqsFor( copy.teaching.faq.group ) } />
            ) }
            { copy.teaching.cta.show && (
              <HiwCta
                kicker={ copy.teaching.cta.kicker }
                title={ <Rich text={ copy.teaching.cta.title } /> }
                accent={ copy.teaching.cta.accent }
                action={ <Pills items={ copy.teaching.cta.pills } /> }
                note={ copy.teaching.cta.note }
              >
                <Paras lines={ copy.teaching.cta.body } />
              </HiwCta>
            ) }
          </div>
        ),
      },
      media: {
        title: copy.media.title,
        content: (
          <>
            { copy.media.hero.show && (
              <FullBleedHero
                kicker={ copy.media.hero.kicker }
                title={ <Rich text={ copy.media.hero.title } /> }
                lede={ <Paras lines={ copy.media.hero.lede } /> }
                photo={ photoOf( copy.media.hero.photo ) }
              />
            ) }
            { copy.media.gallery.show && (
              <PagedMedia
                kicker={ copy.media.gallery.kicker }
                title={ copy.media.gallery.title }
                seed={ data.videos }
                playLabel={ labels.playVideo }
                moreLabel={ labels.olderMedia }
              />
            ) }
            { copy.media.press.show && (
              <PressSection
                kicker={ copy.media.press.kicker }
                title={ copy.media.press.title }
                lede={ copy.media.press.lede }
                items={ data.press }
                readLabel={ labels.readArticle }
              />
            ) }
            { copy.media.closing.show && (
              <ClosingCta
                kicker={ copy.media.closing.kicker }
                title={ <Rich text={ copy.media.closing.title } /> }
                lede={ <Rich text={ copy.media.closing.lede } /> }
                primary={ copy.media.closing.primary }
                secondary={ copy.media.closing.secondary }
              />
            ) }
          </>
        ),
      },
      blog: {
        title: copy.blog.title,
        content: (
          <PagedPosts
            seed={ data.posts }
            heading={ copy.blog.title }
            author={ copy.blog.list.author }
            avatar={ photoOf( copy.blog.list.avatar ) }
            olderLabel={ labels.olderArticles }
            labels={ {
              read: labels.readArticle,
              minutes: labels.readMinutes,
              continue: labels.continueReading,
              by: labels.byline,
              older: labels.olderArticles,
            } }
          />
        ),
      },
      contact: {
        title: copy.contact.title,
        content: (
          <ContactDetails
            title={ <Rich text={ copy.contact.heading } /> }
            media={ <Img photo={ photoOf( copy.contact.photo ) } /> }
            rows={ copy.contact.rows.map( ( entry ) => {
              const row = entry as unknown as ContactRowCopy;
              const form = row.form;
              const lines = Array.isArray( row.text ) ? row.text : undefined;
              const note = typeof row.text === "string" ? row.text : "";
              if ( form ) {
                return {
                  id: row.id,
                  label: row.label,
                  wide: true,
                  content: (
                    <>
                      <p id={ row.anchor } className="scroll-mt-[calc(var(--site-header-height)_+_5.5rem)]">
                        <Rich text={ note } />
                      </p>
                      <ContactDetailsForm
                        submitLabel={ form.submitLabel }
                        fields={ form.fields as unknown as EnquiryField[] }
                        onSend={ ( values, fields ) => sendConsultationRequest( values, fields, {
                          thanks: form.thanks,
                          received: form.received,
                          offline: form.offline,
                          invalid: form.invalid,
                        } ) }
                      />
                    </>
                  ),
                };
              }
              if ( lines ) {
                return { id: row.id, label: row.label, content: <Paras lines={ lines } /> };
              }
              if ( row.items ) {
                return { id: row.id, label: row.label, content: <ContactRowItems items={ row.items } social={ word.footer.social } /> };
              }
              return { id: row.id, label: row.label, content: <p><Rich text={ note } /></p> };
            } ) }
          />
        ),
      },
    },
    items: {
      blog: ( slug ) => {
        const post = data.posts.find( found => found.slug === slug );
        if ( !post ) return undefined;
        return {
          title: post.title,
          content: (
            <>
              <FullBleedHero
                kicker={ post.topic }
                title={ <Rich text={ post.title } /> }
                lede={ <Paras lines={ [ post.excerpt ] } /> }
                photo={ post.photo }
              />
              <ProseSection ground="paper"><ArticleBody blocks={ post.blocks } lines={ post.body } /></ProseSection>
              <ClosingCta
                kicker={ copy.article.closing.kicker }
                title={ <Rich text={ copy.article.closing.title } /> }
                lede={ <Rich text={ copy.article.closing.lede } /> }
                primary={ copy.article.closing.primary }
                secondary={ copy.article.closing.secondary }
              />
            </>
          ),
        };
      },
    },
  };

  const described = ( key: string ) => seoLine( copy[ key ] );
  /* The consultation walk is the healthy ageing page: one address, /healthy-ageing, and the old
     one redirects in the router. The programme wording stays in the bundle, unrendered. */
  const pages: Record<string, SiteEntry> = { ...( site.pages ?? {} ) };
  pages[ "healthy-ageing" ] = { ...pages[ "how-it-works" ], title: copy[ "healthy-ageing" ].title, description: seoLine( hiwPage ) };
  delete pages[ "how-it-works" ];
  const seoPages = seo.pages ?? {};
  return {
    ...site,
    description: seo.description || described( "home" ),
    image: seoImage( seo ),
    keywords: seo.keywords ?? "",
    indexable: seo.indexable !== false,
    pages: Object.fromEntries(
      Object.entries( pages ).map( ( [ key, entry ] ) => {
        /* A line written in the panel's SEO section is used exactly as it stands; blank means the
           page's own name and its own first paragraph. */
        const own = seoPages[ key ] ?? {};
        return [ key, {
          ...entry,
          title: own.title || entry.title,
          description: own.description || entry.description || described( key ),
        } ];
      } )
    ),
  };
}
