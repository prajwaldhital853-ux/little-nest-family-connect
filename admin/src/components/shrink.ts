/* A phone hands over a nine megabyte photo. Nothing on the site is wider than 1600 pixels, so the
   panel draws it back at that size and uploads the smaller picture instead: the wait goes from
   tens of seconds to about one, and what the doctor sees is the same photo. */

const WIDEST = 1600;
const TALLEST = 1600;
/* Under this there is nothing to win by re-encoding, and a small graphic re-saved as jpeg comes
   out worse than it went in. */
const SMALL_ENOUGH = 900_000;

const FORMATS = [ "image/webp", "image/jpeg" ] as const;

/** The largest picture the browser will take in one go, so a 6000 pixel panorama is not resized
 *  with a canvas the graphics card refuses to allocate. */
const MEGAPIXEL_LIMIT = 40;

export async function shrink( file: File ): Promise<File> {
  if ( !file.type.startsWith( "image/" ) || file.type === "image/gif" ) return file;

  const objectUrl = URL.createObjectURL( file );
  try {
    const image = await load( objectUrl );
    const widest = Math.min( WIDEST, image.naturalWidth );
    const tallest = Math.min( TALLEST, image.naturalHeight );
    if ( file.size <= SMALL_ENOUGH && image.naturalWidth <= widest && image.naturalHeight <= tallest ) return file;

    let scale = Math.min( widest / image.naturalWidth, tallest / image.naturalHeight );
    const pixels = image.naturalWidth * image.naturalHeight;
    if ( pixels * scale * scale > MEGAPIXEL_LIMIT * 1_000_000 ) scale = Math.sqrt( ( MEGAPIXEL_LIMIT * 1_000_000 ) / pixels );

    const canvas = document.createElement( "canvas" );
    canvas.width = Math.max( 1, Math.round( image.naturalWidth * scale ) );
    canvas.height = Math.max( 1, Math.round( image.naturalHeight * scale ) );
    const painted = canvas.getContext( "2d" );
    if ( !painted ) return file;
    painted.drawImage( image, 0, 0, canvas.width, canvas.height );

    for ( const format of FORMATS ) {
      const blob = await encode( canvas, format );
      /* A browser that cannot write webp answers with a png of the same requested name, so the
         type that comes back is the only proof of what was actually made. */
      if ( !blob || blob.type !== format ) continue;
      if ( blob.size >= file.size ) return file;
      return toFile( blob, file.name, format );
    }
    return file;
  } catch {
    /* Anything the browser refused to draw is uploaded exactly as it arrived. A picture that is
       too big is a slower save, not a lost one. */
    return file;
  } finally {
    URL.revokeObjectURL( objectUrl );
  }
}

function load( src: string ): Promise<HTMLImageElement> {
  return new Promise(( resolve, reject ) => {
    const image = new Image();
    image.onload = () => resolve( image );
    image.onerror = () => reject( new Error( "The browser could not read that picture." ) );
    image.src = src;
  } );
}

function encode( canvas: HTMLCanvasElement, format: string ): Promise<Blob | null> {
  return new Promise( resolve => canvas.toBlob( resolve, format, 0.82 ) );
}

function toFile( blob: Blob, name: string, format: string ): File {
  const suffix = format === "image/webp" ? "webp" : "jpg";
  const base = name.replace( /\.[a-z0-9]+$/i, "" ).slice( 0, 60 ) || "photo";
  return new File( [ blob ], `${ base}.${ suffix }`, { type: format } );
}
