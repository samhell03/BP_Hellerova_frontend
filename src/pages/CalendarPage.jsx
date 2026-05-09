import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiMapPin,
  FiChevronDown
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

function getDateKey(date) {
  return startOfDay(date).toISOString();
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
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [countries, setCountries] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

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

  const countryNameMap = useMemo(
    () => buildCountryNameMap(countries),
    [countries]
  );

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
    setSelectedDayKey(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
    setSelectedDayKey(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayKey(getDateKey(today));
  };

  const openTripDetail = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  if (!isLoggedIn) {
    return (
      <main className="content">
        <section className="card calendar-page">
          <div className="calendar-empty-state">
            <h1 className="calendar-title">Kalendář výletů</h1>
            <p className="calendar-muted">
              Pro zobrazení kalendáře se prosím přihlas.
            </p>
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
            <h1 className="calendar-title">Kalendář výletů</h1>
          </div>

          <div className="calendar-summary-card">
            <span className="calendar-summary-label">Výletů celkem</span>
            <strong className="calendar-summary-value">{myTrips.length}</strong>
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

                <h2 className="calendar-month-title">
                  {formatMonthYear(currentMonth)}
                </h2>

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={goToNextMonth}
                  aria-label="Další měsíc"
                >
                  <FiChevronRight />
                </button>
              </div>

              <button
                type="button"
                className="calendar-today-button"
                onClick={goToToday}
              >
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
              {dayItems.map(({ date, trips }, index) => {
                const isCurrentMonth =
                  date.getMonth() === currentMonth.getMonth() &&
                  date.getFullYear() === currentMonth.getFullYear();

                const isToday = isSameDay(date, new Date());
                const dayKey = getDateKey(date);
                const hasTrips = trips.length > 0;
                const isSelected = selectedDayKey === dayKey;

                return (
                  <div
                    key={date.toISOString()}
                    className={`calendar-day calendar-day-col-${index % 7} ${isCurrentMonth ? "" : "calendar-day-outside"
                      } ${isToday ? "calendar-day-today" : ""} ${hasTrips ? "calendar-day-clickable" : ""
                      } ${isSelected ? "calendar-day-selected" : ""}`}
                    onClick={() => {
                      if (hasTrips) {
                        setSelectedDayKey(isSelected ? null : dayKey);
                      }
                    }}
                    role={hasTrips ? "button" : undefined}
                    tabIndex={hasTrips ? 0 : undefined}
                    onKeyDown={(event) => {
                      if (
                        hasTrips &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        setSelectedDayKey(isSelected ? null : dayKey);
                      }
                    }}
                  >
                    <div className="calendar-day-header">
                      <span className="calendar-day-number">
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="calendar-day-events">
                      {trips.slice(0, 3).map((trip) => (
                        <button
                          key={`${trip._id}-${date.toISOString()}`}
                          type="button"
                          className="calendar-event-pill"
                          style={{ backgroundColor: trip.calendarColor }}
                          title={`${trip.title} • ${formatShortDate(
                            trip.startDate
                          )} – ${formatShortDate(trip.endDate)}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openTripDetail(trip._id);
                          }}
                        >
                          {trip.title}
                        </button>
                      ))}

                      {trips.length > 3 && (
                        <div className="calendar-more-events">
                          +{trips.length - 3} další
                        </div>
                      )}

                      {isSelected && hasTrips && (
                        <div className="calendar-day-expanded">
                          {trips.map((trip) => {
                            const displayCountry = getCountryDisplayName(
                              trip.countryCode,
                              trip.country,
                              countryNameMap
                            );

                            return (
                              <button
                                key={`expanded-${trip._id}-${date.toISOString()}`}
                                type="button"
                                className="calendar-day-expanded-trip"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openTripDetail(trip._id);
                                }}
                              >
                                <span
                                  className="calendar-day-expanded-color"
                                  style={{
                                    backgroundColor: trip.calendarColor
                                  }}
                                />

                                <span>
                                  <strong>{trip.title}</strong>
                                  <small>
                                    {displayCountry} •{" "}
                                    {formatShortDate(trip.startDate)} –{" "}
                                    {formatShortDate(trip.endDate)}
                                  </small>
                                </span>
                              </button>
                            );
                          })}
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
              <button
                type="button"
                className="calendar-side-header calendar-side-header-button"
                onClick={() => setIsLegendOpen((prev) => !prev)}
              >
                <span className="calendar-side-title">
                  <FiCalendar />
                  <h3>Legenda výletů</h3>
                </span>

                <FiChevronDown
                  className={`calendar-accordion-icon ${isLegendOpen ? "open" : ""
                    }`}
                />
              </button>

              {coloredTrips.length === 0 ? (
                <p className="calendar-muted">
                  Zatím nemáš žádné výlety, které by šly do kalendáře zobrazit.
                </p>
              ) : (
                <div
                  className={`calendar-legend-list ${isLegendOpen ? "open" : ""
                    }`}
                >
                  {coloredTrips.map((trip) => {
                    const displayCountry = getCountryDisplayName(
                      trip.countryCode,
                      trip.country,
                      countryNameMap
                    );

                    return (
                      <button
                        key={trip._id}
                        type="button"
                        className="calendar-legend-item"
                        onClick={() => openTripDetail(trip._id)}
                      >
                        <span
                          className="calendar-legend-color"
                          style={{ backgroundColor: trip.calendarColor }}
                        />

                        <div className="calendar-legend-text">
                          <strong>{trip.title}</strong>
                          <span>
                            {displayCountry} •{" "}
                            {formatShortDate(trip.startDate)} –{" "}
                            {formatShortDate(trip.endDate)}
                          </span>
                        </div>
                      </button>
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
                <p className="calendar-muted">
                  Momentálně nemáš žádný nadcházející výlet.
                </p>
              ) : (
                <div className="calendar-upcoming-list">
                  {upcomingTrips.map((trip) => {
                    const displayCountry = getCountryDisplayName(
                      trip.countryCode,
                      trip.country,
                      countryNameMap
                    );

                    return (
                      <button
                        key={trip._id}
                        type="button"
                        className="calendar-upcoming-item"
                        onClick={() => openTripDetail(trip._id)}
                      >
                        <div className="calendar-upcoming-top">
                          <strong>{trip.title}</strong>
                          <span
                            className={`calendar-phase-badge calendar-phase-${getTripPhase(
                              trip
                            )}`}
                          >
                            {getLegendLabel(getTripPhase(trip))}
                          </span>
                        </div>

                        <p>
                          {displayCountry} •{" "}
                          {formatShortDate(trip.startDate)} –{" "}
                          {formatShortDate(trip.endDate)}
                        </p>
                      </button>
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