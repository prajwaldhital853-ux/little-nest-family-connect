import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { AnalyticsSummary } from "../api/types";
import SectionHead from "../components/SectionHead";
import { Notice, Pill, StatCard } from "../components/ui";

const RANGES = [ 7, 30, 90 ];

const VITAL_NAMES: Record<string, string> = {
  lcp: "Largest contentful paint",
  fcp: "First contentful paint",
  inp: "Interaction to next paint",
  ttfb: "Time to first byte",
  cls: "Layout shift",
};

export default function AnalyticsPage() {
  const [ days, setDays ] = useState(30);
  const [ data, setData ] = useState<AnalyticsSummary | null>( null );
  const [ error, setError ] = useState("");
  const series = data ? visible( data ) : [];

  useEffect(() => {
    setData( null );
    setError( "" );
    api
      .get<AnalyticsSummary>( `/api/analytics/summary/?days=${ days }` )
      .then( setData )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ days ] );

  return (
    <section className="tone-page t1">
      <SectionHead
        icon="analytics"
        title="How the site is doing"
        note={ `${ data ? `${ data.range.from } to ${ data.range.to }` : "Loading" }${ data?.totals.since ? ` · measuring since ${ data.totals.since.slice( 0, 10 ) }` : "" }` }
        actions={ (
          <div className="tabs">
            { RANGES.map( value => (
              <button key={ value } className={ days === value ? "on" : "" } onClick={ () => setDays( value ) }>
                { value } days
              </button>
            ) ) }
          </div>
        ) }
      />

      { error ? <Notice>{ error }</Notice> : null }
      { !data ? (
        !error && <p className="text-small loading">Loading</p>
      ) : (
        <>
          <div className="stats">
            <StatCard
              label="Page views"
              value={ data.totals.pageviews }
              flag={ `${ days } days` }
              tone="blue"
              delta={ change( series, row => row.pageviews ) }
              note={ `against the ${ days } before that` }
            />
            <StatCard
              label="Visitors"
              value={ data.totals.visitors }
              flag={ `${ days } days` }
              tone="pink"
              delta={ change( series, row => row.visitors ) }
              note="counted once a day, never by name"
            />
            <StatCard
              label="Visits"
              value={ data.totals.sessions }
              flag={ `${ days } days` }
              tone="purple"
              note="one visit can read several pages"
            />
            <StatCard
              label="Enquiries"
              value={ data.totals.enquiries }
              flag={ `${ days } days` }
              tone="teal"
              delta={ change( series, row => row.enquiries ) }
              note="consultation requests sent"
            />
            <StatCard label="Time on a page" value={ hold( data.totals.average_seconds ) } flag="average" tone="amber" note="from the timings the site reports" />
          </div>

          <div className="block">
            <p className="field-label">Each day</p>
            <Trend series={ series } />
            <p className="chart-key">
              <span className="key key-views">Page views</span>
              <span className="key key-people">Visitors</span>
              <span className="key key-asks">Enquiries</span>
            </p>
          </div>

          <div className="chart-pair">
            <Bars title="Most looked at pages" rows={ data.top_pages.map( row => ( { label: row.path, value: row.views } ) ) } />
            <div className="block">
              <p className="field-label">How fast it felt</p>
              { Object.keys( data.vitals ).length === 0 ? (
                <p className="text-small quiet">No timings reported yet.</p>
              ) : (
                <table className="grid">
                  <tbody>
                    { Object.entries( data.vitals ).map( ( [ metric, row ] ) => (
                      <tr key={ metric }>
                        <td>{ VITAL_NAMES[ metric ] ?? metric }</td>
                        <td>{ reading( metric, row.p75 ) }</td>
                        <td className="text-small quiet">{ row.samples } samples</td>
                        <td>
                          <Pill value={ row.rating === "good" ? "published" : row.rating === "poor" ? "cancelled" : "pending" } label={ row.rating } />
                        </td>
                      </tr>
                    ) ) }
                  </tbody>
                </table>
              ) }
            </div>
          </div>

          <div className="chart-pair">
            <Bars title="Devices" tone="pink" rows={ data.devices.map( row => ( { label: row.kind, value: row.views } ) ) } />
            <Bars title="Browsers" tone="purple" rows={ data.browsers.map( row => ( { label: row.browser, value: row.total } ) ) } />
          </div>

          <div className="chart-pair">
            <Bars title="Where visitors came from" tone="teal" rows={ data.referrers.map( row => ( { label: row.referrer_host, value: row.total } ) ) } />
            <Bars title="Campaigns" tone="amber" rows={ data.campaigns.map( row => ( { label: `${ row.utm_source }${ row.utm_medium ? ` / ${ row.utm_medium }` : "" }`, value: row.total } ) ) } />
          </div>

          <p className="text-small quiet">
            Nothing here names a person: the site reports a path, a daily hashed token and five timings.{" "}
            <Link to="/audit">See what was changed</Link> alongside it.
          </p>
        </>
      ) }
    </section>
  );
}

/** Days before the first visitor are a flat line of nothing, so the chart starts where the measuring did. */
function visible( data: AnalyticsSummary ): AnalyticsSummary["series"] {
  const since = data.totals.since?.slice( 0, 10 );
  return since ? data.series.filter( row => row.day >= since ) : data.series;
}

