import { useParams } from "react-router-dom";
import { Notice } from "../components/ui";
import { findResource } from "../cms/resources";
import ResourceList from "../components/ResourceList";
import ResourceForm from "../components/ResourceForm";

export function CmsListPage() {
  const { resource: slug } = useParams();
  const found = findResource( slug );
  if ( !found ) return <Notice>That content type does not exist.</Notice>;
  return <ResourceList resource={ found } />;
}

export function CmsEditPage() {
  const { resource: slug } = useParams();
  const found = findResource( slug );
  if ( !found ) return <Notice>That content type does not exist.</Notice>;
  return <ResourceForm resource={ found } />;
}
