import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../api/client";
import { PHOTO_OPTIONS } from "../cms/resources";
import GalleryPicker from "./GalleryPicker";
import { useGallery } from "./gallery";
import { Icon } from "./icons";
import { Button, Field, Notice, TextInput } from "./ui";

export interface PhotoValue {
  /** The name of a picture that ships with the site. */
  photo: string;
  /** Or the address of one that was uploaded here. */
  url: string;
  alt: string;
}

/** A picture for a section: add one from this computer, or point the section at a photo already in the gallery. */
export default function PhotoField( {
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: PhotoValue;
  onChange: ( next: PhotoValue ) => void;
} ) {
  const picker = useRef<HTMLInputElement>( null );
  const [ choosing, setChoosing ] = useState(false);
  /* The picture he picked is drawn from this computer while it is still on its way, so the box
     under the button changes the moment he chooses a file rather than a minute later. */
  const [ preview, setPreview ] = useState("");
  const { images, error, busy, fraction, upload } = useGallery();

  useEffect(() => () => {
    if ( preview ) URL.revokeObjectURL( preview );
  }, [ preview ] );

  async function take( file: File ) {
    setPreview( URL.createObjectURL( file ) );
    const created = await upload( file );
    if ( created ) onChange( { photo: "", url: created.url, alt: created.alt } );
  }

  const shown = busy && preview ? preview : value.url ? mediaUrl( value.url ) : "";

  return (
    <div className="photo span-2">
      <p className="field-label">{ label }</p>
      { help ? <p className="field-help">{ help }</p> : null }

      <div className="photo-now">
        { shown ? (
          <img src={ shown } alt={ value.alt } />
        ) : (
          <span className="photo-name">
            <Icon name="image" size={ 18 } />
            { PHOTO_OPTIONS.find( ( [ key ] ) => key === value.photo )?.[ 1 ] || "No photo chosen yet" }
          </span>
        ) }
      </div>

      { busy ? (
        <div className="bar-row">
          <span className="bar-label">Sending the photo</span>
          <span className="bar-track">
            <span className="bar-fill" style={ { width: `${ Math.round( ( fraction ?? 0 ) * 100 ) }%` } } />
          </span>
          <span className="bar-value">{ Math.round( ( fraction ?? 0 ) * 100 ) }%</span>
        </div>
      ) : null }

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
        { value.url || value.photo ? (
          <button type="button" className="link-button" onClick={ () => onChange( { photo: "", url: "", alt: "" } ) }>
            Stop using it
          </button>
        ) : null }
      </div>

      { value.url ? (
        <Field label="What the picture shows" help="People who cannot see it hear this instead.">
          <TextInput value={ value.alt } onChange={ event => onChange( { ...value, alt: event.target.value } ) } />
        </Field>
      ) : null }

      { choosing ? (
        <GalleryPicker
          images={ images }
          error={ error }
          selectedUrl={ value.url }
          selectedPhoto={ value.photo }
          sitePhotos={ PHOTO_OPTIONS.filter( ( [ key ] ) => key !== "" ) }
          onPickImage={ image => {
            onChange( { photo: "", url: image.url, alt: image.alt } );
            setChoosing( false );
          } }
          onPickPhoto={ photo => {
            onChange( { photo, url: "", alt: value.alt } );
            setChoosing( false );
          } }
          onClose={ () => setChoosing( false ) }
        />
      ) : null }
    </div>
  );
}
