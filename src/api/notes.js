import API from "./api";
const BASE_URL = `${API}/api/notes`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Chyba při komunikaci se serverem.");
  }

  return data;
}

export async function getNotesByTrip(tripId) {
  const response = await fetch(`${BASE_URL}/trip/${tripId}`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}

export async function createNote(tripId, payload) {
  const response = await fetch(`${BASE_URL}/trip/${tripId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function updateNote(noteId, payload) {
  const response = await fetch(`${BASE_URL}/${noteId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

export async function deleteNote(noteId) {
  const response = await fetch(`${BASE_URL}/${noteId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}

export async function toggleNoteChecklistItem(noteId, itemId) {
  const response = await fetch(`${BASE_URL}/${noteId}/checklist/${itemId}/toggle`, {
    method: "PUT",
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}