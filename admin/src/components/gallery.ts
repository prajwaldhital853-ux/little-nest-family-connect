import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Page, SiteImage } from "../api/types";
import { useToast } from "./Toast";

/* Every picker and the gallery page read the same list, so a photo uploaded in one place is
   offered in all the others without a reload. */
export function useGallery() {
  const [ images, setImages ] = useState<SiteImage[] | null>( null );
  const [ error, setError ] = useState("");
  const [ busy, setBusy ] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api
      .page<SiteImage>( "/api/cms/images/", { page_size: 100 } )
      .then( ( page: Page<SiteImage> ) => setImages( page.results ) )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [] );

  const upload = useCallback( async ( file: File ) => {
    setError( "" );
    setBusy( true );
    try {
      const form = new FormData();
      form.set( "file", file );
      form.set( "label", file.name.replace( /\.[a-z]+$/i, "" ).slice( 0, 80 ) );
      const created = await api.upload<SiteImage>( "/api/cms/images/", form );
      setImages( current => [ created, ...( current ?? [] ) ] );
      toast.success( "Photo uploaded and added to the gallery." );
      return created;
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "That upload did not reach the server.";
      setError( message );
      toast.error( message );
      return null;
    } finally {
      setBusy( false );
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

  return { images, error, busy, upload, remove };
}

export type Gallery = ReturnType<typeof useGallery>;
