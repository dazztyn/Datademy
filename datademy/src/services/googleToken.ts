let _token: string | null = null

export function setGoogleToken(token: string): void {
  _token = token
}

export function getGoogleToken(): string | null {
  return _token
}

export function clearGoogleToken(): void {
  _token = null
}