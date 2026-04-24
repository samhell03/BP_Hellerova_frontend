import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/api";
import {
  FiCalendar,
  FiCheckSquare,
  FiGlobe,
  FiMapPin,
  FiTag,
  FiX
} from "react-icons/fi";
import "../styles/newtrip.css";

import { getCountries } from "../api/countries";
import { searchCities } from "../api/cities";
import { normalizeText } from "../utils/countryNames";
import { showError, showSuccess } from "../utils/toast";
import {
  createEmptyTripForm,
  hasTripFormErrors,
  mapTripToFormData,
  validateTripForm
} from "../utils/tripForm";

const MIN_DATE = "1950-01-01";
const MAX_DATE = "2100-12-31";

const PACKAGE_OPTIONS = [
  {
    key: "weather",
    label: "Počasí",
    description: "Předpověď počasí a časové pásmo."
  },
  {
    key: "notifications",
    label: "Notifikace",
    description: "Upozornění podle počasí."
  },
  {
    key: "contacts",
    label: "Kontakty",
    description: "Nouzová čísla a důležité kontakty."
  },
  {
    key: "packing",
    label: "Zabalit",
    description: "Checklist věcí k zabalení."
  }
];

function formatDateLabel(date) {
  if (!date) return "Nevybráno";

  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(date));
  } catch {
    return date;
  }
}

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

function getCategoryLabel(category, customCategory) {
  if (category === "custom") {
    return customCategory.trim() || "Vlastní";
  }

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
    default:
      return "Obecný výlet";
  }
}

function getDefaultPackagesForCategory(category) {
  switch (category) {
    case "vacation":
      return ["weather", "packing"];
    case "mountains":
      return ["weather", "notifications", "packing"];
    case "camping":
      return ["contacts", "packing", "notifications"];
    case "city":
      return ["weather", "contacts"];
    case "roadtrip":
      return ["contacts", "notifications", "packing"];
    case "general":
      return ["packing"];
    case "custom":
      return [];
    default:
      return [];
  }
}

const EMPTY_ERRORS = {
  title: "",
  startDate: "",
  endDate: "",
  country: ""
};

const EMPTY_TOUCHED = {
  title: false,
  startDate: false,
  endDate: false,
  country: false
};

