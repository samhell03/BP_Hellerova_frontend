import { useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { getTripPackages, importTemplatePackage } from "../api/packages";
import { showError, showSuccess } from "../utils/toast";
import "../styles/templates.css";

const TEMPLATES = [
  {
    key: "weather",
    title: "Počasí",
    description: "Aktuální počasí a krátká předpověď.",
  },
  {
    key: "notifications",
    title: "Notifikace",
    description: "Upozornění na meteorologické jevy.",
  },
  {
    key: "packing",
    title: "Zabalit",
    description: "Seznam věcí k zabalení.",
  },
];

function TemplatesPage({ myTrips = [] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTemplateKey, setActiveTemplateKey] = useState(null);
  const [tripSearch, setTripSearch] = useState("");
  const [loadingKey, setLoadingKey] = useState("");
  const [packageTypesByTrip, setPackageTypesByTrip] = useState({});
  const [packagesLoading, setPackagesLoading] = useState(false);

  const loadTripPackageTypes = async () => {
    try {
      setPackagesLoading(true);

      const result = {};

      await Promise.all(
        myTrips.map(async (trip) => {
          const packages = await getTripPackages(trip._id);
          result[trip._id] = Array.isArray(packages)
            ? packages.map((item) => item.type)
            : [];
        })
      );

      setPackageTypesByTrip(result);
    } catch (err) {
      showError(err.message || "Nepodařilo se načíst balíčky výletů.");
    } finally {
      setPackagesLoading(false);
    }
  };

  const tripsWithoutSelectedPackage = useMemo(() => {
    if (!selectedTemplate) return [];

    return myTrips.filter((trip) => {
      const packageTypes = packageTypesByTrip[trip._id] || [];
      return !packageTypes.includes(selectedTemplate.key);
    });
  }, [myTrips, packageTypesByTrip, selectedTemplate]);

  const filteredTrips = useMemo(() => {
    const q = tripSearch.trim().toLowerCase();

    if (!q) return tripsWithoutSelectedPackage;

    return tripsWithoutSelectedPackage.filter((trip) => {
      const haystack = [trip.title, trip.city, trip.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [tripsWithoutSelectedPackage, tripSearch]);

  const handleTemplateCardClick = (template) => {
    setActiveTemplateKey((prevKey) =>
      prevKey === template.key ? null : template.key
    );
  };

  const openImportModal = async (template) => {
    setSelectedTemplate(template);
    setTripSearch("");
    await loadTripPackageTypes();
  };

  const closeImportModal = () => {
    setSelectedTemplate(null);
    setTripSearch("");
    setLoadingKey("");
  };

  const handleImport = async (tripId) => {
    if (!selectedTemplate) return;

    try {
      setLoadingKey(tripId);
      await importTemplatePackage(selectedTemplate.key, tripId);

      setPackageTypesByTrip((prev) => ({
        ...prev,
        [tripId]: [...(prev[tripId] || []), selectedTemplate.key],
      }));

      showSuccess("Balíček byl úspěšně importován do výletu!");
      closeImportModal();
    } catch (err) {
      showError(err.message || "Import se nezdařil.");
    } finally {
      setLoadingKey("");
    }
  };

  return (
    <main className="content">
      <section className="templates-page">
        <div className="templates-page-header">
          <h1 className="templates-page-title">Šablony balíčků</h1>
          <p className="templates-page-text">
            Zvolte si balíček, který chcete importovat do svého výletu.
          </p>
        </div>

        <div className="templates-grid">
          {TEMPLATES.map((template) => (
            <article
              key={template.key}
              className={`template-card ${
                activeTemplateKey === template.key ? "template-card--active" : ""
              }`}
              onClick={() => handleTemplateCardClick(template)}
            >
              <div className="template-card-base">
                <h3 className="template-card-title">{template.title}</h3>
                <p className="template-card-description">
                  {template.description}
                </p>
              </div>

              <div className="template-card-overlay">
                <button
                  type="button"
                  className="template-card-overlay-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImportModal(template);
                  }}
                >
                  Importovat
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedTemplate && (
        <div className="template-modal-backdrop" onClick={closeImportModal}>
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="template-modal-header">
              <div>
                <h2 className="template-modal-title">
                  {selectedTemplate.title}
                </h2>
                <p className="template-modal-text">
                  Zobrazují se pouze výlety, ve kterých tento balíček ještě není.
                </p>
              </div>

              <button
                type="button"
                className="template-modal-close"
                onClick={closeImportModal}
                aria-label="Zavřít okno"
              >
                <FiX />
              </button>
            </div>

            <div className="template-modal-search">
              <FiSearch className="template-modal-search-icon" />
              <input
                type="text"
                placeholder="Vyhledat výlet podle názvu, města nebo země"
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
              />
            </div>

            <div className="template-modal-trip-list">
              {packagesLoading ? (
                <div className="template-modal-empty">
                  Načítám dostupné výlety…
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="template-modal-empty">
                  Tento balíček už je ve všech odpovídajících výletech importovaný.
                </div>
              ) : (
                filteredTrips.map((trip) => {
                  const isLoading = loadingKey === trip._id;

                  return (
                    <button
                      key={trip._id}
                      type="button"
                      className="template-modal-trip-item"
                      onClick={() => handleImport(trip._id)}
                      disabled={isLoading}
                    >
                      <div className="template-modal-trip-main">
                        <strong>{trip.title}</strong>
                        <span>
                          {trip.city ? `${trip.city}, ` : ""}
                          {trip.country}
                        </span>
                      </div>

                      <span className="template-modal-trip-action">
                        {isLoading ? "Importuji..." : "Importovat"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default TemplatesPage;