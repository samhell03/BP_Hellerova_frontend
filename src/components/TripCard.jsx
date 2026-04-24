{/* import { Link } from "react-router-dom";
import { formatDate, getTripStatusText } from "../../utils/date";

function getStatusVariant(startDate, endDate) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start <= today && end >= today) return "ongoing";
  if (end < today) return "past";
  return "upcoming";
}

function getStatusBadgeText(variant) {
  if (variant === "ongoing") return "Probíhá";
  if (variant === "past") return "Proběhl";
  return "Nadcházející";
}

function getFlagUrl(countryCode) {
  if (!countryCode) return "";
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function getCountryAccentColor(code) {
  if (!code) return "#64748b";

  const normalized = code.toUpperCase();
  let hash = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 52%)`;
}

function getCountdownProgress(startDate, endDate) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < today) {
    return 100;
  }

  if (start <= today && end >= today) {
    return 100;
  }

  const totalWindowDays = Math.max(
    1,
    Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  );

  const daysUntilStart = Math.max(
    0,
    Math.ceil((start - today) / (1000 * 60 * 60 * 24))
  );

  const elapsedBeforeStart = totalWindowDays - daysUntilStart;
  const progress = (elapsedBeforeStart / totalWindowDays) * 100;

  return Math.max(6, Math.min(100, Math.round(progress)));
}

function TripCard({ trip, onEditTrip, onDeleteTrip }) {
  const statusVariant = getStatusVariant(trip.startDate, trip.endDate);
  const accentColor = getCountryAccentColor(trip.countryCode);
  const countdownProgress = getCountdownProgress(trip.startDate, trip.endDate);

  return (
    <article
      className="my-trips-item"
      style={{
        "--trip-accent": accentColor,
        "--trip-progress": `${countdownProgress}%`
      }}
    >
      <Link to={`/trips/${trip._id}`} className="my-trips-item-main">
        <div className="my-trips-item-flag" title={trip.country}>
          <img
            src={getFlagUrl(trip.countryCode)}
            alt={trip.country}
            className="my-trips-item-flag-image"
          />
        </div>

        <div className="my-trips-item-content">
          <div className="my-trips-item-topline">
            <h3 className="my-trips-item-title">{trip.title}</h3>

            <span className={`my-trips-status-badge ${statusVariant}`}>
              {getStatusBadgeText(statusVariant)}
            </span>
          </div>

          <p className="my-trips-item-meta">
            <span className="trip-country">
              <img
                src={getFlagUrl(trip.countryCode)}
                alt={trip.country}
                className="trip-country-flag"
              />
              {trip.country}
            </span>
            {" • "}
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </p>

          <p className="my-trips-item-status">
            {getTripStatusText(trip.startDate, trip.endDate)}
          </p>

          <div className="my-trips-progress" aria-hidden="true">
            <div className="my-trips-progress-bar"></div>
          </div>
        </div>
      </Link>

      <div className="my-trips-item-actions">
        <button
          className="my-trips-icon-button"
          onClick={() => onEditTrip(trip)}
          title="Upravit výlet"
        >
          ✏️
        </button>

        <button
          className="my-trips-icon-button my-trips-delete-button"
          onClick={() => onDeleteTrip(trip._id)}
          title="Smazat výlet"
        >
          🗑️
        </button>
      </div>
    </article>
  );
}

export default TripCard; */}