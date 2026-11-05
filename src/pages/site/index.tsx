import { useEffect, useLayoutEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

import NotFound from "@/pages/not-found";

import { startAnalytics } from "./analytics";
import { buildSite } from "./site";
import { useSiteData } from "./site-data";
import { SiteTemplate } from "./parts";

/* Write one tag in the head, making it if the static shell never had it. */
function putTag( tag: "meta" | "link", attrs: Record<string, string>, value: string ) {
  if ( !value ) return;
  const [ name, one ] = Object.entries( attrs )[ 0 ];
  let el = document.head.querySelector<HTMLElement>( `${ tag }[${ name }="${ one }"]` );
  if ( !el ) {
    el = document.createElement( tag );
    for ( const [ key, kid ] of Object.entries( attrs ) ) el.setAttribute( key, kid );
    document.head.appendChild( el );
  }
  el.setAttribute( tag === "link" ? "href" : "content", value );
}

const pageUrl = ( pathname: string ) => `${ window.location.origin }${ pathname === "/" ? "/" : pathname.replace( /\/+$/, "" ) }`;

interface PersonBits {
  name: string;
  role: string;
  place: string;
  topics: string[];
  email: string;
  phone: string;
  orcid: string;
  scholar: string;
  social: string[];
}

export function SitePage() {
  const { page, item } = useParams();
  const { hash, pathname } = useLocation();
  const site = buildSite( useSiteData() );
  const subpage = page === undefined ? undefined : item === undefined ? site.pages?.[page] : site.items?.[page]?.( item );
  const title = subpage?.title ? `${ subpage.title } · ${ site.titleSuffix }` : site.title;
  const description = subpage?.description ?? site.description ?? "";
  /* Plain strings, so the head is rewritten when a value changes rather than on every render. */
  const share = site.image?.src ?? "";
  const shareAlt = site.image?.alt ?? "";
  const keywords = site.keywords ?? "";
  const robots = site.indexable === false ? "noindex,nofollow" : "index,follow";
  /* A string to hang the effect on, so a rebuilt site object does not rewrite the head every render. */
  const personKey = JSON.stringify( site.person );

  /* The page the visitor is on is the only thing worth counting, so one line per route. */
  useEffect( () => startAnalytics( pathname ), [ pathname ] );

  useLayoutEffect( () => {
    const target = hash ? document.getElementById( hash.slice( 1 ) ) : null;
    window.scrollTo( 0, target ? target.getBoundingClientRect().top + window.scrollY - ( parseFloat( getComputedStyle( target ).scrollMarginTop ) || 0 ) : 0 );
  }, [ hash, page, item ] );

  useLayoutEffect( () => {
    document.title = title;
  }, [ title ] );

  /* A rendered page has to keep its own head current, or every route shares one preview card. */
  useEffect( () => {
    const url = pageUrl( pathname );
    putTag( "meta", { name: "description" }, description );
    putTag( "meta", { name: "keywords" }, keywords );
    putTag( "meta", { name: "robots" }, robots );
    putTag( "link", { rel: "canonical" }, url );
    putTag( "meta", { property: "og:title" }, title );
    putTag( "meta", { property: "og:description" }, description );
    putTag( "meta", { property: "og:url" }, url );
    putTag( "meta", { property: "og:image" }, share );
    putTag( "meta", { property: "og:image:alt" }, shareAlt );
    putTag( "meta", { name: "twitter:title" }, title );
    putTag( "meta", { name: "twitter:description" }, description );
    putTag( "meta", { name: "twitter:image" }, share );
    putTag( "meta", { name: "twitter:image:alt" }, shareAlt );
  }, [ title, description, pathname, share, shareAlt, keywords, robots ] );

  useEffect( () => {
    const origin = window.location.origin;
    const person = JSON.parse( personKey ) as PersonBits;
    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          "@id": `${ origin }/#person`,
          name: person.name,
          jobTitle: person.role,
          address: { "@type": "PostalAddress", addressCountry: "NP", addressRegion: person.place },
          email: `mailto:${ person.email }`,
          telephone: person.phone,
          url: `${ origin }/`,
          sameAs: [ ...person.social, person.orcid, person.scholar ].filter( Boolean ),
          knowsAbout: person.topics,
        },
        {
          "@type": "WebSite",
          "@id": `${ origin }/#website`,
          name: site.titleSuffix,
          url: `${ origin }/`,
          publisher: { "@id": `${ origin }/#person` },
        },
        {
          "@type": "WebPage",
          "@id": pageUrl( pathname ),
          url: pageUrl( pathname ),
          name: title,
          description,
          isPartOf: { "@id": `${ origin }/#website` },
          about: { "@id": `${ origin }/#person` },
        },
      ],
    };
    const id = "site-json-ld";
    let box = document.getElementById( id ) as HTMLScriptElement | null;
    if ( !box ) {
      box = document.createElement( "script" );
      box.id = id;
      box.type = "application/ld+json";
      document.head.appendChild( box );
    }
    box.textContent = JSON.stringify( graph );
  }, [ personKey, title, description, pathname ] );

  if ( page !== undefined && !subpage ) {
    return <NotFound />;
  }
  return (
    <SiteTemplate name={ site.name } pack={ site.pack } layout={ site.layout } header={ site.header } footer={ site.footer }>
      { subpage ? subpage.content : <>{ site.hero }{ site.after }</> }
    </SiteTemplate>
  );
}
