import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { CmsRow } from "../api/types";
import type { FieldDef, ResourceDef } from "../cms/resources";
import { fromValue, readBlocks, sendBlocks, toValue } from "../cms/articleBlocks";
import { Button, Field, Notice, Select, TextArea, TextInput, formatDate } from "./ui";
import SectionHead from "./SectionHead";
import PhotoField from "./PhotoField";
import BlocksField from "./BlocksField";
import { useToast } from "./Toast";
import { Icon } from "./icons";

type Values = Record<string, string>;

/* One field is not a line of words: an article is a list of blocks, and it travels as JSON in the
   same bag of strings every other field uses. */
function fieldText( field: FieldDef, row: CmsRow ): string {
  if ( field.type !== "blocks" ) return asText( row[ field.key ] );
  return toValue( readBlocks( row[ field.key ], row.body ) );
}

function asText( value: unknown ): string {
  return value === null || value === undefined ? "" : String( value );
}

/* A brand new value for one box. A choice left empty would show its first option while sending
   nothing, which is how a new media row used to arrive with no kind and be refused. */
function startingValue( field: FieldDef ): string {
  if ( field.type === "blocks" ) return "[]";
  if ( field.type === "select" ) return field.options?.[ 0 ]?.[ 0 ] ?? "";
  return "";
}

/* He needs to hear what the site did with the row, which is what the server answered with. */
function outcome( name: string, status: string, wasPublished: boolean ): string {
  if ( status === "published" ) return `${ name } published and live on the site.`;
  return wasPublished ? `${ name } taken off the site and saved as a draft.` : `${ name } saved as a draft.`;
}

