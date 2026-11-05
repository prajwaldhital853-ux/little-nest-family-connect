import { useRef, useState } from "react";
import { mediaUrl } from "../api/client";
import { PHOTO_OPTIONS } from "../cms/resources";
import GalleryPicker from "./GalleryPicker";
import type { Gallery } from "./gallery";
import { Icon } from "./icons";
import { Button, Notice } from "./ui";

/* A picture slot that holds one word: the name of a photo that ships with the site, or the link to
   one uploaded here. The site reads both from the same place, so no page needs a second field. */
export default function PhotoPick( {
  label,
  help,
  value,
  gallery,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  gallery: Gallery;
  onChange: ( next: string ) => void;
} ) {
  const picker = useRef<HTMLInputElement>( null );
  const [ choosing, setChoosing ] = useState(false);
  const { images, error, busy, upload } = gallery;
  const fromSite = ! isLink( value );
  const bundled = PHOTO_OPTIONS.find( ( [ key ] ) => key === value )?.[ 1 ];

  async function take( file: File ) {
    const created = await upload( file );
    if ( created ) onChange( created.url );
  }

  return (
    <div className="photo copy-wide">
      <p className="field-label">{ label }</p>
      { help ? <p className="field-help">{ help }</p> : null }

      <div className="photo-now">
        { isLink( value ) ? (
          <img src={ mediaUrl( value ) } alt="" />
        ) : (
          <span className="photo-name">
            <Icon name="image" size={ 18 } />
            { bundled || ( value ? value : "No photo chosen yet" ) }
          </span>
        ) }
      </div>

      { error ? <Notice>{ error }</Notice> : null }

      <div className="photo-actions">
        <Button tone="quiet" disabled={ busy } onClick={ () => picker.current?.click() }>
          <Icon name="upload" size={ 16 } />
          { busy ? "Uploading" : "Upload" }
        </Button>
        <Button tone="quiet" onClick={ () => setChoosing( true ) }>
          <Icon name="image" size={ 16 } />
          From gallery
        </Button>
        <input
          ref={ picker }
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={ event => {
            const file = event.target.files?.[ 0 ];
            event.target.value = "";
            if ( file ) take( file );
          } }
        />
        { value ? (
          <button type="button" className="link-button" onClick={ () => onChange( "" ) }>
            Stop using it
          </button>
        ) : null }
      </div>

      { choosing ? (
        <GalleryPicker
          images={ images }
          error={ error }
          selectedUrl={ isLink( value ) ? value : "" }
          selectedPhoto={ fromSite ? value : "" }
          sitePhotos={ PHOTO_OPTIONS.filter( ( [ key ] ) => key !== "" ) }
          onPickImage={ image => {
            onChange( image.url );
            setChoosing( false );
          } }
          onPickPhoto={ photo => {
            onChange( photo );
            setChoosing( false );
          } }
          onClose={ () => setChoosing( false ) }
        />
      ) : null }
    </div>
  );
}

function isLink( value: string ) {
  return value.startsWith( "/" ) || /^https?:\/\//i.test( value );
}
