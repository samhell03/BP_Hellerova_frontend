import { useMemo } from "react";
import "../styles/statistics.css";

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE"
]);

const MONTH_LABELS = [
  "Led", "Úno", "Bře", "Dub", "Kvě", "Čvn",
  "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"
];

const regionNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["cs-CZ"], { type: "region" })
    : null;

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getTripPhase(trip) {
  const today = startOfToday();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "unknown";
  }

  if (end < today) return "past";
  if (start > today) return "upcoming";
  return "ongoing";
}

function getTripLengthDays(trip) {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffMs = end - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function getSeasonLabel(dateValue) {
  const date = new Date(dateValue);
  const month = date.getMonth() + 1;

  if ([12, 1, 2].includes(month)) return "Zima";
  if ([3, 4, 5].includes(month)) return "Jaro";
  if ([6, 7, 8].includes(month)) return "Léto";
  return "Podzim";
}

function getCountryKey(trip) {
  const code = (trip.countryCode || "").trim().toUpperCase();
  if (code) return code;

  return (trip.country || "Neznámý stát").trim().toLowerCase();
}

function getCountryDisplayLabel(trip) {
  const code = (trip.countryCode || "").trim().toUpperCase();

  if (code && regionNames) {
    const localized = regionNames.of(code);
    if (localized) return localized;
  }

  return trip.country || "Neznámý stát";
}

function formatDecimal(value) {
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}

function StatCard({ label, value, hint }) {
  return (
    <article className="statistics-stat-card">
      <span className="statistics-stat-label">{label}</span>
      <strong className="statistics-stat-value">{value}</strong>
      {hint ? <span className="statistics-stat-hint">{hint}</span> : null}
    </article>
  );
}

function RingCard({ title, value, subtext, percent, children }) {
  return (
    <article className="statistics-panel statistics-ring-card">
      <div className="statistics-panel-head">
        <div>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="statistics-ring-card-body">
        <div
          className="statistics-ring"
          style={{
            background: `conic-gradient(#2f66e8 0% ${percent}%, #e8eefb ${percent}% 100%)`
          }}
        >
          <div className="statistics-ring-inner">
            <strong>{value}</strong>
            <span>{subtext}</span>
          </div>
        </div>

        <div className="statistics-ring-side">{children}</div>
      </div>
    </article>
  );
}

function BarList({ title, eyebrow, items, emptyText }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <article className="statistics-panel">
      <div className="statistics-panel-head">
        <div>
          {eyebrow ? <p className="statistics-eyebrow">{eyebrow}</p> : null}
          <h3>{title}</h3>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="statistics-muted">{emptyText}</p>
      ) : (
        <div className="statistics-bar-list">
          {items.map((item) => {
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

            return (
              <div className="statistics-bar-row" key={item.label}>
                <div className="statistics-bar-top">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="statistics-bar-track">
                  <div
                    className="statistics-bar-fill"
                    style={{ width: `${Math.max(width, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function StatisticsPage({ isLoggedIn, myTrips }) {
  const stats = useMemo(() => {
    const trips = Array.isArray(myTrips) ? myTrips : [];
    const today = startOfToday();

    const totalTrips = trips.length;

    const phaseCounts = {
      past: 0,
      ongoing: 0,
      upcoming: 0
    };

    const countryCounts = new Map();
    const countryLabels = new Map();
    const uniqueAllCountries = new Set();
    const visitedCountries = new Set();
    const euVisitedCountries = new Set();
    const seasonCounts = new Map();
    const monthCounts = Array.from({ length: 12 }, (_, index) => ({
      label: MONTH_LABELS[index],
      value: 0
    }));
    const yearCounts = new Map();

    let totalTripDays = 0;
    let longestTripDays = 0;
    let longestTripName = "—";

    trips.forEach((trip) => {
      const phase = getTripPhase(trip);

      if (phaseCounts[phase] != null) {
        phaseCounts[phase] += 1;
      }

      const countryCode = (trip.countryCode || "").trim().toUpperCase();
      const countryKey = getCountryKey(trip);
      const countryLabel = getCountryDisplayLabel(trip);

      if (countryKey) {
        uniqueAllCountries.add(countryKey);
      }

      if (phase === "past" || phase === "ongoing") {
        visitedCountries.add(countryKey);

        if (countryCode && EU_COUNTRY_CODES.has(countryCode)) {
          euVisitedCountries.add(countryCode);
        }
      }

      countryCounts.set(countryKey, (countryCounts.get(countryKey) || 0) + 1);

      if (!countryLabels.has(countryKey)) {
        countryLabels.set(countryKey, countryLabel);
      }

      const season = getSeasonLabel(trip.startDate);
      seasonCounts.set(season, (seasonCounts.get(season) || 0) + 1);

      const startDate = new Date(trip.startDate);
      if (!Number.isNaN(startDate.getTime())) {
        const monthIndex = startDate.getMonth();
        monthCounts[monthIndex].value += 1;

        const year = String(startDate.getFullYear());
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      }

      const tripDays = getTripLengthDays(trip);
      totalTripDays += tripDays;

      if (tripDays > longestTripDays) {
        longestTripDays = tripDays;
        longestTripName = trip.title || countryLabel;
      }
    });

    const uniqueCountriesCount = uniqueAllCountries.size;
    const visitedCountriesCount = visitedCountries.size;
    const euVisitedCount = euVisitedCountries.size;

    const averageTripLength = totalTrips > 0 ? totalTripDays / totalTrips : 0;

    const topCountries = [...countryCounts.entries()]
      .map(([key, value]) => ({
        label: countryLabels.get(key) || key,
        value
      }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "cs"))
      .slice(0, 6);

    const seasons = ["Jaro", "Léto", "Podzim", "Zima"].map((label) => ({
      label,
      value: seasonCounts.get(label) || 0
    }));

    const years = [...yearCounts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => Number(a.label) - Number(b.label));

    const euPercent = visitedCountriesCount
      ? Math.round((euVisitedCount / visitedCountriesCount) * 100)
      : 0;

    const completedPercent = totalTrips
      ? Math.round((phaseCounts.past / totalTrips) * 100)
      : 0;

    const favouriteCountry = topCountries[0]?.label || "—";

    const nextTrip =
      [...trips]
        .filter((trip) => new Date(trip.startDate) >= today)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;

    return {
      totalTrips,
      uniqueCountriesCount,
      visitedCountriesCount,
      euVisitedCount,
      euPercent,
      averageTripLength,
      totalTripDays,
      longestTripDays,
      longestTripName,
      favouriteCountry,
      topCountries,
      seasons,
      years,
      monthCounts,
      phaseCounts,
      completedPercent,
      nextTrip
    };
  }, [myTrips]);

  if (!isLoggedIn) {
    return null;
  }

  if (!myTrips || myTrips.length === 0) {
    return (
      <main className="content">
        <section className="statistics-page">
          <div className="statistics-hero">
            <div>
              <h1 className="statistics-title">Přehled cestování</h1>
              <p className="statistics-muted">
                Jakmile přidáte první výlet, uvidíte zde své cestovatelské statistiky
              </p>
            </div>
          </div>

          <div className="statistics-empty-card">
            <h2>Zatím není co počítat</h2>
            <p>Přidejte si první výlet a uvidíte zde své přehledy.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="statistics-page">
        <section className="statistics-hero">
          <div className="statistics-hero-text">
            <h1 className="statistics-title">Přehled cestování</h1>
          </div>

          <div className="statistics-hero-badge">
            <span>Celkem cest</span>
            <strong>{stats.totalTrips}</strong>
          </div>
        </section>

        <section className="statistics-stat-grid">
          <StatCard label="Celkový počet výletů" value={stats.totalTrips} />
          <StatCard label="Různých států" value={stats.uniqueCountriesCount} />
          <StatCard label="Navštívených států EU" value={stats.euVisitedCount} />
          <StatCard
            label="Průměrná délka výletu"
            value={`${Math.round(stats.averageTripLength)} dní`}
          />
        </section>

        <section className="statistics-two-column">
          <RingCard
            title="Cesty v Evropě"
            value={`${stats.euPercent}%`}
            subtext="z navštívených států"
            percent={stats.euPercent}
          >
            <div className="statistics-ring-info">
              <div className="statistics-mini-row">
                <span>Navštíveno v EU</span>
                <strong>{stats.euVisitedCount}</strong>
              </div>
              <div className="statistics-mini-row">
                <span>Navštívené státy celkem</span>
                <strong>{stats.visitedCountriesCount}</strong>
              </div>
            </div>
          </RingCard>

          <RingCard
            title="Dokončené výlety"
            value={`${stats.completedPercent}%`}
            subtext="ze všech cest"
            percent={stats.completedPercent}
          >
            <div className="statistics-ring-info">
              <div className="statistics-mini-row">
                <span>Proběhlé</span>
                <strong>{stats.phaseCounts.past}</strong>
              </div>
              <div className="statistics-mini-row">
                <span>Probíhající</span>
                <strong>{stats.phaseCounts.ongoing}</strong>
              </div>
              <div className="statistics-mini-row">
                <span>Plánované</span>
                <strong>{stats.phaseCounts.upcoming}</strong>
              </div>
            </div>
          </RingCard>
        </section>

        <section className="statistics-highlight-grid">
          <article className="statistics-panel statistics-highlight-card">
            <div className="statistics-panel-head">
              <div>
                <h3>Nejčastější destinace</h3>
              </div>
            </div>
            <strong className="statistics-highlight-value">
              {stats.favouriteCountry}
            </strong>
            <p className="statistics-muted">
              Stát, který se v tvých výletech objevuje nejčastěji.
            </p>
          </article>

          <article className="statistics-panel statistics-highlight-card">
            <div className="statistics-panel-head">
              <div>
                <h3>Nejdelší cesta</h3>
              </div>
            </div>
            <strong className="statistics-highlight-value">
              {stats.longestTripDays} dní
            </strong>
            <p className="statistics-muted">{stats.longestTripName}</p>
          </article>

          <article className="statistics-panel statistics-highlight-card">
            <div className="statistics-panel-head">
              <div>
                <h3>Následující výlet</h3>
              </div>
            </div>
            <strong className="statistics-highlight-value">
              {stats.nextTrip ? (stats.nextTrip.title || stats.nextTrip.country) : "—"}
            </strong>
            <p className="statistics-muted">
              {stats.nextTrip
                ? `${new Date(stats.nextTrip.startDate).toLocaleDateString("cs-CZ")} – ${new Date(stats.nextTrip.endDate).toLocaleDateString("cs-CZ")}`
                : "Zatím nemáš žádný další naplánovaný výlet."}
            </p>
          </article>
        </section>

        <section className="statistics-main-grid">
          <BarList
            title="Nejnavštěvovanější státy"
            items={stats.topCountries}
            emptyText="Zatím nejsou dostupná data o státech."
          />

          <BarList
            title="Cestování podle ročních období"
            items={stats.seasons}
            emptyText="Zatím nejsou dostupná data o sezónách."
          />
        </section>

        <section className="statistics-main-grid">
          <BarList
            title="Cestování dle měsíců"
            items={stats.monthCounts}
            emptyText="Zatím nejsou dostupná měsíční data."
          />

          <BarList
            title="Cestování dle roků"
            items={stats.years}
            emptyText="Zatím nejsou dostupná roční data."
          />
        </section>
      </section>
    </main>
  );
}

export default StatisticsPage;