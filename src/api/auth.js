import API from "./api";

const AUTH_API_URL = `${API}/api/auth`;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Došlo k chybě při komunikaci se serverem.");
  }

  return data;
}

export async function registerUser(formData) {
  const response = await fetch(`${AUTH_API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });

  return parseJsonResponse(response);
}

export async function verifyRegistrationCode(email, code) {
  const response = await fetch(`${AUTH_API_URL}/verify-registration-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, code })
  });

  return parseJsonResponse(response);
}

export async function resendRegistrationCode(email) {
  const response = await fetch(`${AUTH_API_URL}/resend-registration-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  return parseJsonResponse(response);
}

export async function loginUser(formData) {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });

  return parseJsonResponse(response);
}

export function saveAuthData(data) {
  sessionStorage.setItem("token", data.token);
  sessionStorage.setItem("userId", data.userId);
  sessionStorage.setItem("userName", data.userName);
}

export function clearAuthData() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("userName");
}

export async function fetchMe() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${AUTH_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const data = await response.json();

    return {
      userId: data.userId,
      userName: data.userName
    };
  } catch {
    return null;
  }
}

export async function fetchMeDetailed() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${AUTH_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function changePassword(payload) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Nejste přihlášen.");
  }

  const response = await fetch(`${AUTH_API_URL}/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function requestPasswordChangeCode(payload) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Nejste přihlášen.");
  }

  const response = await fetch(`${AUTH_API_URL}/request-password-change-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function confirmPasswordChange(code) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Nejste přihlášen.");
  }

  const response = await fetch(`${AUTH_API_URL}/confirm-password-change`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ code })
  });

  return parseJsonResponse(response);
}

export async function updateUserName(userName) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Nejste přihlášen.");
  }

  const response = await fetch(`${AUTH_API_URL}/update-name`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userName })
  });

  const data = await parseJsonResponse(response);

  if (data.userName) {
    sessionStorage.setItem("userName", data.userName);
  }

  return data;
}

export async function googleLoginUser(credential) {
  const response = await fetch(`${AUTH_API_URL}/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ credential })
  });

  return parseJsonResponse(response);
}

export async function forgotPassword(email) {
  const response = await fetch(`${AUTH_API_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  return parseJsonResponse(response);
}

export async function resetPassword(payload) {
  const response = await fetch(`${AUTH_API_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}