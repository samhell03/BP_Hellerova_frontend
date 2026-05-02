import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "../../styles/worldtravelmap.css";
import { getCountries } from "../../api/countries";
import { normalizeText } from "../../utils/countryNames";

const GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json";

const TOTAL_COUNTRIES = 195;

const WORLD_BOUNDS = [
  [-60, -180],
  [85, 180]
];

const COUNTRY_ALIASES = {
  CZ: ["Česko", "Cesko", "Česká republika", "Ceska republika", "Czech Republic", "Czechia"],
  ES: ["Španělsko", "Spanelsko", "Spain"],
  FR: ["Francie", "France"],
  IT: ["Itálie", "Italie", "Italy"],
  GR: ["Řecko", "Recko", "Greece"],
  EG: ["Egypt", "Egyptská arabská republika"],
  AF: ["Afghánistán", "Afghanistan"],
  LK: ["Srí Lanka", "Sri Lanka", "Srilanka"],
  DE: ["Německo", "Nemecko", "Germany"],
  AT: ["Rakousko", "Austria"],
  SK: ["Slovensko", "Slovakia"],
  PL: ["Polsko", "Poland"],
  HR: ["Chorvatsko", "Croatia"],
  SI: ["Slovinsko", "Slovenia"],
  PT: ["Portugalsko", "Portugal"],
  NL: ["Nizozemsko", "Nizozemí", "Nizozemi", "Netherlands", "Holandsko"],
  BE: ["Belgie", "Belgium"],
  CH: ["Švýcarsko", "Svycarsko", "Switzerland"],
  TR: ["Turecko", "Turkey", "Türkiye", "Turkiye"],
  GB: [
    "Velká Británie",
    "Velka Britanie",
    "Spojené království",
    "Spojene kralovstvi",
    "United Kingdom",
    "Great Britain",
    "Britain",
    "England"
  ],
  US: [
    "Spojené státy",
    "Spojene staty",
    "USA",
    "Amerika",
    "United States",
    "United States of America"
  ],
  KR: ["Jižní Korea", "Jizni Korea", "South Korea", "Korea, Republic of"],
  KP: ["Severní Korea", "Severni Korea", "North Korea", "Korea, Democratic People's Republic of"],
  RU: ["Rusko", "Russia", "Russian Federation"],
  MD: ["Moldavsko", "Moldova", "Moldova, Republic of"],
  BO: ["Bolívie", "Bolivie", "Bolivia", "Bolivia, Plurinational State of"],
  VE: ["Venezuela", "Venezuela, Bolivarian Republic of"],
  TZ: ["Tanzanie", "Tanzania", "Tanzania, United Republic of"],
  IR: ["Írán", "Iran", "Iran, Islamic Republic of"],
  SY: ["Sýrie", "Syrie", "Syria", "Syrian Arab Republic"],
  LA: ["Laos", "Lao People's Democratic Republic"],
  VN: ["Vietnam", "Viet Nam"],
  BN: ["Brunej", "Brunei", "Brunei Darussalam"]
};

function getFeatureName(feature) {
  return feature?.properties?.name || "";
}

function buildCountryMaps(countries = []) {
  const byCode = {};
  const namesByCode = {};

  countries.forEach((country) => {
    const code = (country?.code || "").toUpperCase();
    if (!code) return;

    const name = country?.name || "";
    const nameCs = country?.nameCs || name;

    byCode[code] = {
      code,
      name,
      nameCs
    };

    const rawNames = [name, nameCs, ...(COUNTRY_ALIASES[code] || [])].filter(Boolean);

    namesByCode[code] = Array.from(
      new Set(rawNames.map((item) => normalizeText(item)).filter(Boolean))
    );
  });

  return { byCode, namesByCode };
}

function getDisplayCountryNameFromCode(code, countryMaps) {
  const upper = (code || "").toUpperCase();
  if (upper && countryMaps.byCode[upper]?.nameCs) {
    return countryMaps.byCode[upper].nameCs;
  }
  return "";
}

