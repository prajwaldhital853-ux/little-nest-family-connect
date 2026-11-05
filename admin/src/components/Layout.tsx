import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { resources } from "../cms/resources";
import { useAuth } from "../auth/AuthProvider";
import { applyTheme, storedTheme, type Theme } from "../theme";
import { useToast } from "./Toast";
import { Brand, Icon } from "./icons";

/* The rail is a drawer below this width, which is where the folding button stops meaning anything. */
const SMALL = "(max-width: 900px)";

function useSmallScreen() {
  const [ small, setSmall ] = useState( () => window.matchMedia( SMALL ).matches );
  useEffect(() => {
    const query = window.matchMedia( SMALL );
    const follow = () => setSmall( query.matches );
    query.addEventListener( "change", follow );
    return () => query.removeEventListener( "change", follow );
  }, [] );
  return small;
}

const GROUPS: { label: string; items: { to: string; label: string; icon: string; tone: number; end?: boolean }[] }[] = [
  {
    label: "Clinic",
    items: [
      { to: "/", label: "Today", icon: "today", tone: 0, end: true },
      { to: "/appointments", label: "Appointments", icon: "appointments", tone: 3 },
    ],
  },
  {
    label: "Website",
    items: [
      { to: "/home", label: "Home page", icon: "home", tone: 0 },
      ...resources.map( resource => ( {
        to: `/content/${ resource.slug }`,
        label: resource.plural,
        icon: resource.icon,
        tone: resource.tone,
      } ) ),
      { to: "/pages", label: "Page wording", icon: "pages", tone: 5 },
      { to: "/gallery", label: "Gallery", icon: "image", tone: 7 },
      { to: "/seo", label: "Search and sharing", icon: "search", tone: 8 },
    ],
  },
  {
    label: "How it is doing",
    items: [ { to: "/analytics", label: "Analytics", icon: "analytics", tone: 1 }, { to: "/audit", label: "What changed", icon: "audit", tone: 2 } ],
  },
  {
    label: "Panel",
    items: [ { to: "/staff", label: "Staff accounts", icon: "staff", tone: 6 }, { to: "/account", label: "My account", icon: "account", tone: 7 } ],
  },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [ narrow, setNarrow ] = useState( () => localStorage.getItem( "panel.nav" ) === "narrow" );
  const [ menuOpen, setMenuOpen ] = useState(false);
  const [ theme, setTheme ] = useState<Theme>( storedTheme );
  const [ waiting, setWaiting ] = useState(0);
  const small = useSmallScreen();

  function flipTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme( next );
    setTheme( next );
  }

  useEffect(() => {
    localStorage.setItem( "panel.nav", narrow ? "narrow" : "full" );
  }, [ narrow ] );

  /* The menu button folds the rail on a desk and opens the drawer on a phone. */
  function toggleMenu() {
    if ( small ) setMenuOpen( open => !open );
    else setNarrow( value => !value );
  }

  /* The drawer must not stay open over a page the visitor has already left. */
  const place = useLocation();
  useEffect(() => {
    setMenuOpen(false);
  }, [ place.pathname ] );

  /* The badge counts the same inbox number the Today screen shows, so it is never a decoration. */
  useEffect(() => {
    api
      .page( "/api/appointments/", { status: "pending", page_size: 1 } )
      .then( page => setWaiting( page.count ) )
      .catch( () => setWaiting( 0 ) );
  }, [] );

  async function onSignOut() {
    try {
      await signOut();
    } catch {
      toast.error( "That did not sign you out. Try again." );
      return;
    }
    navigate( "/login", { replace: true } );
    toast.success( "Signed out." );
  }

  const name = user?.full_name || user?.email || "";
  const initials = name
    .split( /\s+/ )
    .filter( Boolean )
    .slice( 0, 2 )
    .map( part => part[ 0 ]?.toUpperCase() ?? "" )
    .join( "" ) || "?";

  return (
    <div className={ `shell${ narrow ? " narrow" : "" }${ menuOpen ? " menu-open" : "" }` }>
      { menuOpen ? <div className="scrim" onClick={ () => setMenuOpen(false) } aria-hidden="true" /> : null }
      <aside className="side" aria-label="Panel sections">
        <Brand />
        <nav className="side-nav">
          { GROUPS.map( group => (
            <div key={ group.label }>
              <p className="side-group">{ group.label }</p>
              { group.items.map( item => {
                const count = item.to === "/appointments" ? waiting : 0;
                return (
                  <NavLink key={ item.to } to={ item.to } end={ item.end } title={ item.label } className={ `t${ item.tone }` }>
                    <Icon name={ item.icon } />
                    <span>{ item.label }</span>
                    { count > 0 ? <span className="side-badge" title="Appointments waiting for you">{ count }</span> : null }
                  </NavLink>
                );
              } ) }
            </div>
          ) ) }
        </nav>
      </aside>

      <div className="body">
        <header className="topbar">
          <button
            className="icon-btn"
            onClick={ toggleMenu }
            aria-label={ small ? ( menuOpen ? "Close the menu" : "Open the menu" ) : narrow ? "Show the menu" : "Hide the menu" }
            aria-expanded={ small ? menuOpen : undefined }
          >
            <Icon name="menu" />
          </button>
          <span className="topbar-spacer" />
          <span className="topbar-user">
            <span className="avatar">{ initials }</span>
            <span className="topbar-name">
              <strong>{ name }</strong>
              { user?.full_name ? <span>{ user.email }</span> : null }
            </span>
          </span>
          <button
            className="icon-btn"
            onClick={ flipTheme }
            aria-label={ theme === "dark" ? "Switch to the light panel" : "Switch to the dark panel" }
            title={ theme === "dark" ? "Light panel" : "Dark panel" }
          >
            <Icon name={ theme === "dark" ? "sun" : "moon" } />
          </button>
          <button className="icon-btn" onClick={ onSignOut } aria-label="Sign out" title="Sign out">
            <Icon name="logout" />
          </button>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
