import API from "./api";
const COUNTRIES_API_URL = `${API}/api/countries`;

export async function searchCities(city, countryCode) {
  const params = new URLSearchParams({
    city,
    countryCode
  });

  const response = await fetch(
    `${COUNTRIES_API_URL}/cities/search?${params.toString()}`
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Nepodařilo se vyhledat město.");
  }

  return Array.isArray(data) ? data : [];
}