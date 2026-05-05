const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data;
}

export async function fetchAtlasStatus(token) {
  const response = await fetch(`${API_URL}/api/atlas/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not fetch Atlas status");
  }

  return data;
}

export async function fetchHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not fetch API health");
  }

  return data;
}

export async function sendAtlasChat(token, message) {
  const response = await fetch(`${API_URL}/api/atlas/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not send Atlas message");
  }

  return data;
}