function getTripCountryCode(trip) {
  return (trip?.countryCode || "").trim().toUpperCase();
}

function getTripPhaseSets(trips, countryMaps) {
  const today = new Date();

  const visitedNames = new Set();
  const plannedNames = new Set();

  trips.forEach((trip) => {
    const rawName = trip?.country || trip?.countryName || "";
    const code = getTripCountryCode(trip);
    const endDate = trip?.endDate ? new Date(trip.endDate) : null;

    const isVisited = endDate && endDate < today;
    const targetSet = isVisited ? visitedNames : plannedNames;

    if (code && countryMaps.namesByCode[code]) {
      countryMaps.namesByCode[code].forEach((name) => targetSet.add(name));
    }

    const normalizedRaw = normalizeText(rawName);
    if (normalizedRaw) {
      targetSet.add(normalizedRaw);
    }
  });

  return { visitedNames, plannedNames };
}

function isVisitedFeature(feature, visitedNames) {
  const featureName = normalizeText(getFeatureName(feature));
  return visitedNames.has(featureName);
}

function isPlannedFeature(feature, plannedNames) {
  const featureName = normalizeText(getFeatureName(feature));
  return plannedNames.has(featureName);
}

function getBaseFeatureStyle(feature, visitedNames, plannedNames) {
  const visited = isVisitedFeature(feature, visitedNames);
  const planned = isPlannedFeature(feature, plannedNames);

  let fillColor = "#e7edf5";

  if (visited) fillColor = "#1db954";
  else if (planned) fillColor = "#2b5cff";

  return {
    fillColor,
    weight: 0.8,
    opacity: 1,
    color: "#ffffff",
    fillOpacity: 0.9
  };
}

function getHoverFeatureStyle(feature, visitedNames, plannedNames) {
  const baseStyle = getBaseFeatureStyle(feature, visitedNames, plannedNames);

  return {
    ...baseStyle,
    weight: 1.2,
    color: "#94a3b8"
  };
}

function getTooltipDisplayName(feature, countryMaps) {
  const featureName = getFeatureName(feature);
  const normalizedFeatureName = normalizeText(featureName);

  const matchedCode = Object.entries(countryMaps.namesByCode).find(([, names]) =>
    names.includes(normalizedFeatureName)
  )?.[0];

  if (matchedCode) {
    return getDisplayCountryNameFromCode(matchedCode, countryMaps) || featureName;
  }

  return featureName || "Neznámá země";
}

