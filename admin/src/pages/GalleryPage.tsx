import { useRef } from "react";
import { mediaUrl } from "../api/client";
import type { SiteImage } from "../api/types";
import { useGallery } from "../components/gallery";
import SectionHead from "../components/SectionHead";
import { Icon } from "../components/icons";
import { useToast } from "../components/Toast";
import { Button, Notice } from "../components/ui";

/* Every picture the panel has been given, in one place, so a photo uploaded for one page can be
   used on another without uploading it twice. */
export default function GalleryPage() {
  const { images, error, busy, fraction, upload, remove } = useGallery();
  const toast = useToast();
  const picker = useRef<HTMLInputElement>( null );

  async function drop( image: SiteImage ) {
    const question = `Delete ${ image.label || "this photo" } from the gallery? Pages already using it fall back to their own picture.`;
    if ( !( await toast.confirm( question, { confirm: "Delete", cancel: "Keep it" } ) ) ) return;
    await remove( image );
  }

  return (
    <section className="tone-page t7">
      <SectionHead
        icon="image"
        title="Gallery"
        note={ `${ images ? `${ images.length } photo${ images.length === 1 ? "" : "s" } you have added.` : "Loading the photos." } Any picture on the site can be swapped for one of these.` }
        actions={ (
          <>
            <Button disabled={ busy } onClick={ () => picker.current?.click() }>
              <Icon name="upload" size={ 16 } />
              { busy ? "Uploading" : "Upload" }
            </Button>
            <input
              ref={ picker }
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={ event => {
                const file = event.target.files?.[ 0 ];
                event.target.value = "";
                if ( file ) upload( file );
              } }
            />
          </>
        ) }
      />

      { error ? <Notice>{ error }</Notice> : null }

      { busy ? (
        <div className="bar-row">
          <span className="bar-label">Sending the photo</span>
          <span className="bar-track">
            <span className="bar-fill" style={ { width: `${ Math.round( ( fraction ?? 0 ) * 100 ) }%` } } />
          </span>
          <span className="bar-value">{ Math.round( ( fraction ?? 0 ) * 100 ) }%</span>
        </div>
      ) : null }

      { images === null ? (
        !error ? <p className="text-small loading">Loading the gallery.</p> : null
      ) : images.length === 0 ? (
        <div className="block gallery-empty">
          <Icon name="image" size={ 26 } />
          <p>Nothing here yet.</p>
          <p className="text-small quiet">
            Add a photo and every picture slot in the panel can use it, on a phone straight from the camera roll.
          </p>
        </div>
      ) : (
        <div className="gallery">
          { images.map( image => (
            <figure className="gallery-card card" key={ image.id }>
              <div className="gallery-shot">
                <img src={ mediaUrl( image.url ) } alt={ image.alt } loading="lazy" />
              </div>
              <figcaption>
                <p className="gallery-name">{ image.label || image.alt || "Untitled" }</p>
                <p className="text-small quiet">{ image.alt || "No description yet" }</p>
                <p className="text-small quiet">{ Math.max( 1, Math.round( image.bytes / 1024 ) ) } KB</p>
              </figcaption>
              <div className="gallery-actions">
                <Button tone="quiet" onClick={ () => drop( image ) }>
                  Delete
                </Button>
              </div>
            </figure>
          ) ) }
        </div>
      ) }
    </section>
  );
}
