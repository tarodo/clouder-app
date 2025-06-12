import { config } from "@/config"
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth"

interface TokenResponse {
  access_token: string
  refresh_token?: string | null
}

let refreshPromise: Promise<string> | null = null

async function doRefreshToken(): Promise<string> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error("No refresh token")

    const response = await fetch(`${config.api.baseUrl}/refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) throw new Error("Failed to refresh token")

    const newTokens: TokenResponse = await response.json()
    setTokens(newTokens.access_token, newTokens.refresh_token)
    return newTokens.access_token
  } catch (error) {
    clearTokens()
    window.location.href = "/"
    throw new Error("Session expired. Please log in again.")
  } finally {
    refreshPromise = null
  }
}

function getNewToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefreshToken()
  }
  return refreshPromise
}

// For Spotify API (and future backend APIs that use Bearer token)
export async function spotifyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response = await fetch(input, { ...init, headers })

  if (response.status === 401) {
    try {
      const newToken = await getNewToken()
      headers.set("Authorization", `Bearer ${newToken}`)
      response = await fetch(input, { ...init, headers })
    } catch (refreshError) {
      // The refresh function already handles redirecting, but we can throw to stop execution.
      throw refreshError
    }
  }

  return response
}

// For clouder API endpoints that need a token in query params
export async function clouderTokenizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input.toString())
  const token = getAccessToken()
  if (token) {
    url.searchParams.set("sp_token", token)
  }
  let response = await fetch(url, init)

  if (response.status === 401) {
    try {
      const newToken = await getNewToken()
      url.searchParams.set("sp_token", newToken)
      response = await fetch(url, init)
    } catch (refreshError) {
      throw refreshError
    }
  }

  return response
} 