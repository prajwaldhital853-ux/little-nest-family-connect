import type { ReactNode } from "react";
import { Icon } from "./icons";

/* The heading every part of the panel opens with. The colour comes from the tone class on the
   page itself, so a section that holds a table never looks like the one beside it. */
export default function SectionHead( { icon, title, note, crumb, actions }: {
  icon: string;
  title: ReactNode;
  note?: ReactNode;
  crumb?: ReactNode;
  actions?: ReactNode;
} ) {
  return (
    <header className="page-head">
      <span className="head-mark">
        <Icon name={ icon } size={ 22 } />
      </span>
      <div className="head-titles">
        { crumb ? <p className="crumb">{ crumb }</p> : null }
        <h1>{ title }</h1>
        { note ? <p className="head-note text-small">{ note }</p> : null }
      </div>
      { actions ? <div className="head-actions">{ actions }</div> : null }
    </header>
  );
}
