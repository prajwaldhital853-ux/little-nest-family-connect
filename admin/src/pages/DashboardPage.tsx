import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Appointment, Page } from "../api/types";
import SectionHead from "../components/SectionHead";
import { Notice, Pill, StatCard, formatDate } from "../components/ui";
import { resources } from "../cms/resources";

export default function DashboardPage() {
  const [ pending, setPending ] = useState<Page<Appointment> | null>( null );
  const [ confirmed, setConfirmed ] = useState<Page<Appointment> | null>( null );
  const [ recent, setRecent ] = useState<Page<Appointment> | null>( null );
  const [ drafts, setDrafts ] = useState<{ slug: string; name: string; count: number }[]>( [] );
  const [ error, setError ] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [ newRequests, upcoming, latest ] = await Promise.all([
          api.page<Appointment>( "/api/appointments/", { status: "pending", page_size: 5 } ),
          api.page<Appointment>( "/api/appointments/", { status: "confirmed", date_from: today(), page_size: 5 } ),
          api.page<Appointment>( "/api/appointments/", { ordering: "-created_at", page_size: 5 } ),
        ]);
        setPending( newRequests );
        setConfirmed( upcoming );
        setRecent( latest );
        const counts = await Promise.all(
          resources.map( async resource => ( {
            slug: resource.slug,
            name: resource.plural,
            count: ( await api.page( resource.endpoint, { status: "draft", page_size: 1 } ) ).count,
          } ) )
        );
        setDrafts( counts.filter( item => item.count > 0 ) );      } catch ( reason ) {
        setError( reason instanceof ApiError ? reason.message : "Could not reach the server." );
      }
    };
    load();
  }, [] );

  const all = recent?.count ?? null;
  const draftTotal = drafts.reduce( ( total, item ) => total + item.count, 0 );

  return (
    <section className="today tone-page t0">
      <SectionHead
        icon="today"
        title="Today"
        note={ `${ pending ? `${ pending.count } waiting for a reply` : "Loading" }${ confirmed ? ` · ${ confirmed.count } confirmed from today onward` : "" }` }
        actions={ (
          <Link className="btn btn-quiet" to="/appointments">
            Open the inbox
          </Link>
        ) }
      />

      { error ? <Notice>{ error }</Notice> : null }

      <div className="stats">
        <StatCard
          label="Waiting for a reply"
          value={ pending?.count ?? "–" }
          flag="New"
          tone="pink"
          share={ share( pending?.count, all ) }
          note={ all ? `of ${ all } submissions in all` : "Nothing received yet" }
        />
        <StatCard
          label="Confirmed"
          value={ confirmed?.count ?? "–" }
          flag="Upcoming"
          tone="teal"
          share={ share( confirmed?.count, all ) }
          note="from today onward"
        />
        <StatCard label="Submissions" value={ all ?? "–" } flag="All time" tone="blue" note="the five most recent are below" />
        <StatCard label="Website drafts" value={ draftTotal } flag="Unpublished" tone="amber" note="waiting to go on the site" />
      </div>

      <Rows title="New requests" rows={ pending?.results ?? null } empty="Nothing is waiting." />
      <Rows title="Confirmed" rows={ confirmed?.results ?? null } empty="No confirmed appointments from today onward." />
      <Rows title="Latest submissions" rows={ recent?.results ?? null } empty="No submissions yet." />

      <div className="block drafts">
        <p className="field-label">Website drafts</p>
        { drafts.length === 0 ? (
          <p className="text-small quiet">Everything on the site is published.</p>
        ) : (
          <ul className="draft-list">
            { drafts.map( item => (
              <li key={ item.slug }>
                <Link to={ `/content/${ item.slug }?status=draft` }>
                  { item.count } { item.name.toLowerCase() } in draft
                </Link>
              </li>
            ) ) }
          </ul>
        ) }
      </div>
    </section>
  );
}

function Rows( { title, rows, empty }: { title: string; rows: Appointment[] | null; empty: string } ) {
  return (
    <div className="block">
      <p className="field-label">{ title }</p>
      { rows === null ? (
        <p className="text-small">Loading</p>
      ) : rows.length === 0 ? (
        <p className="text-small quiet">{ empty }</p>
      ) : (
        <table className="grid">
          <tbody>
            { rows.map( row => (
              <tr key={ row.id }>
                <td>
                  <Link to={ `/appointments/${ row.id }` }>{ row.patient_name }</Link>
                </td>
                <td>{ row.reference }</td>
                <td>{ formatDate( row.scheduled_at ) || "Not scheduled" }</td>
                <td>
                  <Pill value={ row.status } label={ row.status_display } />
                </td>
              </tr>
            ) ) }
          </tbody>
        </table>
      ) }
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice( 0, 10 );
}

/** A bar only when there is a real whole to measure against. */
function share( part: number | undefined, whole: number | null ): number | null {
  return part && whole ? part / whole : null;
}
