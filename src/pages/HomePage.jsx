import { useEffect, useMemo, useState } from "react";
import GuestHomePage from "./GuestHomePage";
import WorldTravelMap from "../components/home/WorldTravelMap";
import "../styles/homepage.css";

function formatDate(dateValue) {
  try {
    return new Date(dateValue).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTripPhase(trip) {
  const today = startOfToday();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start <= today && end >= today) return "ongoing";
  if (end < today) return "past";
  return "upcoming";
}

function getDaysToTrip(startDate) {
  const today = startOfToday();
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
}

function getUpcomingTripText(startDate) {
  const daysLeft = getDaysToTrip(startDate);

  if (daysLeft === 0) return "začíná dnes";
  if (daysLeft === 1) return "začíná zítra";
  if (daysLeft >= 2 && daysLeft <= 4) return `začíná za ${daysLeft} dny`;
  return `začíná za ${daysLeft} dní`;
}

function getCurrentOrNextTrip(trips) {
  if (!Array.isArray(trips) || trips.length === 0) {
    return null;
  }

  const ongoingTrips = trips
    .filter((trip) => getTripPhase(trip) === "ongoing")
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (ongoingTrips.length > 0) {
    return {
      type: "ongoing",
      trip: ongoingTrips[0]
    };
  }

  const upcomingTrips = trips
    .filter((trip) => getTripPhase(trip) === "upcoming")
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (upcomingTrips.length > 0) {
    return {
      type: "upcoming",
      trip: upcomingTrips[0]
    };
  }

  return null;
}

function getCountdownTarget(heroTripInfo) {
  if (!heroTripInfo?.trip) {
    return null;
  }

  const targetDate = new Date(
    heroTripInfo.type === "ongoing"
      ? heroTripInfo.trip.endDate
      : heroTripInfo.trip.startDate
  );

  if (heroTripInfo.type === "ongoing") {
    targetDate.setHours(23, 59, 59, 999);
  } else {
    targetDate.setHours(0, 0, 0, 0);
  }

  return targetDate;
}

function formatCountdown(targetDate, now) {
  if (!targetDate) return null;

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return "0 minut";

  const totalMinutes = Math.floor(diff / (1000 * 60));

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const formatDays = (d) => {
    if (d === 1) return "1 den";
    if (d >= 2 && d <= 4) return `${d} dny`;
    return `${d} dnů`;
  };

  const formatHours = (h) => {
    if (h === 1) return "1 hodina";
    if (h >= 2 && h <= 4) return `${h} hodiny`;
    return `${h} hodin`;
  };

  const formatMinutes = (m) => {
    if (m === 1) return "1 minuta";
    if (m >= 2 && m <= 4) return `${m} minuty`;
    return `${m} minut`;
  };

  if (days > 0) {
    return `${formatDays(days)} ${formatHours(hours)}`;
  }

  if (hours > 0) {
    return `${formatHours(hours)} ${formatMinutes(minutes)}`;
  }

  return formatMinutes(minutes);
}

function getCountdownCardContent(heroTripInfo, now) {
  if (!heroTripInfo) {
    return {
      label: "Odpočet",
      value: "—",
      text: "Zatím nemáte žádný výlet."
    };
  }

  const targetDate = getCountdownTarget(heroTripInfo);
  const countdown = formatCountdown(targetDate, now);

  if (heroTripInfo.type === "ongoing") {
    return {
      label: "Konec výletu",
      value: countdown,
      text: "Čas zbývající do konce aktuálního výletu."
    };
  }

  return {
    label: "Další výlet",
    value: countdown,
    text: "Čas zbývající do začátku nejbližšího výletu."
  };
}

function HomePage({ isLoggedIn, userName, myTrips = [], onCreateTrip }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const heroTripInfo = useMemo(() => getCurrentOrNextTrip(myTrips), [myTrips]);

  const countdownCard = useMemo(
    () => getCountdownCardContent(heroTripInfo, now),
    [heroTripInfo, now]
  );

  if (!isLoggedIn) {
    return <GuestHomePage />;
  }

  return (
    <main className="content">
      <section className="card home-page">
        <div className="home-hero">
          <div className="home-hero-text">
            <h1 className="home-title">Ahoj, {userName}</h1>

            <p className="home-subtitle">
              {heroTripInfo ? (
                heroTripInfo.type === "ongoing" ? (
                  <>
                    Vaše cesta <strong>{heroTripInfo.trip.title}</strong>{" "}
                    právě probíhá.
                  </>
                ) : (
                  <>
                    Vaše další cesta <strong>{heroTripInfo.trip.title}</strong>{" "}
                    {getUpcomingTripText(heroTripInfo.trip.startDate)}.
                  </>
                )
              ) : (
                "Zatím nemáte naplánovaný žádný výlet. Vytvořte si první cestu a začněte si budovat vlastní cestovní přehled."
              )}
            </p>

            {heroTripInfo && (
              <p className="home-next-date">
                {heroTripInfo.type === "ongoing" ? (
                  <>
                    Termín: {formatDate(heroTripInfo.trip.startDate)} –{" "}
                    {formatDate(heroTripInfo.trip.endDate)}
                  </>
                ) : (
                  <>
                    Nejbližší termín: {formatDate(heroTripInfo.trip.startDate)}
                  </>
                )}
              </p>
            )}

            <div className="home-actions">
              <button className="btn-primary" onClick={onCreateTrip}>
                Naplánovat výlet
              </button>
            </div>
          </div>

          <aside className="home-side-card">
            <span className="home-side-card-label">{countdownCard.label}</span>
            <strong className="home-side-card-value home-side-card-value-countdown">
              {countdownCard.value}
            </strong>
            <p className="home-side-card-text">{countdownCard.text}</p>
          </aside>
        </div>

        <WorldTravelMap trips={myTrips} lazyLoad={true} />
      </section>
    </main>
  );
}

export default HomePage;