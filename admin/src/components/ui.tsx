import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Icon } from "./icons";

export function Button( {
  children,
  tone = "primary",
  busy = false,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "quiet" | "danger"; busy?: boolean } ) {
  return (
    <button className={ `btn btn-${ tone }` } aria-busy={ busy || undefined } disabled={ disabled || busy } { ...rest }>
      { busy ? <span className="btn-spin" aria-hidden="true" /> : null }
      { children }
    </button>
  );
}

/** A number, what kind of number it is, and how much of the whole it accounts for. */
export function StatCard( {
  label,
  value,
  flag,
  tone = "blue",
  share,
  delta,
  note,
}: {
  label: string;
  value: ReactNode;
  flag?: string;
  tone?: "blue" | "pink" | "purple" | "teal" | "amber";
  share?: number | null;
  delta?: number | null;
  note?: string;
} ) {
  const change = delta === null || delta === undefined || !Number.isFinite( delta ) ? null : Math.round( delta );
  return (
    <div className={ `stat tone-${ tone }` }>
      <div className="stat-top">
        <p className="stat-label">{ label }</p>
        { flag ? <span className="stat-flag">{ flag }</span> : null }
      </div>
      <div className="stat-mid">
        <p className="stat-value">{ value }</p>
        { change === null ? null : (
          <span className={ `stat-delta${ change > 0 ? " up" : change < 0 ? " down" : "" }` }>
            <Icon name={ change < 0 ? "down" : "up" } size={ 15 } />
            { Math.abs( change ) }%
          </span>
        ) }
      </div>
      { share === null || share === undefined ? null : (
        <span className="stat-track">
          <span className="stat-fill" style={ { width: `${ Math.min( 100, Math.max( 2, share * 100 ) ) }%` } } />
        </span>
      ) }
      { note ? <p className="stat-note">{ note }</p> : null }
    </div>
  );
}

export function Field( {
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string[];
  children: ReactNode;
} ) {
  return (
    <label className={ error?.length ? "field field-error" : "field" }>
      <span className="field-label">{ label }</span>
      { children }
      { help && !error?.length ? <span className="field-help">{ help }</span> : null }
      { error?.length ? <span className="field-help">{ error.join( " " ) }</span> : null }
    </label>
  );
}

export function TextInput( props: InputHTMLAttributes<HTMLInputElement> ) {
  return <input { ...props } />;
}

export function TextArea( props: TextareaHTMLAttributes<HTMLTextAreaElement> ) {
  return <textarea { ...props } rows={ props.rows ?? 5 } />;
}

export function Select( {
  options,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { options: [string, string][] } ) {
  return (
    <select { ...rest }>
      { options.map( ( [ value, label ] ) => (
        <option key={ value } value={ value }>
          { label }
        </option>
      ) ) }
    </select>
  );
}

export function Checkbox( { label, checked, onChange }: { label: string; checked: boolean; onChange: ( next: boolean ) => void } ) {
  return (
    <label className="check">
      <input type="checkbox" checked={ checked } onChange={ ( event: ChangeEvent<HTMLInputElement> ) => onChange( event.target.checked ) } />
      <span>{ label }</span>
    </label>
  );
}

const TONES: Record<string, string> = {
  draft: "neutral",
  published: "good",
  pending: "warn",
  confirmed: "good",
  completed: "flat",
  cancelled: "bad",
  no_show: "bad",
  allowed: "good",
  blocked: "bad",
};

export function Pill( { value, label }: { value: string; label?: string } ) {
  return <span className={ `pill pill-${ TONES[ value ] ?? "neutral" }` }>{ label ?? value }</span>;
}

export function Notice( { kind = "error", children }: { kind?: "error" | "good"; children: ReactNode } ) {
  return <p className={ `notice notice-${ kind }` }>{ children }</p>;
}

export function Pager( {
  count,
  page,
  pageSize,
  onPage,
}: {
  count: number;
  page: number;
  pageSize: number;
  onPage: ( next: number ) => void;
} ) {
  const pages = Math.max( 1, Math.ceil( count / pageSize ) );
  if ( pages === 1 ) return null;
  const from = ( page - 1 ) * pageSize + 1;
  const to = Math.min( count, page * pageSize );
  return (
    <div className="pager">
      <span>
        { from }&ndash;{ to } of { count }
      </span>
      <div>
        <Button tone="quiet" disabled={ page <= 1 } onClick={ () => onPage( page - 1 ) }>
          Previous
        </Button>
        <Button tone="quiet" disabled={ page >= pages } onClick={ () => onPage( page + 1 ) }>
          Next
        </Button>
      </div>
    </div>
  );
}

export function formatDate( value?: string | null ): string {
  if ( !value ) return "";
  const date = new Date( value );
  if ( Number.isNaN( date.getTime() ) ) return value;
  return date.toLocaleString( undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } );
}

export function formatDay( value?: string | null ): string {
  if ( !value ) return "";
  const date = new Date( value );
  if ( Number.isNaN( date.getTime() ) ) return value;
  return date.toLocaleDateString( undefined, { day: "2-digit", month: "short", year: "numeric" } );
}

export function toLocalInput( iso?: string | null ): string {
  if ( !iso ) return "";
  const date = new Date( iso );
  if ( Number.isNaN( date.getTime() ) ) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date( date.getTime() - offset ).toISOString().slice( 0, 16 );
}
