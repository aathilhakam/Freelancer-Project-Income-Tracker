import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Search,
  ArrowUpRight,
  X,
  Command,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { initials, errorMessage } from "../../lib/utils";
import { toast } from "sonner";
const links = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/projects", "Projects", FolderKanban],
  ["/clients", "Clients", Users],
  ["/payments", "Payments", Wallet],
  ["/analytics", "Income Analytics", ChartNoAxesCombined],
];
export function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <ChartNoAxesCombined size={24} />
      </span>
      <span>
        Freelance<span className="brand-flow">Flow</span>
        <small>YOUR BUSINESS, IN FLOW</small>
      </span>
    </div>
  );
}
export default function Layout() {
  const { user, logout } = useAuth(),
    location = useLocation(),
    navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState("");
  const title =
    links.find(([url]) => location.pathname.startsWith(url))?.[1] || "Settings";
  async function signOut() {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      {mobile && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Logo />
        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          {links.map(([url, label, Icon]) => (
            <NavLink
              key={url}
              to={url}
              onClick={() => setMobile(false)}
              title={label}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <span className="note-symbol">✦</span>
            <strong>Make room for great work.</strong>
            <p>A little clarity goes a long way.</p>
            <NavLink to="/analytics">
              See your progress <ArrowUpRight size={16} />
            </NavLink>
          </div>
          <NavLink to="/settings" title="Settings">
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
          <button onClick={signOut} title="Logout">
            <LogOut size={19} />
            <span>Logout</span>
          </button>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Open navigation"
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/projects?q=${encodeURIComponent(query)}`);
                setQuery("");
              }}
            >
              <Search size={17} />
              <input
                aria-label="Search projects"
                placeholder="Search projects…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>
                <Command size={11} /> ↵
              </kbd>
            </form>
            <details className="profile-menu">
              <summary>
                <span className="avatar">{initials(user.name)}</span>
                <span className="profile-text">
                  <strong>{user.name}</strong>
                  <small>Freelancer</small>
                </span>
              </summary>
              <div className="profile-dropdown">
                <NavLink to="/settings">Account settings</NavLink>
                <button onClick={signOut}>Sign out</button>
              </div>
            </details>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          FreelanceFlow <span>Built for independent minds.</span>
        </footer>
      </div>
    </div>
  );
}
