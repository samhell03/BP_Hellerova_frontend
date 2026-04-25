import "../../styles/weatherAlerts.css";

function getPriority(notification) {
  const title = (notification?.title || "").toLowerCase();

  if (title.includes("bouř")) return 1;
  if (title.includes("horko")) return 2;
  if (title.includes("nízká") || title.includes("teplota")) return 2;
  if (title.includes("déšť") || title.includes("sráž")) return 3;
  if (title.includes("vítr")) return 4;

  return 5;
}

function getMainNotification(notifications = []) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  return [...notifications].sort((a, b) => {
    const priorityDiff = getPriority(a) - getPriority(b);

    if (priorityDiff !== 0) return priorityDiff;

    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  })[0];
}

function getStatusClass(notification) {
  if (!notification) return "safe";

  const title = (notification.title || "").toLowerCase();

  if (title.includes("bouř")) return "danger";
  if (title.includes("horko")) return "warning";
  if (title.includes("nízká")) return "warning";
  if (title.includes("déšť")) return "info";
  if (title.includes("vítr")) return "warning";

  return notification.severity || "warning";
}

function WeatherAlertsCard({ notificationsPackage, onImport, onRemove }) {
  const notifications = notificationsPackage?.notifications || [];
  const mainNotification = getMainNotification(notifications);
  const statusClass = getStatusClass(mainNotification);

  return (
    <section className="weather-alerts-card">
      <div className="weather-alerts-head">
        <h2>Notifikace</h2>
      </div>

      {!notificationsPackage ? (
        <div className="weather-alerts-status weather-alerts-status-empty">
          <div>
            <strong>Balíček není přidaný</strong>
            <p>Pro tento výlet zatím nejsou zapnuté výstrahy počasí.</p>

            <button
              type="button"
              className="weather-alerts-button"
              onClick={onImport}
            >
              Importovat balíček
            </button>
          </div>
        </div>
      ) : !mainNotification ? (
        <div className="weather-alerts-status weather-alerts-status-safe">
          <span className="weather-alerts-icon">✓</span>

          <div>
            <strong>Bez výstrah</strong>
            <p>Dnes nejsou hlášeny žádné nebezpečné meteorologické jevy.</p>
          </div>
        </div>
      ) : (
        <div className={`weather-alerts-status weather-alerts-status-${statusClass}`}>
          <span className="weather-alerts-icon">!</span>

          <div>
            <strong>{mainNotification.title}</strong>
            <p>{mainNotification.message}</p>
          </div>
        </div>
      )}

      {notificationsPackage && (
        <div className="weather-alerts-actions">
          <button
            type="button"
            className="weather-alerts-secondary-button"
            onClick={onRemove}
          >
            Odebrat balíček
          </button>
        </div>
      )}
    </section>
  );
}

export default WeatherAlertsCard;