import { useEffect, useMemo, useState } from "react";
import { ApiError, api, mediaUrl } from "../api/client";
import type { PageCopy } from "../api/types";
import PhotoField from "../components/PhotoField";
import SectionHead from "../components/SectionHead";
import { useToast } from "../components/Toast";
import { PHOTO_OPTIONS } from "../cms/resources";
import { Icon } from "../components/icons";
import { Button, Checkbox, Field, Notice, TextArea, TextInput, formatDate } from "../components/ui";

/* How the site arrives in a search result and in a chat preview. The words live in the same global
   wording row the rest of the panel edits, under its own "seo" key. */

const TITLE_LIMIT = 60;
const LINE_LIMIT = 158;

interface PageLine {
  title: string;
  description: string;
}

interface SeoCopy {
  indexable: boolean;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  og_image_url: string;
  og_image_alt: string;
  pages: Record<string, PageLine>;
}

const PAGES = [
  { key: "about", name: "About", path: "/about" },
  { key: "research", name: "Research", path: "/research" },
  { key: "healthy-ageing", name: "Healthy Ageing", path: "/healthy-ageing" },
  { key: "teaching", name: "Teaching", path: "/teaching" },
  { key: "media", name: "Media", path: "/media" },
  { key: "blog", name: "Insights", path: "/blog" },
  { key: "contact", name: "Contact", path: "/contact" },
];

/* What the site writes for itself when a line here is left blank. Used for the previews and the
   greyed hints only, so a saved blank still means blank and the site keeps working it out. */
const SITE_WORDS = {
  title: "Dr. Ramesh Kandel, Geriatric Medicine in Nepal",
  description:
    "Geriatrician, researcher and academic working across clinical care, research, education and health systems to improve the lives of older people.",
  keywords: "geriatric medicine Nepal, healthy ageing, elderly care, Dr. Ramesh Kandel",
};

const text = ( value: unknown, fallback: string ): string => ( typeof value === "string" ? value : fallback );
const flag = ( value: unknown, fallback: boolean ): boolean => ( typeof value === "boolean" ? value : fallback );

/** The saved block if there is one. Anything the doctor has not written stays blank. */
function readSeo( blob: Record<string, unknown> | undefined ): SeoCopy {
  const saved = ( blob?.seo ?? {} ) as Record<string, unknown>;
  const savedPages = ( saved.pages ?? {} ) as Record<string, Record<string, unknown>>;
  const pages: Record<string, PageLine> = {};
  for ( const page of PAGES ) {
    pages[ page.key ] = { title: text( savedPages[ page.key ]?.title, "" ), description: text( savedPages[ page.key ]?.description, "" ) };
  }
  return {
    indexable: flag( saved.indexable, true ),
    title: text( saved.title, "" ),
    description: text( saved.description, "" ),
    keywords: text( saved.keywords, "" ),
    og_image: text( saved.og_image, "" ),
    og_image_url: text( saved.og_image_url, "" ),
    og_image_alt: text( saved.og_image_alt, "" ),
    pages,
  };
}

/** How long the line has grown, and what happens when it runs past what a result shows. */
function Counter( { value, limit }: { value: string; limit: number } ) {
  const over = value.length > limit;
  return (
    <span className={ `count${ over ? " over" : "" }` }>
      { value.length } of about { limit }
      { over ? <em> the end is cut off in a search result</em> : null }
    </span>
  );
}

/** One search result, drawn as the site will be seen. */
function Serp( { address, title, line, pending }: { address: string; title: string; line: string; pending?: string } ) {
  return (
    <div className="serp">
      <p className="serp-url">{ address }</p>
      <p className="serp-title">{ title }</p>
      { line ? <p className="serp-line">{ line }</p> : <p className="serp-line quiet">{ pending }</p> }
    </div>
  );
}