function Trend( { series }: { series: AnalyticsSummary["series"] } ) {
  const width = 900;
  const height = 230;
  const pad = { top: 14, right: 14, bottom: 26, left: 40 };
  const top = Math.max( 1, ...series.map( row => Math.max( row.pageviews, row.visitors, row.enquiries ) ) );
  const step = Math.max( 1, series.length - 1 );
  const at = ( index: number ) => pad.left + ( index * ( width - pad.left - pad.right ) ) / step;
  const up = ( value: number ) => height - pad.bottom - ( value / top ) * ( height - pad.top - pad.bottom );
  const points = ( pick: ( row: AnalyticsSummary["series"][ number ] ) => number ) =>
    series.map( ( row, index ) => [ at( index ), up( pick( row ) ) ] as [ number, number ] );
  const labels = series.filter( ( _, index ) => index % Math.max( 1, Math.ceil( series.length / 6 ) ) === 0 );
  const levels = [ 1, 0.75, 0.5, 0.25, 0 ];
  const views = points( row => row.pageviews );

  return (
    <svg className="trend" viewBox={ `0 0 ${ width } ${ height }` } role="img" aria-label="Page views, visitors and enquiries for each day">
      { levels.map( part => (
        <line
          key={ part }
          x1={ pad.left }
          x2={ width - pad.right }
          y1={ up( top * part ) }
          y2={ up( top * part ) }
          className={ part === 0 ? "axis" : "gridline" }
        />
      ) ) }
      { levels.map( part => (
        <text key={ part } x={ 6 } y={ up( top * part ) + 3 } className="tick">
          { Math.round( top * part ) }
        </text>
      ) ) }
      { views.length > 1 ? (
        <path className="area area-views" d={ `${ curve( views ) } L${ views[ views.length - 1 ][ 0 ] },${ up( 0 ) } L${ views[ 0 ][ 0 ] },${ up( 0 ) } Z` } />
      ) : null }
      <path className="line line-views" d={ curve( views ) } />
      <path className="line line-people" d={ curve( points( row => row.visitors ) ) } />
      <path className="line line-asks" d={ curve( points( row => row.enquiries * 4 ) ) } />
      { series.map( ( row, index ) => (
        <circle key={ row.day } cx={ at( index ) } cy={ up( row.pageviews ) } r={ 2.6 } className="dot dot-views">
          <title>{ `${ row.day }: ${ row.pageviews } views, ${ row.visitors } visitors, ${ row.enquiries } enquiries` }</title>
        </circle>
      ) ) }
      { labels.map( row => (
        <text key={ row.day } x={ at( series.indexOf( row ) ) } y={ height - 6 } className="tick" textAnchor="middle">
          { row.day.slice( 5 ) }
        </text>
      ) ) }
    </svg>
  );
}

/** Day to day is angular; the shape people read is the run, so the line bends between the points. */
function curve( points: [ number, number ][] ): string {
  return points.reduce( ( path, [ x, y ], index ) => {
    if ( index === 0 ) return `M${ x },${ y }`;
    const [ before, beforeY ] = points[ index - 1 ];
    const middle = ( before + x ) / 2;
    return `${ path } C${ middle },${ beforeY } ${ middle },${ y } ${ x },${ y }`;
  }, "" );
}

/** The last stretch of days against the same number of days before it, so both sides are equal. */
function change( series: AnalyticsSummary["series"], pick: ( row: AnalyticsSummary["series"][ number ] ) => number ): number | null {
  const half = Math.floor( series.length / 2 );
  if ( half < 1 ) return null;
  const total = ( rows: AnalyticsSummary["series"] ) => rows.reduce( ( sum, row ) => sum + pick( row ), 0 );
  const before = total( series.slice( -2 * half, -half ) );
  const after = total( series.slice( -half ) );
  return before ? ( ( after - before ) / before ) * 100 : null;
}

function Bars( { title, rows, tone = "blue" }: { title: string; rows: { label: string; value: number }[]; tone?: "blue" | "pink" | "purple" | "teal" | "amber" } ) {
  const top = Math.max( 1, ...rows.map( row => row.value ) );
  return (
    <div className={ `block tone-${ tone }` }>
      <p className="field-label">{ title }</p>
      { rows.length === 0 ? <p className="text-small quiet">Nothing recorded in this window.</p> : null }
      { rows.map( row => (
        <div className="bar-row" key={ row.label }>
          <span className="bar-label" title={ row.label }>
            { row.label }
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={ { width: `${ Math.max( 2, ( row.value / top ) * 100 ) }%` } } />
          </span>
          <span className="bar-value">{ row.value }</span>
        </div>
      ) ) }
    </div>
  );
}

function hold( seconds: number ): string {
  if ( !seconds ) return "No timings yet";
  const mins = Math.floor( seconds / 60 );
  return mins ? `${ mins }m ${ Math.round( seconds % 60 ) }s` : `${ Math.round( seconds ) }s`;
}

function reading( metric: string, value: number ): string {
  return metric === "cls" ? value.toFixed( 3 ) : `${ Math.round( value ) } ms`;
}
