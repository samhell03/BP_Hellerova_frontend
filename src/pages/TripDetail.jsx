import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import html2pdf from "html2pdf.js";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckSquare,
  FiEdit2,
  FiFileText,
  FiGlobe,
  FiTrash2
} from "react-icons/fi";

import "leaflet/dist/leaflet.css";
import "../styles/tripdetail.css";
import WeatherCard from "../components/trip-detail/WeatherCard";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { formatDate, getTripStatusText } from "../utils/date";
import CurrencyConverter from "../components/trip-detail/CurrencyConverter";
import WeatherAlertsCard from "../components/trip-detail/WeatherAlertsCard";
import { getCountries } from "../api/countries";

import {
  deletePackage,
  generatePackageAlerts,
  getPackageWeather,
  getTripPackages,
  importTemplatePackage,
  updatePackage
} from "../api/packages";

import {
  createNote,
  deleteNote,
  getNotesByTrip,
  toggleNoteChecklistItem
} from "../api/notes";

import { showError, showSuccess } from "../utils/toast";

import {
  buildCountryNameMap,
  getCountryDisplayName
} from "../utils/countryNames";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

function getTripLength(startDate, endDate) {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end < start) return null;

  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function getTripLengthLabel(days) {
  if (!days) return "—";
  if (days === 1) return "1 den";
  if (days >= 2 && days <= 4) return `${days} dny`;
  return `${days} dní`;
}

function getStatusTone(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "neutral";
  }

  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "active";
}

function getTripSeason(startDate) {
  if (!startDate) return "Neurčeno";

  const month = new Date(startDate).getMonth() + 1;

  if ([12, 1, 2].includes(month)) return "Zima";
  if ([3, 4, 5].includes(month)) return "Jaro";
  if ([6, 7, 8].includes(month)) return "Léto";
  return "Podzim";
}

function getCategoryLabel(category) {
  switch (category) {
    case "vacation":
      return "Dovolená";
    case "mountains":
      return "Hory";
    case "camping":
      return "Stanování";
    case "city":
      return "Město";
    case "roadtrip":
      return "Roadtrip";
    case "general":
      return "Obecný";
    default:
      return category || "";
  }
}

function getNoteLabelColorClass(labelColor) {
  switch (labelColor) {
    case "blue":
      return "note-label-blue";
    case "green":
      return "note-label-green";
    case "yellow":
      return "note-label-yellow";
    case "red":
      return "note-label-red";
    case "purple":
      return "note-label-purple";
    default:
      return "note-label-default";
  }
}

function getReferenceDateForTrip(startDate) {
  if (!startDate) return new Date();

  const parsed = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return new Date();

  return parsed;
}

function getTimeZoneOffsetMinutes(timeZone, date) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });

    const parts = formatter.formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value || "00";

    const asUTC = Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")),
      Number(get("hour")),
      Number(get("minute")),
      Number(get("second"))
    );

    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return null;
  }
}

function formatUtcOffset(minutes) {
  if (typeof minutes !== "number") return "—";

  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  if (mins === 0) {
    return `UTC${sign}${hours}`;
  }

  return `UTC${sign}${hours}:${String(mins).padStart(2, "0")}`;
}

function formatDifferenceHuman(minutes) {
  if (typeof minutes !== "number") return "—";
  if (minutes === 0) return "stejný čas jako v ČR";

  const isAhead = minutes > 0;
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  const hourText = hours > 0 ? `${hours} h` : "";
  const minuteText = mins > 0 ? `${mins} min` : "";
  const value = [hourText, minuteText].filter(Boolean).join(" ");

  return `${value} ${isAhead ? "více než ČR" : "méně než ČR"}`;
}

