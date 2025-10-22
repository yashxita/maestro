export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem("auth_token")
}

export async function setAuthToken(token: string): Promise<void> {
  if (typeof window === "undefined") {
    return
  }
  localStorage.setItem("auth_token", token)
}

export async function clearAuthToken(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }
  localStorage.removeItem("auth_token")
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()

  const headers = new Headers(options.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
