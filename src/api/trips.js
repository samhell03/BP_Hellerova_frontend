import API from "./api";
const TRIPS_API_URL = `${API}/api/trips`;

function getAuthHeaders(includeContentType = false) {
  const token = sessionStorage.getItem("token");

  const headers = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseResponse(response, defaultMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
}

export async function getTrips() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return [];
  }

  const response = await fetch(TRIPS_API_URL, {
    headers: getAuthHeaders()
  });

  const data = await parseResponse(response, "Nepodařilo se načíst výlety");
  return Array.isArray(data) ? data : [];
}

export async function getTripDetail(id) {
  const response = await fetch(`${TRIPS_API_URL}/${id}`, {
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se načíst detail výletu");
}

export async function removeTrip(id) {
  const response = await fetch(`${TRIPS_API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se smazat výlet");
}