function getTripTimeZoneInfo(weather, startDate) {
  if (!weather) return null;

  const referenceDate = getReferenceDateForTrip(startDate);
  const pragueOffsetMinutes = getTimeZoneOffsetMinutes(
    "Europe/Prague",
    referenceDate
  );

  let destinationOffsetMinutes = null;
  let destinationZoneName = null;

  if (weather?.timezone) {
    destinationZoneName = weather.timezone;
    destinationOffsetMinutes = getTimeZoneOffsetMinutes(
      weather.timezone,
      referenceDate
    );
  }

  if (
    destinationOffsetMinutes == null &&
    typeof weather?.utc_offset_seconds === "number"
  ) {
    destinationOffsetMinutes = Math.round(weather.utc_offset_seconds / 60);
  }

  if (destinationOffsetMinutes == null) return null;

  const diffMinutes =
    typeof pragueOffsetMinutes === "number"
      ? destinationOffsetMinutes - pragueOffsetMinutes
      : null;

  return {
    zoneName: destinationZoneName,
    utcLabel: formatUtcOffset(destinationOffsetMinutes),
    diffLabel:
      diffMinutes == null
        ? "časový rozdíl se nepodařilo spočítat"
        : formatDifferenceHuman(diffMinutes)
  };
}

function getTimeZoneCardData(weatherPackage, weatherData, tripStartDate) {
  if (!weatherPackage) {
    return {
      value: "—",
      subvalue: "přidej balíček Počasí"
    };
  }

  if (!weatherData) {
    return {
      value: "Načítám…",
      subvalue: "zjišťuji časové pásmo"
    };
  }

  const info = getTripTimeZoneInfo(weatherData, tripStartDate);

  if (!info) {
    return {
      value: "Neznámé",
      subvalue: "časové pásmo se nepodařilo zjistit"
    };
  }

  return {
    value: info.utcLabel,
    subvalue: info.diffLabel
  };
}

