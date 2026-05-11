import { useEffect, useMemo, useState } from "react";
import TripList from "../components/trips/TripList";
import TripsEmptyState from "../components/trips/TripsEmptyState";
import { getCountries } from "../api/countries";
import {
  buildCountryNameMap,
  getCountryDisplayName,
  normalizeText
} from "../utils/countryNames";
import "../styles/mytrips.css";

function getTripPhase(trip) {
  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  if (start <= today && end >= today) return "ongoing";
  if (end < today) return "past";
  return "upcoming";
}

function sortTrips(trips, sortBy, countryNameMap) {
  const sorted = [...trips];

  switch (sortBy) {
    case "start-asc":
      return sorted.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    case "start-desc":
      return sorted.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    case "name-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, "cs"));
    case "country-asc":
      return sorted.sort((a, b) =>
        getCountryDisplayName(a.countryCode, a.country, countryNameMap).localeCompare(
          getCountryDisplayName(b.countryCode, b.country, countryNameMap),
          "cs"
        )
      );
    default:
      return sorted;
  }
}

function matchesSearch(trip, query, countryNameMap) {
  const title = normalizeText(trip.title);
  const country = normalizeText(
    getCountryDisplayName(trip.countryCode, trip.country, countryNameMap)
  );
  const rawCountry = normalizeText(trip.country);
  const code = normalizeText(trip.countryCode);

  return (
    title.includes(query) ||
    country.includes(query) ||
    rawCountry.includes(query) ||
    code.includes(query)
  );
}

