import { useState } from "react";
import AuthForm from "../auth/AuthForm";
import SidebarNav from "./SidebarNav";
import "../../styles/sidebar.css";

function Sidebar({
  isLoggedIn,
  authChecked,
  setIsLoggedIn,
  setUserId,
  setUserName,
  fetchTrips,
  handleLogout
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {!isOpen && (
        <button className="sidebar-menu-toggle" onClick={openMenu}>
          ☰
        </button>
      )}

      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={closeMenu}
      >
        <aside className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              {isLoggedIn ? "Menu" : "Vítejte"}
            </h2>

            <button className="sidebar-close-button" onClick={closeMenu}>
              &times;
            </button>
          </div>

          {!authChecked ? (
            <div className="sidebar-auth-loading">
              <div className="sidebar-loading-spinner"></div>
              <p>Ověřuji data...</p>
            </div>
          ) : !isLoggedIn ? (
            <AuthForm
              setIsLoggedIn={setIsLoggedIn}
              setUserId={setUserId}
              setUserName={setUserName}
              fetchTrips={fetchTrips}
              onSuccess={closeMenu}
            />
          ) : (
            <SidebarNav
              onLogout={() => {
                handleLogout();
                closeMenu();
              }}
              closeMenu={closeMenu}
            />
          )}
        </aside>
      </div>
    </>
  );
}

export default Sidebar;
