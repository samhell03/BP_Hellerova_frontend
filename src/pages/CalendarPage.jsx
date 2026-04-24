import { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiMapPin
} from "react-icons/fi";
import "../styles/calendar.css";
import { getCountries } from "../api/countries";
import {
  buildCountryNameMap,
  getCountryDisplayName
} from "../utils/countryNames";

const TRIP_COLORS = [
  "#4F7CFF",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#F97316",
  "#14B8A6"
];

function startOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isDateBetween(date, startDate, endDate) {
  const current = startOfDay(date).getTime();
  const start = startOfDay(startDate).getTime();
  const end = startOfDay(endDate).getTime();

  return current >= start && current <= end;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("cs-CZ", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatShortDate(dateValue) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  }).format(new Date(dateValue));
}

function getMonthGrid(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const jsDay = firstDayOfMonth.getDay();
  const mondayFirstOffset = (jsDay + 6) % 7;

  const gridStart = new Date(year, month, 1 - mondayFirstOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function getTripPhase(trip) {
  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start <= today && end >= today) return "ongoing";
  if (end < today) return "past";
  return "upcoming";
}

function getLegendLabel(phase) {
  if (phase === "ongoing") return "Probíhá";
  if (phase === "past") return "Proběhl";
  return "Plánováno";
}

function assignTripColors(trips) {
  return trips.map((trip, index) => ({
    ...trip,
    calendarColor: TRIP_COLORS[index % TRIP_COLORS.length]
  }));
}

function CalendarPage({ isLoggedIn, myTrips = [] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

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

  const monthDays = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);

  const coloredTrips = useMemo(() => assignTripColors(myTrips), [myTrips]);

  const monthTrips = useMemo(() => {
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );
    monthEnd.setHours(23, 59, 59, 999);

    return coloredTrips.filter((trip) => {
      const tripStart = startOfDay(trip.startDate);
      const tripEnd = startOfDay(trip.endDate);

      return tripEnd >= monthStart && tripStart <= monthEnd;
    });
  }, [coloredTrips, currentMonth]);

  const dayItems = useMemo(() => {
    return monthDays.map((day) => {
      const tripsForDay = monthTrips.filter((trip) =>
        isDateBetween(day, trip.startDate, trip.endDate)
      );

      return {
        date: day,
        trips: tripsForDay
      };
    });
  }, [monthDays, monthTrips]);

  const upcomingTrips = useMemo(() => {
    return [...coloredTrips]
      .filter((trip) => getTripPhase(trip) !== "past")
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 4);
  }, [coloredTrips]);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  if (!isLoggedIn) {
    return (
      <main className="content">
        <section className="card calendar-page">
          <div className="calendar-empty-state">
            <h1 className="calendar-title">Kalendář výletů</h1>
            <p className="calendar-muted">Pro zobrazení kalendáře se prosím přihlas.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="card calendar-page">
        <div className="calendar-hero">
          <div>
            <p className="calendar-eyebrow"></p>
            <h1 className="calendar-title">Kalendář výletů</h1>
            <p className="calendar-subtitle"></p>
          </div>

          <div className="calendar-summary-card">
            <span className="calendar-summary-label">Výletů celkem</span>
            <strong className="calendar-summary-value">{myTrips.length}</strong>
            <p className="calendar-summary-text"></p>
          </div>
        </div>

        <div className="calendar-layout">
          <div className="calendar-main">
            <div className="calendar-toolbar">
              <div className="calendar-month-nav">
                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={goToPreviousMonth}
                  aria-label="Předchozí měsíc"
                >
                  <FiChevronLeft />
                </button>

                <h2 className="calendar-month-title">{formatMonthYear(currentMonth)}</h2>

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={goToNextMonth}
                  aria-label="Další měsíc"
                >
                  <FiChevronRight />
                </button>
              </div>

              <button type="button" className="calendar-today-button" onClick={goToToday}>
                Dnes
              </button>
            </div>

            <div className="calendar-weekdays">
              <span>Po</span>
              <span>Út</span>
              <span>St</span>
              <span>Čt</span>
              <span>Pá</span>
              <span>So</span>
              <span>Ne</span>
            </div>

            <div className="calendar-grid">
              {dayItems.map(({ date, trips }) => {
                const isCurrentMonth =
                  date.getMonth() === currentMonth.getMonth() &&
                  date.getFullYear() === currentMonth.getFullYear();

                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={date.toISOString()}
                    className={`calendar-day ${isCurrentMonth ? "" : "calendar-day-outside"} ${
                      isToday ? "calendar-day-today" : ""
                    }`}
                  >
                    <div className="calendar-day-header">
                      <span className="calendar-day-number">{date.getDate()}</span>
                    </div>

                    <div className="calendar-day-events">
                      {trips.slice(0, 3).map((trip) => (
                        <div
                          key={`${trip._id}-${date.toISOString()}`}
                          className="calendar-event-pill"
                          style={{
                            backgroundColor: trip.calendarColor
                          }}
                          title={`${trip.title} • ${formatShortDate(trip.startDate)} – ${formatShortDate(trip.endDate)}`}
                        >
                          {trip.title}
                        </div>
                      ))}

                      {trips.length > 3 && (
                        <div className="calendar-more-events">
                          +{trips.length - 3} další
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="calendar-sidebar">
            <div className="calendar-side-panel">
              <div className="calendar-side-header">
                <FiCalendar />
                <h3>Legenda výletů</h3>
              </div>

              {coloredTrips.length === 0 ? (
                <p className="calendar-muted">
                  Zatím nemáš žádné výlety, které by šly do kalendáře zobrazit.
                </p>
              ) : (
                <div className="calendar-legend-list">
                  {coloredTrips.map((trip) => {
                    const displayCountry = getCountryDisplayName(
                      trip.countryCode,
                      trip.country,
                      countryNameMap
                    );

                    return (
                      <div key={trip._id} className="calendar-legend-item">
                        <span
                          className="calendar-legend-color"
                          style={{ backgroundColor: trip.calendarColor }}
                        ></span>

                        <div className="calendar-legend-text">
                          <strong>{trip.title}</strong>
                          <span>
                            {displayCountry} • {formatShortDate(trip.startDate)} –{" "}
                            {formatShortDate(trip.endDate)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="calendar-side-panel">
              <div className="calendar-side-header">
                <FiMapPin />
                <h3>Nejbližší cesty</h3>
              </div>

              {upcomingTrips.length === 0 ? (
                <p className="calendar-muted">Momentálně nemáš žádný nadcházející výlet.</p>
              ) : (
                <div className="calendar-upcoming-list">
                  {upcomingTrips.map((trip) => {
                    const displayCountry = getCountryDisplayName(
                      trip.countryCode,
                      trip.country,
                      countryNameMap
                    );

                    return (
                      <div key={trip._id} className="calendar-upcoming-item">
                        <div className="calendar-upcoming-top">
                          <strong>{trip.title}</strong>
                          <span
                            className={`calendar-phase-badge calendar-phase-${getTripPhase(trip)}`}
                          >
                            {getLegendLabel(getTripPhase(trip))}
                          </span>
                        </div>
                        <p>
                          {displayCountry} • {formatShortDate(trip.startDate)} –{" "}
                          {formatShortDate(trip.endDate)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default CalendarPage;
