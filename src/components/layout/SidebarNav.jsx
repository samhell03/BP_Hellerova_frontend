import { NavLink } from "react-router-dom";

function SidebarNav({ onLogout, closeMenu }) {
  const navClass = ({ isActive }) =>
    isActive ? "sidebar-nav-link active" : "sidebar-nav-link";

  return (
    <nav className="sidebar-nav">
      <NavLink to="/" end className={navClass} onClick={closeMenu}>
        Domů
      </NavLink>

      <NavLink to="/trips" className={navClass} onClick={closeMenu}>
        Moje výlety
      </NavLink>

      <NavLink to="/calendar" className={navClass} onClick={closeMenu}>
        Kalendář výletů
      </NavLink>

      <NavLink to="/statistic" className={navClass} onClick={closeMenu}>
        Moje statistiky
      </NavLink>

      <NavLink to="/templates" className={navClass} onClick={closeMenu}>
        Šablony balíčků
      </NavLink>

      <NavLink to="/profile" className={navClass} onClick={closeMenu}>
        Profil
      </NavLink>

      <div className="sidebar-divider" />

      <button className="sidebar-logout-button" onClick={onLogout}>
        Odhlásit se
      </button>
    </nav>
  );
}

export default SidebarNav;