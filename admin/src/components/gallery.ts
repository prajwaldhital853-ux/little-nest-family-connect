import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Page, SiteImage } from "../api/types";
import { shrink } from "./shrink";
import { useToast } from "./Toast";

/* Every picker and the gallery page read the same list, so a photo uploaded in one place is
   offered in all the others without a reload. The list itself is cached by the api client, and
   every reader asks for the same address, so opening three pickers is one request, not three. */
export function useGallery() {
  const [ images, setImages ] = useState<SiteImage[] | null>( null );
  const [ error, setError ] = useState("");
  /** How far a picture on its way has got, from 0 to 1, or null while nothing is moving. */
  const [ fraction, setFraction ] = useState<number | null>( null );
  const toast = useToast();

  useEffect(() => {
    let open = true;
    api
      .page<SiteImage>( "/api/cms/images/", { page_size: 100 } )
      .then( ( page: Page<SiteImage> ) => {
        if ( open ) setImages( page.results );
      } )
      .catch( ( reason: ApiError ) => {
        if ( open ) setError( reason.message );
      } );
    return () => {
      open = false;
    };
  }, [] );

  const upload = useCallback( async ( file: File ) => {
    setError( "" );
    setFraction( 0 );
    try {
      /* Resized in this browser first: the wait he is feeling is the megabytes on the wire, and
         the site never shows a picture wider than 1600 pixels anyway. */
      const light = await shrink( file );
      const form = new FormData();
      form.set( "file", light );
      form.set( "label", file.name.replace( /\.[a-z]+$/i, "" ).slice( 0, 80 ) );
      const created = await api.upload<SiteImage>( "/api/cms/images/", form, done => setFraction( done ) );
      setImages( current => [ created, ...( current ?? [] ) ] );
      toast.success( "Photo uploaded and added to the gallery." );
      return created;
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "That upload did not reach the server.";
      setError( message );
      toast.error( message );
      return null;
    } finally {
      setFraction( null );
    }
  }, [ toast ] );

  const remove = useCallback( async ( image: SiteImage ) => {
    setError( "" );
    try {
      await api.del( `/api/cms/images/${ image.id }/` );
      setImages( current => ( current ?? [] ).filter( one => one.id !== image.id ) );
      toast.success( "Photo deleted from the gallery." );
      return true;
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "That photo could not be deleted.";
      setError( message );
      toast.error( message );
      return false;
    }
  }, [ toast ] );

  return { images, error, busy: fraction !== null, fraction, upload, remove };
}

export type Gallery = ReturnType<typeof useGallery>;
