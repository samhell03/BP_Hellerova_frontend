function HeaderCard({ userName, upcomingTrip, isLoggedIn, onNewTrip }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-content">
          <h1>Ahoj, {userName}</h1>

          <p className="hero-text">
            {isLoggedIn && upcomingTrip ? (
              <>
                Tvé další dobrodružství <strong>{upcomingTrip.title}</strong>{" "}
                začíná za <strong>{upcomingTrip.daysLeft} dní</strong>.
              </>
            ) : (
              "Přihlas se a začni plánovat svou další cestu ještě dnes."
            )}
          </p>

          {isLoggedIn && (
            <button className="btn-primary" onClick={onNewTrip}>
              Naplánovat výlet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default HeaderCard;