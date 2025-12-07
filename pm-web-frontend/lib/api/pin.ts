import { pmApiFetch } from "../apiClient"
import { PM_API_BASE_URL } from "@/lib/config"
import { getAccessToken } from "@/lib/authToken"

export interface PinStatus {
  isSet: boolean
  isLocked: boolean
  lockedUntil: string | null
  failedAttempts: number
}

export interface PinResponse {
  message: string
  lockedUntil?: string
}

/**
 * Get current user's PIN status
 */
export async function getPinStatus(): Promise<PinStatus> {
  return await pmApiFetch<PinStatus>("/api/users/me/pin/status")
}

/**
 * Set or update PIN for current user
 */
export async function setPin(pin: string): Promise<PinResponse> {
  return await pmApiFetch<PinResponse>("/api/users/me/pin", {
    method: "POST",
    body: JSON.stringify({ pin }),
  })
}

/**
 * Verify PIN for current user
 */
export async function verifyPin(pin: string): Promise<PinResponse> {
  const token = getAccessToken()
  
  const response = await fetch(`${PM_API_BASE_URL}/api/users/me/pin/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ pin }),
  })

  const data = await response.json()

  if (response.status === 423) {
    // Locked
    throw new PinLockedError(data.message, data.lockedUntil)
  }

  if (!response.ok) {
    throw new Error(data.message || "PIN verification failed")
  }

  return data
}

/**
 * Custom error for locked PIN
 */
export class PinLockedError extends Error {
  constructor(
    message: string,
    public lockedUntil: string
  ) {
    super(message)
    this.name = "PinLockedError"
  }
}

