import "../../styles/weather.css";

function getWeatherIcon(code) {
  if ([0].includes(code)) return "☀️";
  if ([1, 2].includes(code)) return "⛅";
  if ([3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function formatDayName(day) {
  return new Date(day).toLocaleDateString("cs-CZ", {
    weekday: "short"
  });
}

function normalizeWeatherTime(value) {
  if (!value) return "";
  return value.includes("T") ? value : value.replace(" ", "T");
}

function formatHourLabel(time) {
  const normalized = normalizeWeatherTime(time);
  if (!normalized) return "—";

  const hour = normalized.slice(11, 13);
  const minute = normalized.slice(14, 16);

  if (!hour || !minute) return "—";
  return `${hour}:${minute}`;
}

function getDestinationNowParts(weather) {
  const timezone = weather?.timezone;

  if (timezone) {
    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const parts = formatter.formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type)?.value || "00";

    return {
      key: `${get("year")}-${get("month")}-${get("day")}T${get("hour")}`,
      label: `${get("hour")}:${get("minute")}`
    };
  }

  const now = new Date();

  return {
    key: now.toISOString().slice(0, 13),
    label: now.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

function findStartIndex(hourlyTimes, weather) {
  if (!Array.isArray(hourlyTimes) || hourlyTimes.length === 0) return 0;

  const destinationNow = getDestinationNowParts(weather);

  const exactHourIndex = hourlyTimes.findIndex((time) => {
    const normalized = normalizeWeatherTime(time);
    return normalized.slice(0, 13) === destinationNow.key;
  });

  if (exactHourIndex !== -1) return exactHourIndex;

  return 0;
}

function buildHourlyItemsUntilMidnight({
  hourlyTimes,
  hourlyTemps,
  hourlyCodes,
  startIndex
}) {
  const items = [];

  for (let i = startIndex; i < hourlyTimes.length; i += 1) {
    const item = {
      time: hourlyTimes[i],
      temp: hourlyTemps[i],
      code: hourlyCodes[i]
    };

    items.push(item);

    if (formatHourLabel(item.time) === "00:00" && i !== startIndex) {
      break;
    }
  }

  return items;
}

function WeatherCard({ weather, location, onRemove }) {
  if (!weather) {
    return <p className="trip-detail-muted">Načítám počasí…</p>;
  }

  const hourlyTimes = weather?.hourly?.time || [];
  const hourlyTemps = weather?.hourly?.temperature_2m || [];
  const hourlyCodes = weather?.hourly?.weather_code || [];

  const dailyTimes = weather?.daily?.time || [];
  const dailyMinTemps = weather?.daily?.temperature_2m_min || [];
  const dailyMaxTemps = weather?.daily?.temperature_2m_max || [];
  const dailyCodes = weather?.daily?.weather_code || [];

  const startIndex = findStartIndex(hourlyTimes, weather);

  const hourlyItems = buildHourlyItemsUntilMidnight({
    hourlyTimes,
    hourlyTemps,
    hourlyCodes,
    startIndex
  });

  const dailyItems = dailyTimes.slice(0, 7).map((day, i) => ({
    day,
    min: dailyMinTemps[i],
    max: dailyMaxTemps[i],
    code: dailyCodes[i]
  }));

  return (
    <div className="weather-widget">
      <div className="weather-widget__card">
        <div className="weather-widget__topline">
          <div className="weather-widget__title-wrap">
            <span className="weather-widget__title-icon">◔</span>
            <h4 className="weather-widget__title">Předpověď na 24 hodin</h4>
          </div>

          <div className="weather-widget__unit">°C</div>
        </div>

        <div className="weather-widget__divider" />

        <div className="weather-widget__location-row">
          <div className="weather-widget__location">{location}</div>
          <div className="weather-widget__timezone-note">místní čas destinace</div>
        </div>

        <div className="weather-widget__hours" role="list" aria-label="Hodinová předpověď">
          {hourlyItems.map((item, index) => (
            <div key={`${item.time}-${index}`} className="weather-widget__hour" role="listitem">
              <span className="weather-widget__hour-time">
                {index === 0 ? "Teď" : formatHourLabel(item.time)}
              </span>

              <div className="weather-widget__hour-icon">
                {getWeatherIcon(item.code)}
              </div>

              <strong className="weather-widget__hour-temp">
                {item.temp != null ? `${Math.round(item.temp)}°` : "—"}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {dailyItems.length > 0 && (
        <div className="weather-widget__card weather-widget__card--days">
          <div className="weather-widget__topline">
            <div className="weather-widget__title-wrap">
              <span className="weather-widget__title-icon">◔</span>
              <h4 className="weather-widget__title">Předpověď na další dny</h4>
            </div>

            <div className="weather-widget__unit">max</div>
          </div>

          <div className="weather-widget__divider" />

          <div className="weather-widget__days-strip" role="list" aria-label="Denní předpověď">
            {dailyItems.map((item, index) => (
              <div key={`${item.day}-${index}`} className="weather-widget__day-item" role="listitem">
                <span className="weather-widget__day-time">
                  {formatDayName(item.day)}
                </span>

                <div className="weather-widget__day-icon">
                  {getWeatherIcon(item.code)}
                </div>

                <strong className="weather-widget__day-temp">
                  {item.max != null ? `${Math.round(item.max)}°` : "—"}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRemove} className="weather-widget__remove" type="button">
        Odebrat balíček
      </button>
    </div>
  );
}

export default WeatherCard;