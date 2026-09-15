export class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new HttpError(response.status === 404 ? 'Not found' : 'Request failed', response.status)
  }
  return (await response.json()) as T
}
