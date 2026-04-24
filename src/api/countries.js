import API from "./api";
const COUNTRIES_API_URL = `${API}/api/countries`;

export async function getCountries() {
  const response = await fetch(COUNTRIES_API_URL);

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst země");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}