function MyTrips({ isLoggedIn, myTrips, onCreateTrip, onEditTrip, onDeleteTrip }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("start-asc");

  const [countries, setCountries] = useState([]);

  useEffect(() => {
    let active = true;

    const loadCountries = async () => {
      try {
        const data = await getCountries();

        if (active) {
          setCountries(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Chyba při načítání zemí:", err);
      }
    };

    loadCountries();

    return () => {
      active = false;
    };
  }, []);

  const countryNameMap = useMemo(() => buildCountryNameMap(countries), [countries]);

  const stats = useMemo(() => {
    const upcoming = myTrips.filter((trip) => getTripPhase(trip) === "upcoming").length;
    const ongoing = myTrips.filter((trip) => getTripPhase(trip) === "ongoing").length;
    const past = myTrips.filter((trip) => getTripPhase(trip) === "past").length;

    return {
      total: myTrips.length,
      upcoming,
      ongoing,
      past
    };
  }, [myTrips]);

  const { visibleActiveTrips, visiblePastTrips } = useMemo(() => {
    const query = normalizeText(searchQuery);

    let result = [...myTrips];

    if (query) {
      result = result.filter((trip) => matchesSearch(trip, query, countryNameMap));
    }

    let activeTrips = [];
    let pastTrips = [];

    if (statusFilter === "past") {
      pastTrips = result.filter((trip) => getTripPhase(trip) === "past");
    } else {
      activeTrips = result.filter((trip) => {
        const phase = getTripPhase(trip);

        if (phase === "past") return false;
        if (statusFilter === "all") return true;

        return phase === statusFilter;
      });

      pastTrips = result.filter((trip) => getTripPhase(trip) === "past");
    }

    return {
      visibleActiveTrips: sortTrips(activeTrips, sortBy, countryNameMap),
      visiblePastTrips: sortTrips(pastTrips, sortBy, countryNameMap)
    };
  }, [myTrips, searchQuery, statusFilter, sortBy, countryNameMap]);

  const totalVisibleTrips = visibleActiveTrips.length + visiblePastTrips.length;

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("start-asc");
  };

  const handleStatFilterClick = (filterValue) => {
    setStatusFilter(filterValue);
  };

  if (!isLoggedIn) {
    return (
      <main className="content">
        <section className="card my-trips-page">
          <div className="my-trips-hero">
            <div>
              <h1 className="my-trips-title">Moje výlety</h1>
              <p className="my-trips-subtitle">
                Pro zobrazení svých cest se prosím přihlaste.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="card my-trips-page">
        <div className="my-trips-hero">
          <div>
            <h1 className="my-trips-title">Moje výlety</h1>
          </div>

          <button className="btn-primary my-trips-create-button" onClick={onCreateTrip}>
            Nový výlet
          </button>
        </div>

        <div className="my-trips-stats">
          <button
            type="button"
            className={`my-trips-stat-card ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => handleStatFilterClick("all")}
          >
            <span className="my-trips-stat-label">
              <span className="stat-dot stat-all"></span>
              Aktivní celkem
            </span>
            <strong className="my-trips-stat-value">{stats.upcoming + stats.ongoing}</strong>
          </button>

          <button
            type="button"
            className={`my-trips-stat-card ${statusFilter === "upcoming" ? "active" : ""}`}
            onClick={() => handleStatFilterClick("upcoming")}
          >
            <span className="my-trips-stat-label">
              <span className="stat-dot stat-upcoming"></span>
              Nadcházející
            </span>
            <strong className="my-trips-stat-value">{stats.upcoming}</strong>
          </button>

          <button
            type="button"
            className={`my-trips-stat-card ${statusFilter === "ongoing" ? "active" : ""}`}
            onClick={() => handleStatFilterClick("ongoing")}
          >
            <span className="my-trips-stat-label">
              <span className="stat-dot stat-ongoing"></span>
              Probíhající
            </span>
            <strong className="my-trips-stat-value">{stats.ongoing}</strong>
          </button>

          <button
            type="button"
            className={`my-trips-stat-card ${statusFilter === "past" ? "active" : ""}`}
            onClick={() => handleStatFilterClick("past")}
          >
            <span className="my-trips-stat-label">
              <span className="stat-dot stat-past"></span>
              Proběhlé
            </span>
            <strong className="my-trips-stat-value">{stats.past}</strong>
          </button>
        </div>

        <div className="my-trips-toolbar">
          <div className="my-trips-search-wrap">
            <span className="my-trips-search-icon">🔎</span>
            <input
              className="my-trips-search-input"
              type="text"
              placeholder="Hledat podle názvu, země nebo kódu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="my-trips-controls">
            <div className="my-trips-control">
              <label htmlFor="trip-status-filter">Filtr</label>
              <select
                id="trip-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Všechny aktivní</option>
                <option value="upcoming">Jen nadcházející</option>
                <option value="ongoing">Jen probíhající</option>
                <option value="past">Jen proběhlé</option>
              </select>
            </div>

            <div className="my-trips-control">
              <label htmlFor="trip-sort">Řazení</label>
              <select
                id="trip-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="start-asc">Datum od nejbližšího</option>
                <option value="start-desc">Datum od nejvzdálenějšího</option>
                <option value="name-asc">Název A–Z</option>
                <option value="country-asc">Země A–Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="my-trips-divider"></div>

        {myTrips.length === 0 ? (
          <TripsEmptyState onCreateTrip={onCreateTrip} />
        ) : totalVisibleTrips === 0 ? (
          <section className="my-trips-section">
            <div className="my-trips-no-results">
              <div className="my-trips-no-results-icon"></div>
              <h3>Nebyly nalezeny žádné výlety</h3>
              <p>Zkuste upravit hledání nebo zvolený filtr.</p>
              <button className="my-trips-reset-button" onClick={resetFilters}>
                Resetovat filtry
              </button>
            </div>
          </section>
        ) : (
          <>
            {statusFilter !== "past" && (
              <section className="my-trips-section">
                <div className="my-trips-section-header">
                  <div>
                    <h2 className="my-trips-section-title">Aktivní výlety</h2>
                  </div>
                </div>

                {visibleActiveTrips.length > 0 ? (
                  <TripList
                    trips={visibleActiveTrips}
                    onEditTrip={onEditTrip}
                    onDeleteTrip={onDeleteTrip}
                    countryNameMap={countryNameMap}
                  />
                ) : (
                  <p className="my-trips-empty-message">
                    Pro tento filtr nejsou k dispozici žádné aktivní výlety.
                  </p>
                )}
              </section>
            )}

            {visiblePastTrips.length > 0 && (
              <section className="my-trips-section">
                <div className="my-trips-section-header">
                  <div>
                    <h2 className="my-trips-section-title">Proběhlé výlety</h2>
                  </div>
                </div>

                <TripList
                  trips={visiblePastTrips}
                  onEditTrip={onEditTrip}
                  onDeleteTrip={onDeleteTrip}
                  countryNameMap={countryNameMap}
                />
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default MyTrips;