export default function SeoPage() {
  const toast = useToast();
  const [ row, setRow ] = useState<PageCopy | null>( null );
  const [ seo, setSeo ] = useState<SeoCopy | null>( null );
  const [ failed, setFailed ] = useState("");
  const [ dirty, setDirty ] = useState(false);
  const [ saving, setSaving ] = useState(false);

  useEffect(() => {
    api
      .get<PageCopy>( "/api/cms/pages/global/" )
      .then( result => {
        setRow( result );
        setSeo( readSeo( result.data ) );
      } )
      .catch( ( reason: ApiError ) => setFailed( reason.message ) );
  }, [] );

  /* The name the site hangs after every page title, read from the same wording row being saved. */
  const titles = ( row?.data as Record<string, unknown> | undefined )?.titles as Record<string, unknown> | undefined;
  const suffix = text( titles?.suffix, "Dr. Ramesh Kandel" );
  const homeTitle = seo?.title || SITE_WORDS.title;
  const homeLine = seo?.description || SITE_WORDS.description;
  const lines = useMemo(
    () => ( seo ? PAGES.map( p => ( { ...p, title: `${ seo.pages[ p.key ].title || p.name } · ${ suffix }`, line: seo.pages[ p.key ].description } ) ) : [] ),
    [ seo, suffix ]
  );

  function touch( next: ( current: SeoCopy ) => SeoCopy ) {
    setSeo( current => ( current ? next( current ) : current ) );
    setDirty( true );
  }

  function setLine( key: string, patch: Partial<PageLine> ) {
    touch( current => ( { ...current, pages: { ...current.pages, [ key ]: { ...current.pages[ key ], ...patch } } } ) );
  }

  async function submit( event: React.FormEvent ) {
    event.preventDefault();
    if ( !row || !seo ) return;
    setSaving( true );
    setFailed( "" );
    try {
      const result = await api.put<PageCopy>( "/api/cms/pages/global/", {
        label: row.label,
        published: row.published,
        data: { ...row.data, seo },
      });
      setRow( result );
      setSeo( readSeo( result.data ) );
      setDirty( false );
      toast.success( "Saved. The site writes these into every page head on the next visit." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not save. Check that the backend is running.";
      setFailed( message );
      toast.error( message );
    } finally {
      setSaving( false );
    }
  }

  if ( !seo ) return failed ? <Notice>{ failed }</Notice> : <p className="text-small loading">Loading the search settings.</p>;

  return (
    <section className={ `edit tone-page t8` }>
      <SectionHead
        icon="search"
        title="Search and sharing"
        note="What a search engine and a chat preview say about the site. A line left blank is worked out by the site itself."
        actions={ (
          <>
            { row ? <span className={ `pill pill-${ row.published ? "good" : "neutral" }` }>{ row.published ? "Live" : "Held back" }</span> : null }
            { row?.updated_at ? <span className="text-small">Saved { formatDate( row.updated_at ) }</span> : null }
          </>
        ) }
      />

      { failed ? <Notice>{ failed }</Notice> : null }

      <form onSubmit={ submit } className="copy-form">
        <div className="sec card t8">
          <header className="sec-head">
            <span className="sec-mark">
              <Icon name="search" size={ 18 } />
            </span>
            <div className="sec-titles">
              <p className="sec-name">The whole site</p>
              <p className="sec-note">The first line people meet, on the home page and in a shared link.</p>
            </div>
          </header>
          <div className="sec-body seo-body">
            <div className="seo-previews">
              <Serp address={ window.location.host } title={ homeTitle } line={ homeLine } />
              <div className="share-card">
                { seo.og_image_url ? (
                  <img className="share-img" src={ mediaUrl( seo.og_image_url ) } alt={ seo.og_image_alt } />
                ) : (
                  <span className="share-img is-name">
                    <Icon name="image" size={ 22 } />
                    { PHOTO_OPTIONS.find( ( [ key ] ) => key === seo.og_image )?.[ 1 ] ?? "The card that ships with the site" }
                  </span>
                ) }
                <div className="share-body">
                  <p className="share-title">{ homeTitle }</p>
                  <p className="share-line">{ homeLine }</p>
                </div>
              </div>
            </div>

            <div className="copy-grid">
              <div className="copy-wide">
                <Field label="Title of the home page" help="Shown in the browser tab and as the blue line in a search result. Blank, the site uses its own heading.">
                  <TextInput
                    value={ seo.title }
                    placeholder={ SITE_WORDS.title }
                    onChange={ event => touch( current => ( { ...current, title: event.target.value } ) ) }
                  />
                </Field>
                <Counter value={ homeTitle } limit={ TITLE_LIMIT } />
              </div>
              <div className="copy-wide">
                <Field label="Summary of the site" help="The two lines under the title. About 155 characters is what survives. Blank, the site takes the home page's opening line.">
                  <TextArea
                    rows={ 3 }
                    value={ seo.description }
                    placeholder={ SITE_WORDS.description }
                    onChange={ event => touch( current => ( { ...current, description: event.target.value } ) ) }
                  />
                </Field>
                <Counter value={ homeLine } limit={ LINE_LIMIT } />
              </div>
              <div className="copy-wide">
                <Field label="Words people may search for" help="A short list. Search engines give it little weight now, so keep it honest.">
                  <TextInput
                    value={ seo.keywords }
                    placeholder={ SITE_WORDS.keywords }
                    onChange={ event => touch( current => ( { ...current, keywords: event.target.value } ) ) }
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="sec card t1">
          <header className="sec-head">
            <span className="sec-mark">
              <Icon name="media" size={ 18 } />
            </span>
            <div className="sec-titles">
              <p className="sec-name">Picture in a shared link</p>
              <p className="sec-note">The card that appears when the address is pasted into WhatsApp, Facebook or X.</p>
            </div>
          </header>
          <div className="sec-body seo-body">
            <PhotoField
              label="Which picture"
              help="A wide picture works best, around 1200 by 630 pixels."
              value={ { photo: seo.og_image, url: seo.og_image_url, alt: seo.og_image_alt } }
              onChange={ next => touch( current => ( { ...current, og_image: next.photo, og_image_url: next.url, og_image_alt: next.alt } ) ) }
            />
            { seo.og_image && !seo.og_image_url ? (
              <Field label="What the picture shows" help="People who cannot see it hear this instead.">
                <TextInput value={ seo.og_image_alt } onChange={ event => touch( current => ( { ...current, og_image_alt: event.target.value } ) ) } />
              </Field>
            ) : null }
            <Checkbox
              label="Let search engines list this site"
              checked={ seo.indexable }
              onChange={ next => touch( current => ( { ...current, indexable: next } ) ) }
            />
            <p className="text-small quiet">
              Held back, the site asks every search engine to leave it out. Useful while the pages are still being written.
            </p>
          </div>
        </div>

        <div className="sec card t3">
          <header className="sec-head">
            <span className="sec-mark">
              <Icon name="pages" size={ 18 } />
            </span>
            <div className="sec-titles">
              <p className="sec-name">Each page</p>
              <p className="sec-note">Leave a page alone and the site names it from its own heading and opening line.</p>
            </div>
          </header>
          <div className="sec-body seo-body">
            <div className="copy-stack">
              { lines.map( page => (
                <div className="copy-entry t0" key={ page.key }>
                  <header className="copy-entry-head">
                    <span className="copy-entry-index">
                      <Icon name="pages" size={ 16 } />
                    </span>
                    <p className="copy-entry-name">{ page.name }</p>
                    <span className="copy-entry-path">{ page.path }</span>
                  </header>
                  <div className="copy-entry-body">
                    <div className="copy-grid">
                      <div className="copy-wide">
                        <Field label="Title" help={ `The site adds “· ${ suffix }” to whatever you write.` }>
                          <TextInput
                            value={ seo.pages[ page.key ].title }
                            placeholder={ page.name }
                            onChange={ event => setLine( page.key, { title: event.target.value } ) }
                          />
                        </Field>
                        <Counter value={ seo.pages[ page.key ].title } limit={ TITLE_LIMIT } />
                      </div>
                      <div className="copy-wide">
                        <Field label="Summary" help="One or two lines under the title in a search result.">
                          <TextArea
                            rows={ 2 }
                            value={ seo.pages[ page.key ].description }
                            placeholder="Left to the page, which uses its own opening line."
                            onChange={ event => setLine( page.key, { description: event.target.value } ) }
                          />
                        </Field>
                        <Counter value={ seo.pages[ page.key ].description } limit={ LINE_LIMIT } />
                      </div>
                    </div>
                    <Serp
                      address={ `${ window.location.host }${ page.path }` }
                      title={ page.title }
                      line={ page.line }
                      pending="The site takes this from the page's own first paragraph."
                    />
                  </div>
                </div>
              ) ) }
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" busy={ saving } disabled={ saving || !dirty }>
            { saving ? "Saving" : "Save search settings" }
          </Button>
          { dirty && !saving ? <span className="text-small quiet">Not saved yet.</span> : null }
        </div>
      </form>
    </section>
  );
}