export default function NewTrip({ onClose, onSave, tripToEdit }) {
  const [trip, setTrip] = useState(createEmptyTripForm());
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [countryQuery, setCountryQuery] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [touched, setTouched] = useState(EMPTY_TOUCHED);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const countryWrapRef = useRef(null);
  const cityWrapRef = useRef(null);

  const [category, setCategory] = useState("general");
  const [customCategory, setCustomCategory] = useState("");
  const [selectedPackages, setSelectedPackages] = useState(["packing"]);
  const [hasUserChangedPackages, setHasUserChangedPackages] = useState(false);

  useEffect(() => {
    if (tripToEdit) {
      const mappedTrip = mapTripToFormData(tripToEdit);

      setTrip(mappedTrip);
      setCountryQuery(mappedTrip.countryName || "");
      setCityQuery(mappedTrip.city || "");
      setCityResults([]);

      const existingCategory = tripToEdit.category || "general";
      const predefinedCategories = [
        "general",
        "vacation",
        "mountains",
        "camping",
        "city",
        "roadtrip"
      ];

      if (predefinedCategories.includes(existingCategory)) {
        setCategory(existingCategory);
        setCustomCategory("");
      } else {
        setCategory("custom");
        setCustomCategory(existingCategory);
      }

      setSelectedPackages([]);
      setHasUserChangedPackages(false);
      setErrors(validateTripForm(mappedTrip));
      setTouched(EMPTY_TOUCHED);
      setIsSubmitted(false);
      setSubmitError("");
      return;
    }

    const emptyTrip = createEmptyTripForm();
    setTrip(emptyTrip);
    setCountryQuery("");
    setCityQuery("");
    setCityResults([]);
    setCategory("general");
    setCustomCategory("");
    setSelectedPackages(getDefaultPackagesForCategory("general"));
    setHasUserChangedPackages(false);
    setErrors(EMPTY_ERRORS);
    setTouched(EMPTY_TOUCHED);
    setIsSubmitted(false);
    setSubmitError("");
  }, [tripToEdit]);

  useEffect(() => {
    let active = true;

    const loadCountries = async () => {
      setCountriesLoading(true);

      try {
        const data = await getCountries();

        if (active) {
          setCountries(data || []);
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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (countryWrapRef.current && !countryWrapRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }

      if (cityWrapRef.current && !cityWrapRef.current.contains(event.target)) {
        setIsCityOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadCities = async () => {
      const query = cityQuery.trim();

      if (!trip.countryCode || query.length < 2) {
        setCityResults([]);
        setCitiesLoading(false);
        return;
      }

      try {
        setCitiesLoading(true);
        const results = await searchCities(query, trip.countryCode);

        if (active) {
          setCityResults(results);
        }
      } catch (err) {
        if (active) {
          setCityResults([]);
        }
        console.error("Chyba při hledání měst:", err);
      } finally {
        if (active) {
          setCitiesLoading(false);
        }
      }
    };

    const timeout = setTimeout(loadCities, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [cityQuery, trip.countryCode]);

  useEffect(() => {
    if (tripToEdit) return;
    if (hasUserChangedPackages) return;

    setSelectedPackages(getDefaultPackagesForCategory(category));
  }, [category, hasUserChangedPackages, tripToEdit]);

  const filteredCountries = useMemo(() => {
    const query = normalizeText(countryQuery);

    if (!query) {
      return countries.slice(0, 8);
    }

    return countries
      .filter((country) => {
        const nameCs = normalizeText(country.nameCs);
        const nameEn = normalizeText(country.name);
        const code = normalizeText(country.code);

        return (
          nameCs.includes(query) ||
          nameEn.includes(query) ||
          code.includes(query)
        );
      })
      .slice(0, 10);
  }, [countries, countryQuery]);

  const tripLength = useMemo(
    () => getTripLength(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate]
  );

  const areAllPackagesSelected = selectedPackages.length === PACKAGE_OPTIONS.length;

  const runValidation = (nextTrip) => {
    const validationErrors = validateTripForm(nextTrip);
    setErrors(validationErrors);
    return validationErrors;
  };

  const handleInputChange = (field, value) => {
    const nextTrip = {
      ...trip,
      [field]: value
    };

    setTrip(nextTrip);
    setSubmitError("");

    const nextTouched = {
      ...touched,
      [field]: true
    };

    setTouched(nextTouched);

    const validationErrors = validateTripForm(nextTrip);

    const nextErrors = {
      ...errors
    };

    if (field === "startDate" || field === "endDate") {
      nextErrors.startDate =
        nextTouched.startDate || isSubmitted ? validationErrors.startDate : "";
      nextErrors.endDate =
        nextTouched.endDate || isSubmitted ? validationErrors.endDate : "";
    } else {
      nextErrors[field] =
        nextTouched[field] || isSubmitted ? validationErrors[field] : "";
    }

    setErrors(nextErrors);
  };

  const handleCountryInputChange = (value) => {
    setCountryQuery(value);
    setCityQuery("");
    setCityResults([]);
    setIsCityOpen(false);

    const nextTrip = {
      ...trip,
      countryName: "",
      countryCode: "",
      city: "",
      cityLat: null,
      cityLng: null
    };

    setTrip(nextTrip);
    setIsCountryOpen(true);
    setSubmitError("");

    if (isSubmitted) {
      const validationErrors = validateTripForm(nextTrip);

      setErrors((prev) => ({
        ...prev,
        country: validationErrors.country
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        country: ""
      }));
    }
  };

  const handleCountrySelect = (country) => {
    const displayName = country.nameCs || country.name;

    const nextTrip = {
      ...trip,
      countryName: displayName,
      countryCode: country.code,
      city: "",
      cityLat: null,
      cityLng: null
    };

    setTrip(nextTrip);
    setCountryQuery(displayName);
    setCityQuery("");
    setCityResults([]);
    setIsCountryOpen(false);
    setIsCityOpen(false);
    setSubmitError("");

    const nextTouched = {
      ...touched,
      country: true
    };

    setTouched(nextTouched);

    const validationErrors = validateTripForm(nextTrip);

    setErrors((prev) => ({
      ...prev,
      country: nextTouched.country || isSubmitted ? validationErrors.country : prev.country
    }));
  };

  const handleCityInputChange = (value) => {
    setCityQuery(value);

    const nextTrip = {
      ...trip,
      city: value,
      cityLat: null,
      cityLng: null
    };

    setTrip(nextTrip);
    setIsCityOpen(true);
    setSubmitError("");
  };

  const handleCitySelect = (cityItem) => {
    const nextTrip = {
      ...trip,
      city: cityItem.name,
      cityLat: cityItem.latitude,
      cityLng: cityItem.longitude
    };

    setTrip(nextTrip);
    setCityQuery(cityItem.name);
    setCityResults([]);
    setIsCityOpen(false);
    setSubmitError("");
  };

  const handleBlur = (field) => {
    const nextTouched = {
      ...touched,
      [field]: true
    };

    setTouched(nextTouched);

    const validationErrors = validateTripForm(trip);

    if (field === "startDate" || field === "endDate") {
      setErrors((prev) => ({
        ...prev,
        startDate: nextTouched.startDate || isSubmitted ? validationErrors.startDate : prev.startDate,
        endDate: nextTouched.endDate || isSubmitted ? validationErrors.endDate : prev.endDate
      }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: nextTouched[field] || isSubmitted ? validationErrors[field] : prev[field]
    }));
  };

  const togglePackage = (packageKey) => {
    setHasUserChangedPackages(true);
    setSubmitError("");

    setSelectedPackages((prev) =>
      prev.includes(packageKey)
        ? prev.filter((item) => item !== packageKey)
        : [...prev, packageKey]
    );
  };

  const handleToggleAllPackages = () => {
    setHasUserChangedPackages(true);
    setSubmitError("");

    if (areAllPackagesSelected) {
      setSelectedPackages([]);
      return;
    }

    setSelectedPackages(PACKAGE_OPTIONS.map((item) => item.key));
  };

  const handleResetRecommendedPackages = () => {
    setHasUserChangedPackages(false);
    setSelectedPackages(getDefaultPackagesForCategory(category));
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);

    const allTouched = {
      title: true,
      startDate: true,
      endDate: true,
      country: true
    };

    setTouched(allTouched);

    const validationErrors = runValidation(trip);

    if (hasTripFormErrors(validationErrors)) {
      return;
    }

    if (category === "custom" && !customCategory.trim()) {
      const message = "Zadej název vlastní kategorie.";
      setSubmitError(message);
      showError(message);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      const message = "Uživatel není přihlášen. Zkus se znovu přihlásit.";
      setSubmitError(message);
      showError(message);
      return;
    }

    const finalCategory =
      category === "custom" ? customCategory.trim() : category;

    const tripData = {
      title: trip.title.trim(),
      country: trip.countryName,
      countryCode: trip.countryCode.toUpperCase(),
      city: trip.city?.trim() || "",
      cityLat: trip.cityLat,
      cityLng: trip.cityLng,
      startDate: trip.startDate,
      endDate: trip.endDate,
      category: finalCategory || "general",
      selectedPackages
    };

    const isEdit = Boolean(tripToEdit);
    const url = isEdit
      ? `${API}/api/trips/${tripToEdit._id}`
      : `${API}/api/trips`;
    const method = isEdit ? "PUT" : "POST";

    try {
      setIsSaving(true);
      setSubmitError("");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tripData)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message || "Chyba při ukládání výletu.";
        setSubmitError(message);
        showError(message);
        return;
      }

      await onSave();

      showSuccess(
        tripToEdit
          ? "Výlet byl úspěšně upraven."
          : "Výlet byl úspěšně vytvořen."
      );

      onClose();
    } catch (err) {
      console.error("Nepodařilo se spojit se serverem:", err);
      const message = "Nepodařilo se spojit se serverem.";
      setSubmitError(message);
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const showTitleError = (touched.title || isSubmitted) && errors.title;
  const showStartDateError = (touched.startDate || isSubmitted) && errors.startDate;
  const showEndDateError = (touched.endDate || isSubmitted) && errors.endDate;
  const showCountryError = (touched.country || isSubmitted) && errors.country;

  return (
    <div
      className="new-trip-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="new-trip-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="new-trip-close"
          onClick={onClose}
          aria-label="Zavřít formulář"
          title="Zavřít"
        >
          <FiX />
        </button>

        <div className="new-trip-header">
          <div className="new-trip-icon">⌯✈︎</div>

          <div className="new-trip-header-text">
            <h2 className="new-trip-title">
              {tripToEdit ? "Upravit výlet" : "Naplánovat výlet"}
            </h2>
            <p className="new-trip-subtitle">
              Vyplň základní informace a vytvoř si svůj cestovatelský plán.
            </p>
          </div>
        </div>

        <div className="new-trip-preview">
          <div className="new-trip-preview-item">
            <span className="new-trip-preview-label">Název</span>
            <strong className="new-trip-preview-value">
              {trip.title?.trim() || "Můj nový výlet"}
            </strong>
          </div>

          <div className="new-trip-preview-item">
            <span className="new-trip-preview-label">Destinace</span>
            <strong className="new-trip-preview-value">
              {trip.city
                ? `${trip.city}, ${trip.countryName || "Zatím nevybráno"}`
                : trip.countryName || "Zatím nevybráno"}
            </strong>
          </div>

          <div className="new-trip-preview-item">
            <span className="new-trip-preview-label">Délka cesty</span>
            <strong className="new-trip-preview-value">
              {getTripLengthLabel(tripLength)}
            </strong>
          </div>
        </div>

        <div className="new-trip-form-group">
          <label className="new-trip-label">
            <FiMapPin />
            <span>Název cesty</span>
          </label>

          <input
            className={`new-trip-input ${showTitleError ? "input-error" : ""}`}
            type="text"
            placeholder="Např. Letní Itálie"
            value={trip.title}
            maxLength={60}
            onChange={(e) => handleInputChange("title", e.target.value)}
            onBlur={() => handleBlur("title")}
          />

          {showTitleError ? (
            <p className="new-trip-field-error">{errors.title}</p>
          ) : (
            <div className="new-trip-helper-row">
              <span className="new-trip-helper-text">
                Zvol krátký a výstižný název výletu.
              </span>
              <span className="new-trip-counter">{trip.title.length}/60</span>
            </div>
          )}
        </div>

        <div className="new-trip-form-row">
          <div className="new-trip-form-group">
            <label className="new-trip-label">
              <FiCalendar />
              <span>Od</span>
            </label>

            <input
              className={`new-trip-input ${showStartDateError ? "input-error" : ""}`}
              type="date"
              value={trip.startDate}
              min={MIN_DATE}
              max={MAX_DATE}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              onBlur={() => handleBlur("startDate")}
            />

            {showStartDateError ? (
              <p className="new-trip-field-error">{errors.startDate}</p>
            ) : (
              <span className="new-trip-helper-text">
                {formatDateLabel(trip.startDate)}
              </span>
            )}
          </div>

          <div className="new-trip-form-group">
            <label className="new-trip-label">
              <FiCalendar />
              <span>Do</span>
            </label>

            <input
              className={`new-trip-input ${showEndDateError ? "input-error" : ""}`}
              type="date"
              value={trip.endDate}
              min={MIN_DATE}
              max={MAX_DATE}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              onBlur={() => handleBlur("endDate")}
            />

            {showEndDateError ? (
              <p className="new-trip-field-error">{errors.endDate}</p>
            ) : (
              <span className="new-trip-helper-text">
                {formatDateLabel(trip.endDate)}
              </span>
            )}
          </div>
        </div>

        <div
          className="new-trip-form-group new-trip-country-group"
          ref={countryWrapRef}
        >
          <label className="new-trip-label">
            <FiGlobe />
            <span>Země</span>
          </label>

          <input
            className={`new-trip-input ${showCountryError ? "input-error" : ""}`}
            type="text"
            placeholder="Napiš název země nebo kód (např. Itálie / IT)"
            value={countryQuery}
            onChange={(e) => handleCountryInputChange(e.target.value)}
            onFocus={() => {
              setIsCountryOpen(true);
            }}
            onBlur={() => handleBlur("country")}
            autoComplete="off"
          />

          {showCountryError ? (
            <p className="new-trip-field-error">{errors.country}</p>
          ) : (
            trip.countryCode &&
            trip.countryName && (
              <div className="new-trip-country-selected">
                Vybraná destinace: <strong>{trip.countryName}</strong> ({trip.countryCode})
              </div>
            )
          )}

          {isCountryOpen && (
            <div className="new-trip-country-dropdown">
              {countriesLoading ? (
                <div className="new-trip-country-state">Načítám země…</div>
              ) : filteredCountries.length === 0 ? (
                <div className="new-trip-country-state">
                  Žádná země nenalezena.
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className="new-trip-country-option"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country.flag ? (
                      <img
                        src={country.flag}
                        alt=""
                        className="new-trip-country-flag"
                      />
                    ) : (
                      <span className="new-trip-country-flag-placeholder" />
                    )}

                    <div className="new-trip-country-option-text">
                      <strong>{country.nameCs || country.name}</strong>
                      <span>{country.code}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div
          className="new-trip-form-group new-trip-country-group"
          ref={cityWrapRef}
        >
          <label className="new-trip-label">
            <FiMapPin />
            <span>Město</span>
          </label>

          <input
            className="new-trip-input"
            type="text"
            placeholder={
              trip.countryCode
                ? "Napiš město v této zemi"
                : "Nejdřív vyber zemi"
            }
            value={cityQuery}
            disabled={!trip.countryCode}
            onChange={(e) => handleCityInputChange(e.target.value)}
            onFocus={() => {
              setIsCountryOpen(false);

              if (trip.countryCode) {
                setIsCityOpen(true);
              }
            }}
            autoComplete="off"
          />

          {!trip.countryCode ? (
            <span className="new-trip-helper-text">
              Nejprve vyber zemi.
            </span>
          ) : trip.city && trip.cityLat != null && trip.cityLng != null ? (
            <div className="new-trip-country-selected">
              Vybrané město: <strong>{trip.city}</strong>
            </div>
          ) : (
            <span className="new-trip-helper-text">
              Město je volitelné, ale zpřesní polohu špendlíku na mapě.
            </span>
          )}

          {isCityOpen && trip.countryCode && (
            <div className="new-trip-country-dropdown">
              {citiesLoading ? (
                <div className="new-trip-country-state">Hledám města…</div>
              ) : cityQuery.trim().length < 2 ? (
                <div className="new-trip-country-state">
                  Začni psát název města.
                </div>
              ) : cityResults.length === 0 ? (
                <div className="new-trip-country-state">
                  Žádná města nenalezena.
                </div>
              ) : (
                cityResults.map((item) => (
                  <button
                    key={`${item.id}-${item.latitude}-${item.longitude}`}
                    type="button"
                    className="new-trip-country-option"
                    onClick={() => handleCitySelect(item)}
                  >
                    <div className="new-trip-country-option-text">
                      <strong>{item.name}</strong>
                      <span>
                        {[item.admin1, item.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="new-trip-form-group">
          <label className="new-trip-label">
            <FiTag />
            <span>Kategorie výletu</span>
          </label>

          <select
            className="new-trip-input new-trip-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubmitError("");
            }}
          >
            <option value="general">Obecný výlet</option>
            <option value="vacation">Dovolená</option>
            <option value="mountains">Hory</option>
            <option value="camping">Stanování</option>
            <option value="city">Město</option>
            <option value="roadtrip">Roadtrip</option>
            <option value="custom">Vlastní kategorie</option>
          </select>

          <span className="new-trip-helper-text">
            Kategorie pomůže automaticky předvybrat vhodné balíčky a seznam věcí.
          </span>

          {category === "custom" && (
            <input
              className="new-trip-input"
              type="text"
              placeholder="Např. Festival, Wellness, Lyže"
              value={customCategory}
              maxLength={40}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                setSubmitError("");
              }}
            />
          )}
        </div>

        {!tripToEdit && (
          <div className="new-trip-form-group">
            <label className="new-trip-label">
              <FiCheckSquare />
              <span>Balíčky pro výlet</span>
            </label>

            <div className="new-trip-packages-card">
              <div className="new-trip-packages-top">
                <button
                  type="button"
                  className={`new-trip-select-all-btn ${areAllPackagesSelected ? "active" : ""}`}
                  onClick={handleToggleAllPackages}
                >
                  {areAllPackagesSelected ? "Odebrat vše" : "Vybrat vše"}
                </button>

                <button
                  type="button"
                  className="new-trip-reset-btn"
                  onClick={handleResetRecommendedPackages}
                >
                  Obnovit doporučení
                </button>
              </div>

              <div className="new-trip-packages-list">
                {PACKAGE_OPTIONS.map((item) => {
                  const checked = selectedPackages.includes(item.key);

                  return (
                    <label
                      key={item.key}
                      className={`new-trip-package-option ${checked ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePackage(item.key)}
                      />
                      <div className="new-trip-package-text">
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="new-trip-packages-footer">
                Vybráno balíčků: <strong>{selectedPackages.length}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="new-trip-summary-card">
          <div className="new-trip-summary-line">
            <span>Výlet</span>
            <strong>{trip.title?.trim() || "Bez názvu"}</strong>
          </div>

          <div className="new-trip-summary-line">
            <span>Kam</span>
            <strong>
              {trip.city
                ? `${trip.city}, ${trip.countryName || "Nevybráno"}`
                : trip.countryName || "Nevybráno"}
            </strong>
          </div>

          <div className="new-trip-summary-line">
            <span>Termín</span>
            <strong>
              {trip.startDate && trip.endDate
                ? `${formatDateLabel(trip.startDate)} – ${formatDateLabel(trip.endDate)}`
                : "Termín zatím není kompletní"}
            </strong>
          </div>

          <div className="new-trip-summary-line">
            <span>Kategorie</span>
            <strong>{getCategoryLabel(category, customCategory)}</strong>
          </div>

          {!tripToEdit && (
            <div className="new-trip-summary-line">
              <span>Balíčky</span>
              <strong>
                {selectedPackages.length > 0
                  ? selectedPackages
                    .map(
                      (pkg) =>
                        PACKAGE_OPTIONS.find((item) => item.key === pkg)?.label || pkg
                    )
                    .join(", ")
                  : "Žádné"}
              </strong>
            </div>
          )}
        </div>

        {submitError && <div className="new-trip-submit-error">{submitError}</div>}

        <div className="new-trip-actions">
          <button
            type="button"
            className="btn-save"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving
              ? "Ukládám..."
              : tripToEdit
                ? "Uložit změny"
                : "Vytvořit výlet"}
          </button>

          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}