export default function ResourceForm( { resource }: { resource: ResourceDef } ) {
  const { resource: slug, id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id;
  const detail = useMemo( () => ( id ? `${ resource.endpoint }${ id }/` : resource.endpoint ), [ id, resource ] );

  const [ values, setValues ] = useState<Values | null>( null );
  const [ errors, setErrors ] = useState<Record<string, string[]>>( {} );
  const [ failed, setFailed ] = useState("");
  const [ saving, setSaving ] = useState(false);
  const [ meta, setMeta ] = useState<{ published_at: string | null; updated_at: string } | null>( null );

  useEffect(() => {
    setErrors( {} );
    setFailed( "" );
    setMeta( null );
    if ( isNew ) {
      const blank: Values = {};
      for ( const field of resource.fields ) blank[ field.key ] = field.initial ?? startingValue( field );
      blank.status = "draft";
      blank.order = "0";
      setValues( blank );
      return;
    }
    api
      .get<CmsRow>( detail )
      .then( row => {
        const next: Values = {};
        for ( const field of resource.fields ) next[ field.key ] = fieldText( field, row );
        setValues( next );
        setMeta( { published_at: row.published_at, updated_at: row.updated_at } );
      } )
      .catch( ( reason: ApiError ) => setFailed( reason.message ) );
  }, [ resource, isNew, detail ] );

  if ( !values ) return failed ? <Notice>{ failed }</Notice> : <p className="text-small">Loading</p>;

  function set( key: string, value: string ) {
    setValues( current => ( { ...( current as Values ), [ key ]: value } ) );
    setErrors( current => ( { ...current, [ key ]: [] } ) );
  }

  /* The picture control answers with three columns at once. */
  function setMany( next: Record<string, string> ) {
    setValues( current => ( { ...( current as Values ), ...next } ) );
  }

  async function submit( nextStatus?: string ) {
    setSaving( true );
    setFailed( "" );
    const shown = values as Values;
    /* Whatever the Status box says goes to the server, whether he pressed Save or Save and publish:
       the button only changes it, it does not replace what is on the screen. */
    const wasPublished = shown.status === "published";
    const body: Record<string, unknown> = {};
    for ( const field of resource.fields ) {
      const raw = shown[ field.key ];
      body[ field.key ] =
        field.type === "number" ? Number( raw || 0 ) : field.type === "blocks" ? sendBlocks( fromValue( raw ) ) : raw;
    }
    body.status = nextStatus ?? shown.status;
    try {
      const row = isNew ? await api.post<CmsRow>( resource.endpoint, body ) : await api.patch<CmsRow>( detail, body );
      toast.success( outcome( resource.name, row.status, wasPublished ) );
      navigate( `/content/${ slug }`, { replace: true } );
    } catch ( reason ) {
      if ( reason instanceof ApiError ) {
        setErrors( reason.fields );
        setFailed( reason.message );
        toast.error( reason.message );
      } else {
        setFailed( "Could not save. Check that the backend is running." );
        toast.error( "Could not save. Check that the backend is running." );
      }
    } finally {
      setSaving( false );
    }
  }

  const published = ( values as Values ).status === "published";
  const heading = ( values as Values )[ resource.titleKey ] || ( isNew ? `New ${ resource.name.toLowerCase() }` : "Edit" );

  return (
    <section className={ `edit tone-page t${ resource.tone }` }>
      <SectionHead
        icon={ resource.icon }
        crumb={ (
          <>
            <Link to={ `/content/${ slug }` }>{ resource.plural }</Link>
            <Icon name="chevron" size={ 14 } />
            { isNew ? "New" : id }
          </>
        ) }
        title={ heading }
        note={ `One ${ resource.name.toLowerCase() }, exactly as the site shows it once it is published.` }
        actions={ (
          <>
            <span className={ `pill pill-${ published ? "good" : "neutral" }` }>{ published ? "Published" : "Draft" }</span>
            { meta?.published_at ? <span className="text-small">Live since { formatDate( meta.published_at ) }</span> : null }
          </>
        ) }
      />

      { failed ? <Notice>{ failed }</Notice> : null }

      <div className="card form-grid">
        { resource.fields.filter( field => !field.hidden ).map( field => (
          field.type === "photo" ? (
            <PhotoField
              key={ field.key }
              label={ field.label }
              help={ field.help }
              value={ { photo: ( values as Values ).photo, url: ( values as Values ).photo_url, alt: ( values as Values ).photo_alt } }
              onChange={ next => setMany( { photo: next.photo, photo_url: next.url, photo_alt: next.alt } ) }
            />
          ) : (
            <div key={ field.key } className={ field.wide ? "span-2" : "" }>
              <Field label={ field.label } help={ field.help } error={ errors[ field.key ] }>
                <Control field={ field } value={ ( values as Values )[ field.key ] } onChange={ next => set( field.key, next ) } />
              </Field>
            </div>
          )
        ) ) }

        { meta?.updated_at ? <p className="text-small quiet span-2">Last saved { formatDate( meta.updated_at ) }</p> : null }

        <footer className="form-actions span-2">
          <Button disabled={ saving } onClick={ () => submit() }>
            Save
          </Button>
          <Button tone="quiet" disabled={ saving } onClick={ () => submit( published ? "draft" : "published" ) }>
            { published ? "Save and unpublish" : "Save and publish" }
          </Button>
          <Button tone="quiet" disabled={ saving } onClick={ () => navigate( `/content/${ slug }` ) }>
            Back to list
          </Button>
        </footer>
      </div>
    </section>
  );
}

function Control( { field, value, onChange }: { field: FieldDef; value: string; onChange: ( next: string ) => void } ) {
  switch ( field.type ) {
    case "textarea":
      return <TextArea value={ value } rows={ field.rows } onChange={ event => onChange( event.target.value ) } />;
    case "blocks":
      return <BlocksField value={ value } onChange={ onChange } />;
    case "number":
      return <TextInput type="number" value={ value } onChange={ event => onChange( event.target.value ) } />;
    case "select":
      return <Select value={ value } options={ field.options ?? [] } onChange={ event => onChange( event.target.value ) } />;
    case "url":
      return <TextInput type="url" value={ value } placeholder={ field.placeholder } onChange={ event => onChange( event.target.value ) } />;
    default:
      return <TextInput value={ value } maxLength={ field.max } placeholder={ field.placeholder } onChange={ event => onChange( event.target.value ) } />;
  }
}
