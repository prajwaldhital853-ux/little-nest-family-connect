import { useEffect, useRef } from "react";
import { mediaUrl } from "../api/client";
import type { SiteImage } from "../api/types";
import { Icon } from "./icons";
import { Notice } from "./ui";

/** The picture every section can point at: one from the gallery, or one the site already carries. */
export default function GalleryPicker( {
  images,
  error,
  selectedUrl = "",
  selectedPhoto = "",
  sitePhotos,
  onPickImage,
  onPickPhoto,
  onClose,
}: {
  images: SiteImage[] | null;
  error: string;
  selectedUrl?: string;
  selectedPhoto?: string;
  sitePhotos?: [string, string][];
  onPickImage: ( image: SiteImage ) => void;
  onPickPhoto: ( photo: string ) => void;
  onClose: () => void;
} ) {
  const close = useRef<HTMLButtonElement>( null );

  useEffect(() => {
    close.current?.focus();
    function onKey( event: KeyboardEvent ) {
      if ( event.key === "Escape" ) onClose();
    }
    document.addEventListener( "keydown", onKey );
    return () => document.removeEventListener( "keydown", onKey );
  }, [ onClose ] );

  return (
    <div className="pick-scrim" onClick={ onClose }>
      <div
        className="pick-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose from Gallery"
        onClick={ event => event.stopPropagation() }
      >
        <header className="pick-head">
          <p className="pick-title">Choose from Gallery</p>
          <button type="button" className="pick-close" onClick={ onClose } aria-label="Close">
            <Icon name="close" size={ 18 } />
          </button>
        </header>

        <div className="pick-body">
          { error ? <Notice>{ error }</Notice> : null }

          { images === null ? (
            <p className="text-small quiet">Loading the photos in the gallery.</p>
          ) : images.length === 0 ? (
            <p className="text-small quiet">The gallery is empty. Upload a photo and it appears here for every page.</p>
          ) : (
            <div className="pick-grid">
              { images.map( image => (
                <button
                  type="button"
                  key={ image.id }
                  className={ selectedUrl === image.url ? "pick-card on" : "pick-card" }
                  onClick={ () => onPickImage( image ) }
                >
                  <img src={ mediaUrl( image.url ) } alt="" loading="lazy" />
                  <span className="pick-card-name">{ image.label || image.alt || "Photo" }</span>
                </button>
              ) ) }
            </div>
          ) }

          { sitePhotos?.length ? (
            <>
              <p className="pick-group">Photos the site already carries</p>
              <div className="pick-list">
                { sitePhotos.map( ( [ key, name ] ) => (
                  <button
                    type="button"
                    key={ key }
                    className={ selectedPhoto === key ? "pick on" : "pick" }
                    onClick={ () => onPickPhoto( key ) }
                  >
                    { name }
                  </button>
                ) ) }
              </div>
            </>
          ) : null }
        </div>
      </div>
    </div>
  );
}