function getFlagUrl(countryCode) {
  if (!countryCode) return "";
  return `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;
}

function MissingPackageCard({ title, text, onImport }) {
  return (
    <div className="trip-detail-missing-package">
      <h4>{title}</h4>
      <p>{text}</p>
      <button type="button" className="btn-primary" onClick={onImport}>
        Importovat balíček
      </button>
    </div>
  );
}

function TripDetail({
  isLoggedIn,
  myTrips,
  onEditTrip,
  onDeleteTrip,
  fetchTripById
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const tripFromList = useMemo(
    () => (myTrips || []).find((tripItem) => tripItem._id === id),
    [myTrips, id]
  );

  const [trip, setTrip] = useState(tripFromList || null);
  const [tripLoading, setTripLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [packages, setPackages] = useState([]);
  const [weatherByPackage, setWeatherByPackage] = useState({});
  const [newItem, setNewItem] = useState("");

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteLabelColor, setNewNoteLabelColor] = useState("default");
  const [newNotePinned, setNewNotePinned] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto"
    });
  }, [id]);

  useEffect(() => {
    setTrip(tripFromList || null);
  }, [tripFromList]);

  useEffect(() => {
    if (!isLoggedIn || tripFromList) return;

    let active = true;

    const loadTrip = async () => {
      setTripLoading(true);

      try {
        const loadedTrip = await fetchTripById(id);

        if (active) {
          setTrip(loadedTrip);
        }
      } catch (err) {
        console.error("Chyba při načítání výletu:", err);
        showError(err.message || "Nepodařilo se načíst výlet.");
      } finally {
        if (active) {
          setTripLoading(false);
        }
      }
    };

    loadTrip();

    return () => {
      active = false;
    };
  }, [id, isLoggedIn, tripFromList, fetchTripById]);

  useEffect(() => {
    let active = true;

    const loadCountries = async () => {
      setCountriesLoading(true);

      try {
        const data = await getCountries();

        if (active) {
          setCountries(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Chyba při načítání zemí:", err);
      } finally {
        if (active) {
          setCountriesLoading(false);
        }
      }
    };

    loadCountries();

    return () => {
      active = false;
    };
  }, []);

  const loadPackages = async (tripId) => {
    if (!tripId) return;

    try {
      const data = await getTripPackages(tripId);
      const normalizedPackages = Array.isArray(data) ? data : [];
      setPackages(normalizedPackages);

      const weatherPackages = normalizedPackages.filter(
        (pack) => pack.type === "weather"
      );

      for (const pack of weatherPackages) {
        try {
          const weather = await getPackageWeather(pack._id);

          setWeatherByPackage((prev) => ({
            ...prev,
            [pack._id]: weather
          }));
        } catch (err) {
          console.error("Chyba při načítání počasí:", err);
        }
      }

      const notificationPackages = normalizedPackages.filter(
        (pack) => pack.type === "notifications"
      );

      for (const pack of notificationPackages) {
        try {
          await generatePackageAlerts(pack._id);
        } catch (err) {
          console.error("Chyba při generování notifikací:", err);
        }
      }

      if (notificationPackages.length > 0) {
        const refreshed = await getTripPackages(tripId);
        setPackages(Array.isArray(refreshed) ? refreshed : []);
      }
    } catch (err) {
      console.error("Chyba při načítání balíčků:", err);
    }
  };

  const loadNotes = async (tripId) => {
    if (!tripId) return;

    try {
      setNotesLoading(true);
      const data = await getNotesByTrip(tripId);
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Chyba při načítání poznámek:", err);
      showError(err.message || "Nepodařilo se načíst poznámky.");
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (!trip?._id) return;

    setWeatherByPackage({});
    loadPackages(trip._id);
    loadNotes(trip._id);
  }, [trip?._id, trip?.countryCode, trip?.city, trip?.cityLat, trip?.cityLng]);

  const countryNameMap = useMemo(() => buildCountryNameMap(countries), [countries]);

  if (!isLoggedIn) {
    return (
      <main className="content">
        <div className="card trip-detail-empty-card">
          <h2>Zamčeno 🔒</h2>
          <p className="trip-detail-muted">Přihlas se v menu vlevo.</p>
        </div>
      </main>
    );
  }

  if (tripLoading) {
    return (
      <main className="content">
        <div className="card trip-detail-empty-card">
          <h2>Načítám výlet…</h2>
          <p className="trip-detail-muted">
            Chvilku strpení, připravuji detail výletu.
          </p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="content">
        <div className="card trip-detail-empty-card">
          <h2>Výlet nenalezen</h2>
          <p className="trip-detail-muted">
            Výlet se nepodařilo načíst nebo už neexistuje.
          </p>
          <button className="btn-primary" onClick={() => navigate("/trips")}>
            Zpět na Moje výlety
          </button>
        </div>
      </main>
    );
  }

  const countryMeta = countries.find(
    (country) =>
      (country.code || "").toUpperCase() ===
      (trip.countryCode || "").toUpperCase()
  );

  const displayCountry = getCountryDisplayName(
    trip.countryCode,
    trip.country,
    countryNameMap
  );

  const displayLocation = trip.city
    ? `${trip.city}, ${displayCountry}`
    : displayCountry;

  const lat = trip.cityLat ?? countryMeta?.lat ?? null;
  const lng = trip.cityLng ?? countryMeta?.lng ?? null;

  const tripLength = getTripLength(trip.startDate, trip.endDate);
  const statusTone = getStatusTone(trip.startDate, trip.endDate);
  const statusText = getTripStatusText(trip.startDate, trip.endDate);
  const season = getTripSeason(trip.startDate);
  const flagUrl = getFlagUrl(trip.countryCode);

  const packingPackage = packages.find((item) => item.type === "packing");
  const weatherPackage = packages.find((item) => item.type === "weather");
  const notificationsPackage = packages.find(
    (item) => item.type === "notifications"
  );

  const weatherData = weatherPackage ? weatherByPackage[weatherPackage._id] : null;
  const timeZoneCard = getTimeZoneCardData(
    weatherPackage,
    weatherData,
    trip.startDate
  );

  const totalItems = packingPackage?.packingItems?.length || 0;
  const checkedItems = (packingPackage?.packingItems || []).filter(
    (i) => i.checked
  ).length;
  const progress = totalItems ? Math.round((checkedItems / totalItems) * 100) : 0;

  const pinnedNotes = notes.filter((note) => note.isPinned);
  const regularNotes = notes.filter((note) => !note.isPinned);

  const handleDelete = () => {
    onDeleteTrip(trip._id);
    navigate("/trips");
  };

  const handleImportPackage = async (templateKey, templateTitle) => {
    if (!trip?._id) return;

    try {
      const createdPackage = await importTemplatePackage(templateKey, trip._id);

      if (templateKey === "notifications") {
        await generatePackageAlerts(createdPackage._id);
      }

      await loadPackages(trip._id);
      showSuccess(`Balíček ${templateTitle} byl přidán.`);
    } catch (err) {
      showError(
        err.message || `Nepodařilo se importovat balíček ${templateTitle}.`
      );
    }
  };

  const handleTogglePackingItem = async (packageId, itemId) => {
    const target = packages.find((p) => p._id === packageId);
    if (!target) return;

    const nextItems = target.packingItems.map((item) =>
      item._id === itemId ? { ...item, checked: !item.checked } : item
    );

    try {
      const updated = await updatePackage(packageId, { packingItems: nextItems });
      setPackages((prev) =>
        prev.map((p) => (p._id === packageId ? updated : p))
      );
    } catch (err) {
      showError(err.message || "Nepodařilo se upravit checklist.");
    }
  };

  const handleAddPackingItemInline = async () => {
    if (!newItem.trim() || !packingPackage) return;

    const nextItems = [
      ...(packingPackage.packingItems || []),
      { text: newItem.trim(), checked: false }
    ];

    try {
      const updated = await updatePackage(packingPackage._id, {
        packingItems: nextItems
      });

      setPackages((prev) =>
        prev.map((p) => (p._id === packingPackage._id ? updated : p))
      );

      setNewItem("");
      showSuccess("Položka byla přidána.");
    } catch (err) {
      showError(err.message || "Nepodařilo se přidat položku.");
    }
  };

  const handleDeletePackingItem = async (itemId) => {
    if (!packingPackage) return;

    const nextItems = packingPackage.packingItems.filter(
      (item) => item._id !== itemId
    );

    try {
      const updated = await updatePackage(packingPackage._id, {
        packingItems: nextItems
      });

      setPackages((prev) =>
        prev.map((p) => (p._id === packingPackage._id ? updated : p))
      );

      showSuccess("Položka byla smazána.");
    } catch (err) {
      showError(err.message || "Nepodařilo se smazat položku.");
    }
  };

  const handleDeletePackageCard = async (packageId) => {
    const confirmed = window.confirm(
      "Opravdu chceš tento balíček odstranit z výletu?"
    );

    if (!confirmed) return;

    try {
      await deletePackage(packageId);
      setPackages((prev) => prev.filter((item) => item._id !== packageId));
      showSuccess("Balíček byl odstraněn.");
    } catch (err) {
      showError(err.message || "Nepodařilo se odstranit balíček.");
    }
  };

  const handleCreateNote = async () => {
    if (!trip?._id) return;

    if (!newNoteTitle.trim()) {
      showError("Nadpis poznámky je povinný.");
      return;
    }

    try {
      await createNote(trip._id, {
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        labelColor: newNoteLabelColor,
        isPinned: newNotePinned,
        checklistItems: []
      });

      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteLabelColor("default");
      setNewNotePinned(false);
      setIsEditorOpen(false);

      showSuccess("Poznámka byla vytvořena.");
      await loadNotes(trip._id);
    } catch (err) {
      showError(err.message || "Nepodařilo se vytvořit poznámku.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    const confirmed = window.confirm("Opravdu chceš tuto poznámku smazat?");
    if (!confirmed) return;

    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note._id !== noteId));
      showSuccess("Poznámka byla smazána.");
    } catch (err) {
      showError(err.message || "Nepodařilo se smazat poznámku.");
    }
  };

  const handleToggleNoteChecklistItem = async (noteId, itemId) => {
    try {
      const updated = await toggleNoteChecklistItem(noteId, itemId);

      setNotes((prev) =>
        prev.map((note) => (note._id === noteId ? updated : note))
      );
    } catch (err) {
      showError(err.message || "Nepodařilo se upravit položku checklistu.");
    }
  };

  const getSafeFileName = (value) =>
    String(value || "vylet")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const createPdfElement = (title, contentHtml) => {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <div style="
        width: 720px;
        padding: 28px;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        color: #13203a;
        background: #ffffff;
        font-size: 11px;
        line-height: 1.35;
      ">
        <div style="
          border-bottom: 1px solid #e5ecf6;
          padding-bottom: 12px;
          margin-bottom: 18px;
        ">
          <h1 style="
            margin: 0;
            font-size: 22px;
            line-height: 1.2;
            color: #13203a;
          ">
            ${title}
          </h1>
          <p style="
            margin: 6px 0 0;
            color: #6a7891;
            font-size: 10px;
          ">
            Vygenerováno: ${new Date().toLocaleDateString("cs-CZ")}
          </p>
        </div>

        ${contentHtml}
      </div>
    `;

    return wrapper;
  };

  const handleExportTripPdf = async () => {
    const checklistItems = packingPackage?.packingItems || [];

    const checklistRows = checklistItems
      .map(
        (item) => `
          <tr>
            <td style="border:1px solid #ddd; padding:6px; width:30px;">
              ${item.checked ? "✓" : ""}
            </td>
            <td style="
              border:1px solid #ddd;
              padding:6px;
              ${item.checked ? "text-decoration: line-through; color:#888;" : ""}
            ">
              ${item.text}
            </td>
          </tr>
        `
      )
      .join("");

    const notesHtml = notes
      .map(
        (note) => `
          <div style="margin-bottom:10px;">
            <strong>${note.title}</strong><br/>
            <span style="color:#555;">${note.content || ""}</span>
          </div>
        `
      )
      .join("");

    const content = `
      <h2>Přehled výletu</h2>

      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        ${[
          ["Název", trip.title],
          ["Destinace", displayLocation],
          ["Začátek", formatDate(trip.startDate)],
          ["Konec", formatDate(trip.endDate)],
          ["Délka", getTripLengthLabel(tripLength)],
          ["Kategorie", getCategoryLabel(trip.category)]
        ]
          .map(
            ([l, v]) => `
              <tr>
                <td style="border:1px solid #ddd; padding:6px; width:30%; font-weight:bold;">
                  ${l}
                </td>
                <td style="border:1px solid #ddd; padding:6px;">
                  ${v}
                </td>
              </tr>
            `
          )
          .join("")}
      </table>

      <br/>

      <h2>Checklist</h2>

      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        ${checklistRows || "<tr><td>Žádné položky</td></tr>"}
      </table>

      <br/>

      <h2>Poznámky</h2>

      ${notesHtml || "<p>Žádné poznámky</p>"}
    `;

    const element = createPdfElement(`Detail výletu – ${trip.title}`, content);

    await html2pdf()
      .set({
        margin: 10,
        filename: `${getSafeFileName(trip.title)}-detail.pdf`,
        html2canvas: {
          scale: 2,
          useCORS: true
        },
        jsPDF: { unit: "mm", format: "a4" }
      })
      .from(element)
      .save();
  };

  return (
    <main className="content">
      <section className={`trip-detail-hero trip-detail-hero-${statusTone}`}>
        <div className="trip-detail-hero-top">
          <button
            className="trip-detail-back-button"
            onClick={() => navigate(-1)}
            type="button"
          >
            <FiArrowLeft />
            <span>Zpět</span>
          </button>

          <div className="trip-detail-actions">
            <button
              className="trip-detail-icon-button"
              onClick={() => onEditTrip(trip)}
              title="Upravit výlet"
              type="button"
            >
              <FiEdit2 />
            </button>

            <button
              className="trip-detail-icon-button trip-detail-icon-button-danger"
              onClick={handleDelete}
              title="Smazat výlet"
              type="button"
            >
              <FiTrash2 />
            </button>

            <button
              className="trip-detail-icon-button"
              onClick={handleExportTripPdf}
              title="Exportovat detail výletu do PDF"
              type="button"
            >
              <FiFileText />
            </button>
          </div>
        </div>

        <div className="trip-detail-hero-main">
          <div className="trip-detail-hero-flag-wrap">
            <div className="trip-detail-hero-flag">
              {flagUrl ? (
                <img
                  src={flagUrl}
                  alt={displayCountry}
                  className="trip-detail-hero-flag-image"
                />
              ) : (
                <span className="trip-detail-hero-flag-fallback">🌍</span>
              )}
            </div>

            <div className="trip-detail-hero-country-code">
              {trip.countryCode}
            </div>
          </div>

          <div className="trip-detail-hero-content">
            <div className="trip-detail-badges">
              <span className="trip-detail-status-badge">{statusText}</span>
              <span className="trip-detail-season-badge">{season}</span>

              {trip.category && (
                <span className="trip-detail-category-badge">
                  {getCategoryLabel(trip.category)}
                </span>
              )}
            </div>

            <h1 className="trip-detail-title">{trip.title}</h1>

            <div className="trip-detail-subline">
              <span className="trip-detail-subline-item">
                <FiGlobe />
                {displayLocation}
              </span>

              <span className="trip-detail-subline-item">
                <FiCalendar />
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="trip-detail-highlights">
          <div className="trip-detail-highlight-card">
            <span className="trip-detail-highlight-label">Délka cesty</span>
            <strong className="trip-detail-highlight-value">
              {getTripLengthLabel(tripLength)}
            </strong>
          </div>

          <div className="trip-detail-highlight-card">
            <span className="trip-detail-highlight-label">Destinace</span>
            <strong className="trip-detail-highlight-value">
              {displayLocation}
            </strong>
          </div>

          <div className="trip-detail-highlight-card">
            <span className="trip-detail-highlight-label">Časové pásmo</span>
            <strong className="trip-detail-highlight-value">
              {timeZoneCard.value}
            </strong>
            <span className="trip-detail-highlight-subvalue">
              {timeZoneCard.subvalue}
            </span>
          </div>
        </div>
      </section>

      <section className="trip-detail-layout">
        <article className="trip-detail-panel trip-detail-panel-map trip-detail-grid-map">
          <div className="trip-detail-panel-head">
            <div>
              <h3 className="trip-detail-section-title">Mapa destinace</h3>
            </div>
          </div>

          {countriesLoading ? (
            <p className="trip-detail-muted">Načítám mapu…</p>
          ) : lat == null || lng == null ? (
            <p className="trip-detail-muted">
              Pro tuto zemi teď nemám dostupné souřadnice.
            </p>
          ) : (
            <div className="trip-detail-map">
              <MapContainer
                center={[lat, lng]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <Marker position={[lat, lng]}>
                  <Popup>{displayLocation}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </article>

        <article className="trip-detail-panel trip-detail-panel-summary trip-detail-grid-summary">
          <div className="trip-detail-panel-head">
            <div>
              <h3 className="trip-detail-section-title">Přehled výletu</h3>
            </div>
          </div>

          <div className="trip-detail-summary-list">
            <div className="trip-detail-summary-row">
              <span>Název</span>
              <strong>{trip.title}</strong>
            </div>

            <div className="trip-detail-summary-row">
              <span>Země</span>
              <strong>{displayCountry}</strong>
            </div>

            <div className="trip-detail-summary-row">
              <span>Město</span>
              <strong>{trip.city || "Neuvedeno"}</strong>
            </div>

            <div className="trip-detail-summary-row">
              <span>Začátek</span>
              <strong>{formatDate(trip.startDate)}</strong>
            </div>

            <div className="trip-detail-summary-row">
              <span>Konec</span>
              <strong>{formatDate(trip.endDate)}</strong>
            </div>

            <div className="trip-detail-summary-row">
              <span>Délka</span>
              <strong>{getTripLengthLabel(tripLength)}</strong>
            </div>

            <div className="trip-detail-summary-row">
              <span>Kategorie</span>
              <strong>{getCategoryLabel(trip.category)}</strong>
            </div>

            <div className="trip-detail-summary-row trip-detail-summary-row-timezone">
              <span>Časové pásmo</span>
              <div className="trip-detail-summary-timezone">
                <strong>{timeZoneCard.value}</strong>
                <small>{timeZoneCard.subvalue}</small>
              </div>
            </div>
          </div>
        </article>

        <div className="trip-detail-currency-alerts-grid">
          <CurrencyConverter countryCode={trip.countryCode} />

          <WeatherAlertsCard
            notificationsPackage={notificationsPackage}
            onImport={() => handleImportPackage("notifications", "Notifikace")}
            onRemove={() => {
              if (notificationsPackage?._id) {
                handleDeletePackageCard(notificationsPackage._id);
              }
            }}
          />
        </div>

        <article className="trip-detail-panel trip-detail-weather-panel trip-detail-grid-weather">
          <div className="trip-detail-panel-head">
            <div>
              <h3 className="trip-detail-section-title">Počasí</h3>
            </div>
          </div>

          {!weatherPackage ? (
            <MissingPackageCard
              title="Balíček Počasí není přidán"
              text="Po importu se zde zobrazí aktuální počasí a krátká předpověď pro destinaci výletu."
              onImport={() => handleImportPackage("weather", "Počasí")}
            />
          ) : !weatherData ? (
            <p className="trip-detail-muted">Načítám předpověď počasí…</p>
          ) : (
            <WeatherCard
              weather={weatherData}
              location={displayLocation}
              trip={trip}
              onRemove={() => handleDeletePackageCard(weatherPackage._id)}
            />
          )}
        </article>

        <article className="trip-detail-panel trip-detail-grid-checklist">
          <div className="trip-detail-panel-head">
            <div>
              <h3 className="trip-detail-section-title">Checklist</h3>
            </div>

            <div className="trip-detail-panel-icon">
              <FiCheckSquare />
            </div>
          </div>

          {!packingPackage ? (
            <MissingPackageCard
              title="Balíček Zabalit není přidán"
              text="Po importu se zde zobrazí checklist věcí, které si chceš sbalit na cestu."
              onImport={() => handleImportPackage("packing", "Zabalit")}
            />
          ) : (
            <>
              {packingPackage?.meta?.generatedFromCategory ? (
                <p className="trip-detail-muted">
                  Checklist byl automaticky předvyplněn podle kategorie výletu:{" "}
                  <strong>{getCategoryLabel(packingPackage.meta.category)}</strong>.
                </p>
              ) : (
                <p className="trip-detail-muted">
                  Vlastní checklist věcí, které si chceš sbalit.
                </p>
              )}

              <div className="trip-check-progress">
                <div className="trip-check-progress-top">
                  <span>Sbaleno</span>
                  <strong>
                    {checkedItems} / {totalItems}
                  </strong>
                </div>

                <div className="trip-check-progress-bar">
                  <div
                    className="trip-check-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="trip-detail-checklist-table">
                {(packingPackage.packingItems || []).map((item) => (
                  <div
                    key={item._id}
                    className={`trip-check-row ${item.checked ? "checked" : ""}`}
                  >
                    <button
                      type="button"
                      className={`trip-check-toggle ${
                        item.checked ? "checked" : ""
                      }`}
                      onClick={() =>
                        handleTogglePackingItem(packingPackage._id, item._id)
                      }
                      aria-label={
                        item.checked
                          ? "Označit jako nesbalené"
                          : "Označit jako sbalené"
                      }
                    >
                      {item.checked ? "✓" : ""}
                    </button>

                    <span className="trip-check-row-text">{item.text}</span>

                    <button
                      type="button"
                      className="trip-check-row-delete"
                      onClick={() => handleDeletePackingItem(item._id)}
                      aria-label={`Smazat položku ${item.text}`}
                      title="Smazat položku"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="trip-check-add-row">
                <input
                  type="text"
                  placeholder="Přidat položku..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddPackingItemInline();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={handleAddPackingItemInline}
                  aria-label="Přidat položku"
                  title="Přidat položku"
                >
                  +
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => handleDeletePackageCard(packingPackage._id)}
                >
                  Odebrat balíček
                </button>
              </div>
            </>
          )}
        </article>

        <div className="trip-detail-main-column">
          <article className="trip-detail-panel">
            <div className="trip-detail-panel-head">
              <div>
                <h3 className="trip-detail-section-title">Poznámky</h3>
              </div>

              <div className="trip-detail-panel-icon">
                <FiFileText />
              </div>
            </div>

            <p className="trip-detail-muted">
              Poznamenej si vše, co nechceš před cestou zapomenout.
            </p>

            <div className="trip-notes-create-wrapper">
              {!isEditorOpen ? (
                <button
                  type="button"
                  className="trip-note-add-trigger"
                  onClick={() => setIsEditorOpen(true)}
                >
                  + Přidat poznámku...
                </button>
              ) : (
                <div className="trip-notes-create-card">
                  <input
                    type="text"
                    className="trip-note-input"
                    placeholder="Nadpis poznámky"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />

                  <textarea
                    className="trip-note-textarea trip-note-textarea-autogrow"
                    placeholder="Text poznámky..."
                    value={newNoteContent}
                    onChange={(e) => {
                      setNewNoteContent(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={3}
                  />

                  <div className="trip-note-create-options">
                    <select
                      className="trip-note-select"
                      value={newNoteLabelColor}
                      onChange={(e) => setNewNoteLabelColor(e.target.value)}
                    >
                      <option value="default">Bez štítku</option>
                      <option value="blue">Modrá</option>
                      <option value="green">Zelená</option>
                      <option value="yellow">Žlutá</option>
                      <option value="red">Červená</option>
                      <option value="purple">Fialová</option>
                    </select>

                    <label className="trip-note-pin-toggle">
                      <input
                        type="checkbox"
                        checked={newNotePinned}
                        onChange={(e) => setNewNotePinned(e.target.checked)}
                      />
                      <span>Připnout</span>
                    </label>
                  </div>

                  <div className="trip-note-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setIsEditorOpen(false);
                        setNewNoteTitle("");
                        setNewNoteContent("");
                        setNewNoteLabelColor("default");
                        setNewNotePinned(false);
                      }}
                    >
                      Zrušit
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleCreateNote}
                    >
                      Uložit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {notesLoading ? (
              <p className="trip-detail-muted" style={{ marginTop: 16 }}>
                Načítám poznámky…
              </p>
            ) : notes.length === 0 ? (
              <div className="trip-detail-note-placeholder">
                Zatím tu nejsou žádné poznámky. Přidej si první.
              </div>
            ) : (
              <div className="trip-notes-list">
                {pinnedNotes.length > 0 && (
                  <div className="trip-notes-section">
                    <div className="trip-notes-section-title">Připnuté</div>

                    {pinnedNotes.map((note) => (
                      <div
                        key={note._id}
                        className={`trip-note-card ${getNoteLabelColorClass(
                          note.labelColor
                        )}`}
                      >
                        <div className="trip-note-card-head">
                          <div>
                            <h4>{note.title}</h4>
                            <span>
                              Upraveno{" "}
                              {new Date(note.updatedAt).toLocaleDateString(
                                "cs-CZ"
                              )}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="trip-note-delete-btn"
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            ✕
                          </button>
                        </div>

                        {note.content ? (
                          <p className="trip-note-card-content">
                            {note.content}
                          </p>
                        ) : null}

                        {note.checklistItems?.length > 0 && (
                          <div className="trip-note-card-checklist">
                            {note.checklistItems.map((item) => (
                              <button
                                key={item._id}
                                type="button"
                                className={`trip-note-check-item ${
                                  item.checked ? "checked" : ""
                                }`}
                                onClick={() =>
                                  handleToggleNoteChecklistItem(note._id, item._id)
                                }
                              >
                                <span className="trip-note-check-box">
                                  {item.checked ? "✓" : ""}
                                </span>
                                <span>{item.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {regularNotes.length > 0 && (
                  <div className="trip-notes-section">
                    <div className="trip-notes-section-title">
                      Ostatní poznámky
                    </div>

                    {regularNotes.map((note) => (
                      <div
                        key={note._id}
                        className={`trip-note-card ${getNoteLabelColorClass(
                          note.labelColor
                        )}`}
                      >
                        <div className="trip-note-card-head">
                          <div>
                            <h4>{note.title}</h4>
                            <span>
                              Upraveno{" "}
                              {new Date(note.updatedAt).toLocaleDateString(
                                "cs-CZ"
                              )}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="trip-note-delete-btn"
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            ✕
                          </button>
                        </div>

                        {note.content ? (
                          <p className="trip-note-card-content">
                            {note.content}
                          </p>
                        ) : null}

                        {note.checklistItems?.length > 0 && (
                          <div className="trip-note-card-checklist">
                            {note.checklistItems.map((item) => (
                              <button
                                key={item._id}
                                type="button"
                                className={`trip-note-check-item ${
                                  item.checked ? "checked" : ""
                                }`}
                                onClick={() =>
                                  handleToggleNoteChecklistItem(note._id, item._id)
                                }
                              >
                                <span className="trip-note-check-box">
                                  {item.checked ? "✓" : ""}
                                </span>
                                <span>{item.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

export default TripDetail;