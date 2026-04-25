import API from "./api";

const NOTIFICATIONS_API_URL = `${API}/api/notifications`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function parseResponse(response, defaultMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
}

export async function generateTripReminders() {
  const response = await fetch(`${NOTIFICATIONS_API_URL}/generate-trip-reminders`, {
    method: "POST",
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se vygenerovat připomínky výletů.");
}

export async function getAllNotifications() {
  const response = await fetch(NOTIFICATIONS_API_URL, {
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se načíst notifikace.");
}

export async function markNotificationAsRead(notificationId) {
  const response = await fetch(`${NOTIFICATIONS_API_URL}/${notificationId}/read`, {
    method: "PUT",
    headers: getAuthHeaders()
  });

  return parseResponse(response, "Nepodařilo se označit notifikaci.");
}