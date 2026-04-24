import API from "./api";
const PACKAGES_API_URL = `${API}/api/packages`;

function getAuthHeaders(includeContentType = false) {
  const token = localStorage.getItem("token");
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

export async function importTemplatePackage(type, tripId) {
  const response = await fetch(`${PACKAGES_API_URL}/import-template`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ type, tripId })
  });

  return parseResponse(response, "Nepodařilo se importovat balíček");
}

export async function getTripPackages(tripId) {
  const response = await fetch(`${PACKAGES_API_URL}/trip/${tripId}`, {
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se načíst balíčky");
}

export async function getPackageWeather(packageId) {
  const response = await fetch(`${PACKAGES_API_URL}/${packageId}/weather`, {
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se načíst počasí");
}

export async function generatePackageAlerts(packageId) {
  const response = await fetch(`${PACKAGES_API_URL}/${packageId}/generate-alerts`, {
    method: "POST",
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se vygenerovat notifikace");
}

export async function updatePackage(packageId, payload) {
  const response = await fetch(`${PACKAGES_API_URL}/${packageId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload)
  });

  return parseResponse(response, "Nepodařilo se upravit balíček");
}

export async function deletePackage(packageId) {
  const response = await fetch(`${PACKAGES_API_URL}/${packageId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se smazat balíček");
}

export async function getAllNotifications() {
  const response = await fetch(`${PACKAGES_API_URL}/notifications/all`, {
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se načíst notifikace");
}

export async function markNotificationAsRead(packageId, notificationId) {
  const response = await fetch(
    `${PACKAGES_API_URL}/${packageId}/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: getAuthHeaders()
    }
  );

  return parseResponse(response, "Nepodařilo se označit notifikaci");
}