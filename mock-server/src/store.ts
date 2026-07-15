export interface StoredToken {
  access_token: string
  scope: string
  fetched_at: number
}

let currentToken: StoredToken | null = null
let lastError: string | null = null

export function setToken(token: StoredToken): void {
  currentToken = token
  lastError = null
}

export function getToken(): StoredToken | null {
  return currentToken
}

export function setError(message: string): void {
  lastError = message
}

export function getError(): string | null {
  return lastError
}