const WorldTravelMap = memo(function WorldTravelMap({
  trips = [],
  lazyLoad = true
}) {
  const sectionRef = useRef(null);
  const geoJsonRef = useRef(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(!lazyLoad);

  const [worldGeoJson, setWorldGeoJson] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadMapError, setLoadMapError] = useState(false);

  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    if (!lazyLoad) return undefined;
    if (shouldLoadMap) return undefined;

    const element = sectionRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "250px 0px"
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [lazyLoad, shouldLoadMap]);

  useEffect(() => {
    if (!shouldLoadMap) return undefined;

    let active = true;

    const loadCountries = async () => {
      setLoadingCountries(true);

      try {
        const data = await getCountries();

        if (!active) return;
        setCountries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Nepodařilo se načíst země pro mapu:", error);
      } finally {
        if (active) {
          setLoadingCountries(false);
        }
      }
    };

    loadCountries();

    return () => {
      active = false;
    };
  }, [shouldLoadMap]);

  useEffect(() => {
    if (!shouldLoadMap) return undefined;

    let active = true;

    const loadWorldGeoJson = async () => {
      setLoadingMap(true);
      setLoadMapError(false);

      try {
        const response = await fetch(GEOJSON_URL);
        const data = await response.json();

        if (!active) return;
        setWorldGeoJson(data);
      } catch (error) {
        console.error("Nepodařilo se načíst GeoJSON mapu světa:", error);
        if (!active) return;
        setLoadMapError(true);
      } finally {
        if (active) {
          setLoadingMap(false);
        }
      }
    };

    loadWorldGeoJson();

    return () => {
      active = false;
    };
  }, [shouldLoadMap]);

  const countryMaps = useMemo(() => buildCountryMaps(countries), [countries]);

  const { visitedNames, plannedNames } = useMemo(
    () => getTripPhaseSets(trips, countryMaps),
    [trips, countryMaps]
  );

  const visitedCount = useMemo(() => {
    const today = new Date();

    return new Set(
      trips
        .filter((trip) => trip.endDate && new Date(trip.endDate) < today)
        .map((trip) => getTripCountryCode(trip) || normalizeText(trip.country || trip.countryName))
        .filter(Boolean)
    ).size;
  }, [trips]);

  const visitedPercent = Math.round((visitedCount / TOTAL_COUNTRIES) * 1000) / 10;

  const mapStyle = useCallback(
    (feature) => getBaseFeatureStyle(feature, visitedNames, plannedNames),
    [visitedNames, plannedNames]
  );

  const onEachCountry = useCallback(
    (feature, layer) => {
      const displayCountry = getTooltipDisplayName(feature, countryMaps);
      const visited = isVisitedFeature(feature, visitedNames);
      const planned = isPlannedFeature(feature, plannedNames);

      let label = displayCountry;
      if (visited) label += " • navštíveno";
      else if (planned) label += " • plánováno";

      layer.bindTooltip(label, {
        sticky: true,
        direction: "top"
      });

      layer.on({
        mouseover: (event) => {
          const targetLayer = event.target;

          targetLayer.setStyle(
            getHoverFeatureStyle(feature, visitedNames, plannedNames)
          );

          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            targetLayer.bringToFront();
          }
        },

        mouseout: (event) => {
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(event.target);
          }
        }
      });
    },
    [countryMaps, visitedNames, plannedNames]
  );

  const isReady = shouldLoadMap && !loadingMap && !loadingCountries && worldGeoJson;

  return (
    <section className="world-map-section" ref={sectionRef}>
      <div className="world-map-header">
        <div>
          <p className="world-map-eyebrow"></p>
          <h2 className="world-map-title">Mapa procestovaných zemí</h2>
        </div>

        <div className="world-map-stats">
          <div className="world-map-stat-card">
            <span className="world-map-stat-label">Navštíveno zemí</span>
            <strong className="world-map-stat-value">{visitedCount}</strong>
          </div>

          <div className="world-map-stat-card">
            <span className="world-map-stat-label">Procestováno světa</span>
            <strong className="world-map-stat-value">{visitedPercent} %</strong>
          </div>
        </div>
      </div>

      <div className="world-map-wrapper">
        {!shouldLoadMap ? (
          <div className="world-map-placeholder">
            Mapa se načte až při zobrazení této sekce.
          </div>
        ) : !isReady ? (
          <div className="world-map-placeholder">Načítání mapy světa…</div>
        ) : loadMapError ? (
          <div className="world-map-placeholder">
            Mapu se nepodařilo načíst. Zkuste prosím obnovit stránku.
          </div>
        ) : (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={2}
            maxZoom={6}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={false}
            dragging={true}
            className="world-map-leaflet"
            attributionControl={false}
            maxBounds={WORLD_BOUNDS}
            maxBoundsViscosity={1.0}
            worldCopyJump={false}
            preferCanvas={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              noWrap={true}
              bounds={WORLD_BOUNDS}
            />

            <GeoJSON
              ref={geoJsonRef}
              key={`world-map-${visitedCount}-${visitedPercent}`}
              data={worldGeoJson}
              style={mapStyle}
              onEachFeature={onEachCountry}
            />
          </MapContainer>
        )}

        <div className="world-map-footer">
          <div className="world-map-legend">
            <span className="legend-item">
              <span className="legend-dot visited"></span>
              Navštívené státy
            </span>

            <span className="legend-item">
              <span className="legend-dot planned"></span>
              Plánované / probíhající
            </span>

            <span className="legend-item">
              <span className="legend-dot default"></span>
              Ostatní státy
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default WorldTravelMap;