import { useLayoutEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

import NotFound from "@/pages/not-found";

import { site } from "./site";
import { SiteTemplate } from "./parts";

export function SitePage() {
  const { page, item } = useParams();
  const { hash } = useLocation();
  const subpage = page === undefined ? undefined : item === undefined ? site.pages?.[page] : site.items?.[page]?.( item );

  useLayoutEffect( () => {
    const target = hash ? document.getElementById( hash.slice( 1 ) ) : null;
    window.scrollTo( 0, target ? target.getBoundingClientRect().top + window.scrollY - ( parseFloat( getComputedStyle( target ).scrollMarginTop ) || 0 ) : 0 );
  }, [ hash, page, item ] );

  useLayoutEffect( () => {
    document.title = subpage?.title ? `${ subpage.title } · Dr. Ramesh Kandel` : site.title;
  }, [ subpage ] );

  if ( page !== undefined && !subpage ) {
    return <NotFound />;
  }
  return (
    <SiteTemplate name={ site.name } pack={ site.pack } layout={ site.layout } header={ site.header } footer={ site.footer }>
      { subpage ? subpage.content : <>{ site.hero }{ site.after }</> }
    </SiteTemplate>
  );
}
