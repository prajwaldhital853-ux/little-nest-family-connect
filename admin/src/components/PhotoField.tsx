import { useRef, useState } from "react";
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
  const { images, error, busy, upload } = useGallery();

  async function take( file: File ) {
    const created = await upload( file );
    if ( created ) onChange( { photo: "", url: created.url, alt: created.alt } );
  }

  return (
    <div className="photo span-2">
      <p className="field-label">{ label }</p>
      { help ? <p className="field-help">{ help }</p> : null }

      <div className="photo-now">
        { value.url ? (
          <img src={ mediaUrl( value.url ) } alt={ value.alt } />
        ) : (
          <span className="photo-name">
            <Icon name="image" size={ 18 } />
            { PHOTO_OPTIONS.find( ( [ key ] ) => key === value.photo )?.[ 1 ] || "No photo chosen yet" }
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
