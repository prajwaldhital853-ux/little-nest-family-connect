import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useId, useRef, useState } from 'react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CreateContactMessageInput } from '@/lib/data-provider';
import { useDataProvider } from '@/lib/data-provider';
import { cn } from '@/lib/utils';

type InquiryType = CreateContactMessageInput['inquiry_type'];

export type EnquiryField =
  | { id: string; kind: 'text' | 'email' | 'tel'; label: string; required?: boolean; half?: boolean }
  | { id: string; kind: 'date'; label: string; required?: boolean; half?: boolean }
  | { id: string; kind: 'choice'; label: string; options: string[]; required?: boolean }
  | { id: string; kind: 'textarea'; label: string; placeholder?: string; required?: boolean };

export interface ContactDetailsFormProps {
  subject?: string;
  inquiryType?: InquiryType;
  fields?: EnquiryField[];
  submitLabel?: string;
  initial?: Record<string, string>;
  className?: string;
}

const DEFAULT_FIELDS: EnquiryField[] = [
  { id: 'name', kind: 'text', label: 'Your name', required: true },
  { id: 'email', kind: 'email', label: 'Your email', required: true },
  { id: 'message', kind: 'textarea', label: 'Your message', required: true }
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTOCOMPLETE: Record<string, string> = { name: 'name', email: 'email', phone: 'tel' };

function errorFor( field: EnquiryField, value: string ): string | undefined {
  const empty = !value.trim();
  if ( field.id === 'name' && empty ) {
    return 'Please enter your name.';
  }
  if ( field.kind === 'email' ) {
    if ( empty ) {
      return field.required ? 'Please enter your email address.' : undefined;
    }
    return EMAIL.test( value.trim() ) ? undefined : 'Please enter a valid email address.';
  }
  if ( field.id === 'message' && empty ) {
    return 'Please enter a message.';
  }
  if ( field.required && empty ) {
    return field.kind === 'choice' ? `Please choose ${ field.label.toLowerCase() }.` : `Please enter ${ field.label.toLowerCase() }.`;
  }
  return undefined;
}

const lineClass = 'block w-full border-0 border-b bg-transparent p-0 pb-1 text-inherit outline-none [border-bottom-color:color-mix(in_srgb,currentColor_30%,transparent)] focus:[border-bottom-color:currentColor]';
const labelClass = cn(
  'pointer-events-none absolute left-0 top-0 text-small opacity-50 transition-all duration-200 motion-reduce:transition-none',
  'peer-placeholder-shown:top-6 peer-placeholder-shown:text-[length:inherit] peer-focus:top-0 peer-focus:text-small'
);
const smallLabel = 'text-meta mb-2 block text-small';

function ChoiceGroup( { name, value, options, idPrefix, onChoice, groupRef }: { name: string; value: string; options: string[]; idPrefix: string; onChoice: ( name: string, value: string ) => void; groupRef: ( el: HTMLDivElement | null ) => void } ) {
  const onValueChange = useCallback( ( next: string ) => {
    onChoice( name, next );
  }, [ name, onChoice ] );

  return (
    <RadioGroup value={ value } onValueChange={ onValueChange } className="flex flex-wrap gap-x-8 gap-y-2" ref={ groupRef }>
      { options.map( option => (
        <Label key={ option } htmlFor={ `${ idPrefix }-${ option }` } className="flex cursor-pointer items-center gap-2 text-[length:inherit] font-normal">
          <RadioGroupItem id={ `${ idPrefix }-${ option }` } value={ option } />
          { option }
        </Label>
      ) ) }
    </RadioGroup>
  );
}

export function ContactDetailsForm( { subject = 'General', inquiryType = 'General Question', fields, submitLabel = 'Send', initial = {}, className = '' }: ContactDetailsFormProps ) {
  const id = useId();
  const custom = fields !== undefined;
  const list = fields ?? DEFAULT_FIELDS;
  const data = useDataProvider();
  const { mutate, isPending } = data.useCreateContactMessage();
  const send = mutate as ( input: CreateContactMessageInput, options?: { onSuccess?: () => void } ) => void;
  const [ values, setValues ] = useState<Record<string, string>>( () => Object.fromEntries( list.map( field => [ field.id, initial[field.id] ?? '' ] ) ) );
  const [ errors, setErrors ] = useState<Record<string, string>>( {} );
  const [ sent, setSent ] = useState( false );
  const refs = useRef<Record<string, HTMLElement | null>>( {} );

  const onChange = useCallback( ( event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> ) => {
    const { name, value } = event.currentTarget;
    setValues( before => ( { ...before, [ name ]: value } ) );
  }, [] );

  const onChoice = useCallback( ( name: string, value: string ) => {
    setValues( before => ( { ...before, [ name ]: value } ) );
  }, [] );

  const onSent = useCallback( () => {
    setSent( true );
  }, [] );

  const onSubmit = useCallback( ( event: FormEvent<HTMLFormElement> ) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    for ( const field of list ) {
      const error = errorFor( field, values[field.id] ?? '' );
      if ( error ) {
        found[field.id] = error;
      }
    }
    setErrors( found );
    const first = list.find( field => found[field.id] );
    if ( first ) {
      refs.current[first.id]?.focus();
      return;
    }
    const message = custom ?
      list.filter( field => field.id !== 'name' && field.id !== 'email' ).map( field => `${ field.label }: ${ ( values[field.id] ?? '' ).trim() || '—' }` ).join( '\n' ) :
      ( values.message ?? '' ).trim();
    send( { name: ( values.name ?? '' ).trim(), email: ( values.email ?? '' ).trim(), subject, inquiry_type: inquiryType, message }, { onSuccess: onSent } );
  }, [ custom, inquiryType, list, onSent, send, subject, values ] );

  if ( sent ) {
    return <p className={ cn( 'm-0', className ) } role="status">Thanks — your message is on its way.</p>;
  }

  return (
    <form
      noValidate
      onSubmit={ onSubmit }
      className={ cn(
        custom ? 'grid w-full grid-cols-1 gap-x-[var(--grid-gutter)] gap-y-6 min-[735px]:grid-cols-2' : 'flex w-full flex-col gap-[33px] lg:w-[calc(var(--col)*3_+_3.375rem)]',
        className
      ) }
    >
      { list.map( field => {
        const fieldId = `${ id }-${ field.id }`;
        const error = errors[field.id];
        const star = field.required ? ' *' : '';
        const described = error ? `${ fieldId }-error` : undefined;
        const wide = !( 'half' in field && field.half );
        const errorLine = error && <p id={ described } className="m-0 mt-2 text-small">{ error }</p>;

        if ( field.kind === 'choice' ) {
          return (
            <fieldset key={ field.id } className="m-0 border-0 p-0 min-[735px]:col-span-2" aria-describedby={ described }>
              <legend className={ smallLabel }>{ field.label }{ star }</legend>
              <ChoiceGroup
                name={ field.id }
                value={ values[field.id] ?? '' }
                options={ field.options }
                idPrefix={ fieldId }
                onChoice={ onChoice }
                groupRef={ el => { refs.current[field.id] = el; } }
              />
              { errorLine }
            </fieldset>
          );
        }

        const shared = {
          id: fieldId,
          name: field.id,
          value: values[field.id] ?? '',
          onChange,
          autoComplete: AUTOCOMPLETE[field.id] ?? 'off',
          'aria-invalid': error ? true : undefined,
          'aria-describedby': described
        };

        if ( field.kind === 'textarea' && custom ) {
          return (
            <div key={ field.id } className="min-[735px]:col-span-2">
              <label htmlFor={ fieldId } className={ smallLabel }>{ field.label }{ star }</label>
              <textarea
                { ...shared }
                placeholder={ field.placeholder }
                ref={ el => { refs.current[field.id] = el; } }
                className="block h-[140px] w-full resize-none bg-transparent p-3 text-inherit outline-none [border:1px_solid_color-mix(in_srgb,currentColor_30%,transparent)] focus:[border-color:currentColor]"
              />
              { errorLine }
            </div>
          );
        }

        if ( field.kind === 'date' ) {
          return (
            <div key={ field.id } className={ cn( wide && 'min-[735px]:col-span-2' ) }>
              <label htmlFor={ fieldId } className={ smallLabel }>{ field.label }{ star }</label>
              <input { ...shared } type="date" ref={ el => { refs.current[field.id] = el; } } className={ lineClass } />
              { errorLine }
            </div>
          );
        }

        return (
          <div key={ field.id } className={ cn( 'relative pt-6', custom && wide && 'min-[735px]:col-span-2' ) }>
            { field.kind === 'textarea' ?
              <textarea { ...shared } placeholder=" " ref={ el => { refs.current[field.id] = el; } } className={ cn( 'peer h-[104px] resize-none', lineClass ) } /> :
              <input { ...shared } placeholder=" " ref={ el => { refs.current[field.id] = el; } } type={ field.kind } className={ cn( 'peer', lineClass ) } /> }
            <label htmlFor={ fieldId } className={ labelClass }>{ field.label }{ star }</label>
            { errorLine }
          </div>
        );
      } ) }
      <div className={ cn( 'mt-[7px]', custom && 'flex justify-end min-[735px]:col-span-2' ) }>
        <button type="submit" disabled={ isPending } className="m-0 cursor-pointer border-0 border-b border-current bg-transparent p-0 text-inherit disabled:opacity-50">
          { isPending ? 'Sending…' : submitLabel }
        </button>
      </div>
    </form>
  );
}
