import "../styles/guest-homepage.css";

function GuestHomePage() {
  return (
    <main className="content">
      <section className="guest-home-page">
        <div className="guest-home-hero">
          <div className="guest-home-content">
            <span className="guest-home-label">Cestovatelský plánovač</span>

            <h1>Mějte své výlety přehledně na jednom místě</h1>

            <p>
              Webová aplikace pomáhá s plánováním cest, evidencí navštívených
              destinací a správou důležitých informací k jednotlivým výletům.
            </p>

            <div className="guest-home-notice">
              <strong>Začněte přihlášením nebo registrací v levém menu.</strong>
              <span>
                Po přihlášení můžete vytvářet vlastní výlety, pracovat s balíčky,
                sledovat mapu navštívených zemí a spravovat svůj cestovní přehled.
              </span>
            </div>
          </div>

          <aside className="guest-home-panel">
            <h2>Co aplikace nabízí</h2>

            <div className="guest-feature-list">
              <div className="guest-feature-item">
                <span>01</span>
                <div>
                  <strong>Správa výletů</strong>
                  <p>Ukládání destinací, termínů a základních údajů o cestách.</p>
                </div>
              </div>

              <div className="guest-feature-item">
                <span>02</span>
                <div>
                  <strong>Mapa světa</strong>
                  <p>Přehled zemí, které uživatel navštívil nebo plánuje navštívit.</p>
                </div>
              </div>

              <div className="guest-feature-item">
                <span>03</span>
                <div>
                  <strong>Balíčky k výletům</strong>
                  <p>Checklisty, počasí, kontakty a upozornění podle typu cesty.</p>
                </div>
              </div>

              <div className="guest-feature-item">
                <span>04</span>
                <div>
                  <strong>Osobní přehled</strong>
                  <p>Souhrn cest, statistik a informací v uživatelském účtu.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default GuestHomePage;