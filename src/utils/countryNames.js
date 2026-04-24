export function normalizeText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildCountryNameMap(countries = []) {
  return countries.reduce((acc, country) => {
    const code = (country?.code || "").toUpperCase();

    if (!code) {
      return acc;
    }

    acc[code] = {
      name: country?.name || "",
      nameCs: country?.nameCs || country?.name || ""
    };

    return acc;
  }, {});
}

export function getCountryDisplayName(countryCode, fallbackName = "", countryNameMap = {}) {
  const code = (countryCode || "").toUpperCase();

  if (code && countryNameMap[code]?.nameCs) {
    return countryNameMap[code].nameCs;
  }

  return fallbackName || "Neznámá země";
}
