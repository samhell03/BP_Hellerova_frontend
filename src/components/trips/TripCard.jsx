import { Link } from "react-router-dom";
import { formatDate, getTripStatusText } from "../../utils/date";
import { getCountryDisplayName } from "../../utils/countryNames";

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

function TripCard({ trip, onEditTrip, onDeleteTrip, countryNameMap = {} }) {
  const statusVariant = getStatusVariant(trip.startDate, trip.endDate);
  const displayCountry = getCountryDisplayName(
    trip.countryCode,
    trip.country,
    countryNameMap
  );

  return (
    <article className="my-trips-item">
      <Link to={`/trips/${trip._id}`} className="my-trips-item-main">
        <div className="my-trips-item-flag" title={displayCountry}>
          <img
            src={getFlagUrl(trip.countryCode)}
            alt={displayCountry}
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
                alt={displayCountry}
                className="trip-country-flag"
              />
              {displayCountry}
            </span>

            {" • "}
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </p>

          <p className="my-trips-item-status">
            {getTripStatusText(trip.startDate, trip.endDate)}
          </p>
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

export default TripCard;
